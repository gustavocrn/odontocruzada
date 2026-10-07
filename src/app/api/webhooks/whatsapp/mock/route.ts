import { NextRequest, NextResponse } from 'next/server';

/**
 * POST: Endpoint de Teste Mock Local para simular envios de Webhook da Meta.
 * PROIBIDO EM PRODUÇÃO: Retorna HTTP 404 incondicionalmente em ambiente de produção.
 */
export async function POST(req: NextRequest) {
  // PROIBIÇÃO ABSOLUTA EM PRODUÇÃO
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Endpoint indisponível em ambiente de produção.' },
      { status: 404 }
    );
  }

  // Em ambiente de desenvolvimento ou teste, exige a chave secreta MOCK_WEBHOOK_SECRET
  const mockSecretHeader = req.headers.get('x-mock-secret');
  const configuredSecret = process.env.MOCK_WEBHOOK_SECRET;

  if (!configuredSecret || !mockSecretHeader || mockSecretHeader.trim() !== configuredSecret.trim()) {
    return NextResponse.json(
      { success: false, error: 'Acesso não autorizado ao mock de teste (x-mock-secret incorreto ou não configurado).' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    return NextResponse.json({
      success: true,
      message: 'Payload mock recebido com sucesso no ambiente de teste local.',
      receivedPayload: body
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Payload JSON mock inválido.' },
      { status: 400 }
    );
  }
}
