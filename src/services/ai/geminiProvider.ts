import { AIProvider, AISDRInput, AIStructuredResponse } from './types';

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini';
  model = 'gemini-1.5-flash';

  isAvailable(): boolean {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    return Boolean(key && key.trim().length > 10 && !key.startsWith('your_'));
  }

  async generateSDRResponse(input: AISDRInput): Promise<AIStructuredResponse> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada no servidor.');
    }

    const systemPrompt = `Você é o SDR (atendente virtual) oficial do corretor Gustavo Carneiro (CRECI 52321), em Ponta Grossa/PR.
REGRAS:
1. Resposta em 1 a 3 frases curtas e amigáveis em português brasileiro.
2. Faça apenas 1 pergunta por vez focada em "${input.nextQuestionFocus}".
3. Não repita dados já conhecidos.
4. Retorne obrigatoriamente um objeto JSON com as chaves "reply", "nextFocus", "humanHandoff" e "handoffReason".`;

    const promptText = `${systemPrompt}

DADOS ATUAIS DO LEAD:
- Nome: ${input.leadName}
- Imóvel procurado: ${input.demand.propertyType || 'Não informado'}
- Orçamento max: ${input.demand.maxPrice || 'Não informado'}
- Forma de pagamento: ${input.financial.purchaseForm}
- Entrada: ${input.financial.downPaymentAmount || 'Não informado'}
- Crédito: ${input.financial.creditStatus}
- Próximo foco: ${input.nextQuestionFocus}

ÚLTIMA MENSAGEM DO CLIENTE:
"${input.newMessage}"`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro na API Gemini (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!contentText) {
      throw new Error('Resposta vazia do Gemini.');
    }

    try {
      const parsed = JSON.parse(contentText);
      return {
        reply: parsed.reply || 'Olá! Como posso te ajudar a encontrar seu imóvel em Ponta Grossa?',
        nextFocus: parsed.nextFocus || input.nextQuestionFocus,
        humanHandoff: Boolean(parsed.humanHandoff),
        handoffReason: parsed.handoffReason || ''
      };
    } catch {
      return {
        reply: contentText,
        nextFocus: input.nextQuestionFocus,
        humanHandoff: false
      };
    }
  }
}
