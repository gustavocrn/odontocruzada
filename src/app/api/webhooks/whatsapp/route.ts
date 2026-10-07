import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { leadService } from '@/services/leadService';
import { addConversationMessage } from '@/services/sdr/conversationService';
import { enqueueWebhookJob } from '@/services/whatsapp/queueService';
import { MetaWebhookPayload } from '@/services/whatsapp/types';
import { propertyService } from '@/services/propertyService';

/**
 * Normaliza número de telefone para o padrão E.164 sem alterar o 9º dígito arbitrariamente.
 */
export function normalizePhoneToE164(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) {
    return `+${digits}`;
  }
  return `+55${digits}`;
}

/**
 * Valida a assinatura HMAC SHA-256 enviada pela Meta no cabeçalho x-hub-signature-256.
 */
function verifyMetaHmacSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_WA_APP_SECRET;
  if (!appSecret || !appSecret.trim()) {
    // Se a secret não estiver configurada no servidor, rejeita a requisição por segurança
    return false;
  }

  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = signatureHeader.substring(7);
  const hmac = crypto.createHmac('sha256', appSecret.trim());
  const calculatedSignature = hmac.update(rawBody).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * GET: Endpoint de Verificação Inicial do Webhook da Meta (Webhook Verification Challenge).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const configuredVerifyToken = process.env.META_WA_VERIFY_TOKEN;

  if (mode === 'subscribe' && token && configuredVerifyToken && token === configuredVerifyToken.trim()) {
    return new Response(challenge || '', { status: 200 });
  }

  return NextResponse.json(
    { success: false, error: 'Falha na verificação do token do webhook (hub.verify_token mismatch).' },
    { status: 403 }
  );
}

