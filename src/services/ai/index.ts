import { AIProvider, AISDRInput, AIStructuredResponse, AIProviderStatus } from './types';
import { OpenAIProvider } from './openaiProvider';
import { GeminiProvider } from './geminiProvider';

const providers: AIProvider[] = [
  new OpenAIProvider(),
  new GeminiProvider()
];

export function getActiveAIProvider(): AIProvider | null {
  for (const provider of providers) {
    if (provider.isAvailable()) {
      return provider;
    }
  }
  return null;
}

export function getAIStatus(): AIProviderStatus {
  const active = getActiveAIProvider();
  if (active) {
    return {
      isConfigured: true,
      providerName: active.name,
      model: active.model,
      message: `Provedor ${active.name} (${active.model}) ativo no servidor.`
    };
  }

  return {
    isConfigured: false,
    providerName: 'Nenhum (Modo Determinístico)',
    model: 'N/A',
    message: 'Nenhum provedor de IA configurado (.env.local). Adicione OPENAI_API_KEY ou GEMINI_API_KEY para respostas da IA real.'
  };
}

export async function generateSDRReply(input: AISDRInput): Promise<{
  providerName: string;
  isConfigured: boolean;
  response?: AIStructuredResponse;
  message: string;
}> {
  const activeProvider = getActiveAIProvider();

  if (!activeProvider) {
    const status = getAIStatus();
    return {
      providerName: 'Nenhum',
      isConfigured: false,
      message: status.message
    };
  }

  try {
    const res = await activeProvider.generateSDRResponse(input);
    return {
      providerName: activeProvider.name,
      isConfigured: true,
      response: res,
      message: 'Resposta da IA gerada com sucesso.'
    };
  } catch (err: any) {
    console.error(`[AIProvider Error - ${activeProvider.name}]:`, err);
    return {
      providerName: activeProvider.name,
      isConfigured: false,
      message: `Erro ao comunicar com ${activeProvider.name}: ${err.message}`
    };
  }
}

export * from './types';
