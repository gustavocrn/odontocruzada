import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processNextWhatsAppJobs } from '@/services/whatsapp/whatsappWorker';

/**
 * Validação segura em tempo constante para o segredo CRON_SECRET.
 */
function verifyCronSecret(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !cronSecret.trim()) {
    // Fail closed se a variável de ambiente não estiver configurada no servidor
    return false;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7).trim();
  const expectedSecret = cronSecret.trim();

  const tokenBuffer = Buffer.from(token, 'utf-8');
  const expectedBuffer = Buffer.from(expectedSecret, 'utf-8');

  if (tokenBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
}

/**
 * POST: Endpoint Privado Server-Side para Drenagem da webhook_queue.
 * Protegido por Authorization: Bearer <CRON_SECRET>.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    // 1. Validação estrita de autorização (Fail-Closed)
    if (!verifyCronSecret(authHeader)) {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado ao processador interno de fila.' },
        { status: 401 }
      );
    }

    // 2. Extrai parâmetros opcionais da query string (batch limit e workerId)
    const url = new URL(req.url);
    const limitParam = parseInt(url.searchParams.get('limit') || '10', 10);
    const limit = isNaN(limitParam) || limitParam <= 0 ? 10 : Math.min(limitParam, 50);
    const workerId = url.searchParams.get('worker_id') || 'vercel_serverless_worker';

    // 3. Executa a drenagem de trabalhos via claim atômico
    const result = await processNextWhatsAppJobs(limit, workerId);

    // 4. Retorna resposta com resumo operacional sanitizado (sem vazar segredos)
    return NextResponse.json({
      success: true,
      summary: {
        processedCount: result.processedCount,
        completedCount: result.completedCount,
        failedCount: result.failedCount,
        jobResults: result.jobResults.map((j) => ({
          jobId: j.jobId,
          status: j.status,
          reason: j.reason ? j.reason.substring(0, 150) : undefined
        }))
      }
    });

  } catch (error: any) {
    console.error('Erro no processador interno de webhook_queue:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar fila de trabalhos.' },
      { status: 500 }
    );
  }
}