/**
 * POST: Endpoint de Recebimento de Eventos Reais da Meta Cloud API.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('x-hub-signature-256');

    // 1. VALIDAÇÃO DE SEGURANÇA (HMAC SHA-256)
    const isSignatureValid = verifyMetaHmacSignature(rawBody, signatureHeader);
    if (!isSignatureValid) {
      return NextResponse.json(
        { success: false, error: 'Assinatura HMAC inválida ou ausente (x-hub-signature-256).' },
        { status: 401 }
      );
    }

    let payload: MetaWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: 'JSON payload inválido.' }, { status: 400 });
    }

    // 2. PROCESSAR NOTIFICAÇÕES DE MENSAGENS E STATUS DA META
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0]?.value;

    if (!change) {
      return NextResponse.json({ success: true, message: 'Evento ignorado (sem alterações).' });
    }

    // 2.1 TRATAR STATUS DE ENTREGA/LEITURA (sent, delivered, read, failed)
    if (change.statuses && change.statuses.length > 0) {
      for (const statusEvent of change.statuses) {
        const wamid = statusEvent.id;
        const newStatus = statusEvent.status;

        // Atualiza status da mensagem outbound no banco (não renova a janela de 24h!)
        if (isSupabaseConfigured() && supabase) {
          const updateData: any = { status: newStatus };
          if (newStatus === 'failed' && statusEvent.errors?.[0]) {
            const err = statusEvent.errors[0];
            updateData.error_code = String(err.code || 'META_DELIVERY_FAILED');
            updateData.error_message = String(err.title || 'Falha na entrega Meta').substring(0, 200);
          }

          await supabase
            .from('conversation_messages')
            .update(updateData)
            .eq('external_id', wamid);
        }
      }

      // Notificações de status finalizam rapidamente com HTTP 200 OK sem disparar o SDR
      return NextResponse.json({ success: true, message: 'Status de entrega atualizado com sucesso.' });
    }

    // 2.2 TRATAR MENSAGENS INBOUND REAIS DO CLIENTE
    const messageEvent = change.messages?.[0];
    if (!messageEvent) {
      return NextResponse.json({ success: true, message: 'Evento sem mensagens ignorado.' });
    }

    const wamid = messageEvent.id;
    const rawFrom = messageEvent.from;
    const contactInfo = change.contacts?.[0];
    const waId = contactInfo?.wa_id || rawFrom;
    const profileName = contactInfo?.profile?.name || 'Cliente WhatsApp';

    const phoneE164 = normalizePhoneToE164(waId);

    // 3. IDENTIFICAR OU CRIAR LEAD DE MANEIRA SEGURA (SEM DUPLICAR POR CONCORRÊNCIA)
    let lead = await leadService.getLeadByWaIdOrPhone(waId, phoneE164);

    const referral = messageEvent.referral;
    const metaAdId = referral?.source_id || undefined;
    const ctwaClid = referral?.ctwa_clid || undefined;

    if (!lead) {
      // Se houver anúncio associado (CTWA), tenta vincular o imóvel cadastrado
      let matchedPropertyId: string | undefined = undefined;
      if (metaAdId) {
        const activeAdProps = await propertyService.getActiveAdProperties();
        const matched = activeAdProps.find((p) => p.metaAdId === metaAdId);
        if (matched) {
          matchedPropertyId = matched.id;
        }
      }

      lead = await leadService.createLead({
        name: profileName,
        phone: phoneE164,
        waId,
        source: 'WhatsApp',
        metaAdId,
        ctwaClid,
        currentPropertyId: matchedPropertyId,
        campaign: metaAdId ? 'Anúncio Meta CTWA' : 'Origem não identificada'
      });
    }

    // 4. ATUALIZAR RENOVAÇÃO ESTREITA DA JANELA DE 24 HORAS (SOMENTE EM MENSAGEM INBOUND VÁLIDA)
    const nowIso = new Date().toISOString();
    const windowExpiryIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await leadService.updateLead(lead.id, {
      lastClientMessageAt: nowIso,
      whatsappWindowExpiresAt: windowExpiryIso
    });

    // 5. DETERMINAR CONTEÚDO E MÍDIA DA MENSAGEM
    let messageContent = '';
    let mediaMetadata: any = undefined;

    if (messageEvent.type === 'text' && messageEvent.text?.body) {
      messageContent = messageEvent.text.body.trim();
    } else if (messageEvent.type === 'image') {
      messageContent = '[Imagem recebida]';
      mediaMetadata = {
        metaMediaId: messageEvent.image?.id,
        mimeType: messageEvent.image?.mime_type || 'image/jpeg',
        mediaType: 'unclassified_media'
      };
    } else if (messageEvent.type === 'document') {
      const fileName = messageEvent.document?.filename || 'documento.pdf';
      // ATENÇÃO: O filename cnh.pdf isolado NÃO marca a CNH como recebida! Permanece unclassified_media
      messageContent = `[Documento recebido: ${fileName}]`;
      mediaMetadata = {
        metaMediaId: messageEvent.document?.id,
        mimeType: messageEvent.document?.mime_type || 'application/pdf',
        originalFilename: fileName,
        mediaType: 'unclassified_media'
      };
    } else if (messageEvent.type === 'audio') {
      messageContent = '[Áudio recebido]';
      mediaMetadata = {
        metaMediaId: messageEvent.audio?.id,
        mimeType: messageEvent.audio?.mime_type || 'audio/ogg',
        mediaType: 'unclassified_media'
      };
    } else {
      messageContent = `[Mensagem do tipo ${messageEvent.type} recebida]`;
    }

    // 6. PERSISTIR MENSAGEM INBOUND DE MANEIRA ATÔMICA E IDEMPOTENTE (external_id = wamid ÚNICO)
    const insertedMessage = await addConversationMessage(
      lead.id,
      'inbound',
      'lead',
      messageContent,
      wamid,
      { status: 'received', ...(mediaMetadata || {}) }
    );

    // Se insertedMessage for nulo ou se o wamid já existir, a idempotência capturou a duplicidade
    if (!insertedMessage) {
      return NextResponse.json({
        success: true,
        message: 'Mensagem duplicada capturada por idempotência atômica.'
      });
    }

    // 7. ENFILEIRAR TRABALHO APONTANDO APENAS PARA O conversation_message_id (SEM DUPLICAR TEXTO/PII NA FILA)
    const queuedJob = await enqueueWebhookJob(insertedMessage.id, 'process_inbound_sdr');

    return NextResponse.json({
      success: true,
      message: 'Mensagem inbound recebida, persistida e enfileirada com sucesso.',
      wamid,
      jobId: queuedJob?.id
    });

  } catch (error: any) {
    console.error('Erro no webhook do WhatsApp:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno no processamento do webhook.' },
      { status: 500 }
    );
  }
}
