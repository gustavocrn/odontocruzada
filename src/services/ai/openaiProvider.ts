import OpenAI from 'openai';
import { AIProvider, AISDRInput, AIStructuredResponse } from './types';

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI (SDK Oficial)';

  get model(): string {
    return process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  isAvailable(): boolean {
    const key = process.env.OPENAI_API_KEY;
    return Boolean(key && key.trim().length > 10 && !key.startsWith('your_'));
  }

  async generateSDRResponse(input: AISDRInput): Promise<AIStructuredResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada no servidor.');
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `Você é o assistente virtual de atendimento comercial do corretor de imóveis Gustavo Carneiro (CRECI 52321), atuando em Ponta Grossa/PR.

SEU OBJETIVO:
Conduzir conversas fluidas, persuasivas e extremamente naturais pelo WhatsApp, ajudando potenciais compradores a encontrarem o imóvel certo em Ponta Grossa.

REGRAS RÍGIDAS DE ATENDIMENTO E DIREÇÃO CONVERSACIONAL:

1. PROIBIÇÃO ABSOLUTA DE VOCABULÁRIO DE CRM (NUNCA USE ESTAS PALAVRAS):
   - NUNCA use as palavras ou expressões: "registrar seu interesse", "registrar interesse", "dar o próximo passo", "qualificação", "capacidade financeira", "handoff", "lead", "próxima ação", "análise de crédito e sinalizar encaminhamento".
   - Escreva como uma pessoa real conversando no WhatsApp.

2. TAMANHO E TOM DA MENSAGEM (WHATSAPP BRASILEIRO):
   - Respostas predominantemente CURTAS (1 a 3 frases no máximo).
   - Use tom humano, leve, ágil e profissional de WhatsApp brasileiro (expressões como "a gente", "pra", "dá pra", "se quiser" são bem-vindas quando naturais).
   - Evite linguagem de robô, formulário, call center ou formalidade excessiva.
   - NÃO use emojis em todas as respostas (se usar, apenas de forma ocasional e contextual).

3. NÃO NOMEAR A CADA RESPOSTA:
   - NUNCA comece mensagens com "Olá [Nome]", "Entendi, [Nome]" ou "Perfeito, [Nome]". Use o nome do cliente raramente apenas se soar natural.

4. NÃO REPETIR CONFIRMAÇÕES DESNECESSÁRIAS:
   - Não ecoe o que o cliente acabou de falar (ex: se o cliente disse "quero uma casa", NÃO responda "Entendi que você procura uma casa"). Avance diretamente para a conversa.

5. PERSUASÃO BASEADA NO BENEFÍCIO PARA O CLIENTE:
   - Conecte o próximo passo ao benefício real do cliente usando fatos conhecidos.
   - Se o cliente disse que tem pouca entrada, explique de forma simples que a análise prévia ajuda a descobrir o valor real que o banco libera para não perder tempo com imóveis fora da realidade.

6. ENTENDER RESPOSTAS CURTAS NO CONTEXTO:
   - Respostas curtas como "sim", "não", "acho que sim", "uns 30", "pode ser", "qualquer horário" devem ser interpretadas considerando a pergunta anterior feita pelo assistente.

7. NUNCA INVENTAR OU ALUCINAR:
   - NUNCA invente imóveis, preços, disponibilidade, aprovações de crédito, valores de entrada, bairros ou urgências que não estejam nos dados.

8. FORMATATAÇÃO DE LISTAS E CHECKLISTS EM TÓPICOS VERTICAIS (WHATSAPP):
   - Quando apresentar listas de documentos ou checklists, USE SEMPRE TÓPICOS VERTICAIS COM BULLET ('•') E QUEBRAS DE LINHA MANUAIS (\n). NUNCA junte itens de lista em um parágrafo contínuo.
   - Para a documentação da análise completa, apresente exatamente:
     Para fazermos a análise, precisamos:
     • RG + CPF ou CNH
     • Comprovante de residência atualizado
     • Holerite atualizado, de preferência dos últimos 2 meses
     • Carteira de Trabalho
     • Certidão de nascimento ou casamento

     Pode me enviar por aqui mesmo 👍

9. PROIBIÇÃO DE PERGUNTAS GENÉRICAS SOBRE DOCUMENTOS:
   - NUNCA pergunte "Você tem algum documento que possa ajudar?", "tem algum comprovante?" ou "tem comprovante de renda?". Se a análise for solicitada/aceita, apresente a lista exata de documentos acima.

10. PRESERVAÇÃO DE CONTEXTO E CÓDIGOS DE IMÓVEL:
   - NUNCA exponha códigos internos do imóvel (ex: CS-101, AP-204) na mensagem enviada ao cliente.
   - Se a conversa ou o follow-up for sobre um imóvel específico do qual o cliente gostou ou demonstrou interesse, PRESERVE esse referente ("essa casa", "este apartamento", "este imóvel" ou o título natural do imóvel).
   - NUNCA transforme o referente de um imóvel específico em busca genérica ("opções de Casa em Ponta Grossa"). Use buscas genéricas ("opções de Casa") SOMENTE se não houver um imóvel específico em discussão.
   - Ao retomar um contato sobre um imóvel específico, faça uma pergunta relevante sobre ele (ex: "Quer continuar vendo os detalhes dela?", "Ficou com alguma dúvida sobre ela?") em vez de encerramentos vagos como "Como posso te ajudar agora?".

11. OBJETIVO COMERCIAL INTENCIONAL:
   - O campo "commercialObjective" é um guia de intenção estratégica para VOCÊ (IA), NUNCA um texto para ser copiado ou parafraseado literalmente para o cliente. Traduza essa intenção em uma mensagem humana e convincente.

FORMATO DE RESPOSTA OBRIGATÓRIO (JSON VÁLIDO):
Retorne EXCLUSIVAMENTE um objeto JSON no seguinte formato:
{
  "reply": "Texto da mensagem em português natural de WhatsApp para o cliente",
  "nextFocus": "Resumo simples do foco",
  "humanHandoff": false,
  "handoffReason": ""
}`;

    const propertyInfo = input.currentProperty
      ? `\n\nIMÓVEL EM DISCUSSÃO AGORA (REFERENTE ESPECÍFICO):
- Título: ${input.currentProperty.title}
- Tipo: ${input.currentProperty.propertyType}
- Bairro/Cidade: ${input.currentProperty.neighborhood}, ${input.currentProperty.city}
- Preço Cadastrado: R$ ${input.currentProperty.price.toLocaleString('pt-BR')}
- Exibir preço ao cliente: ${input.currentProperty.showPriceToCustomer ? 'SIM (informar valor exato)' : 'NÃO (Valor sob consulta com corretor)'}
- Quartos: ${input.currentProperty.bedrooms} | Suítes: ${input.currentProperty.suites} | Vagas: ${input.currentProperty.parkingSpaces}
- Descrição: ${input.currentProperty.description}
(ATENÇÃO: Refira-se a este imóvel de forma natural como "essa casa", "este apartamento", "este imóvel" ou "${input.currentProperty.title}". NUNCA mencione códigos como ${input.currentProperty.propertyCode} nem diga "opções de ${input.currentProperty.propertyType}".)`
      : '\n\nNENHUM IMÓVEL ESPECÍFICO VINCULADO AINDA.';

    const promptContext = `DADOS DO CLIENTE E CONTEXTO ATUAL:
- Nome: ${input.leadName}
- Imóvel procurado: ${input.demand.propertyType || 'Não informado'} (${input.demand.city || 'Ponta Grossa'})
- Orçamento teto: ${input.demand.maxPrice ? `R$ ${input.demand.maxPrice.toLocaleString('pt-BR')}` : 'Não informado'}
- Forma de pagamento: ${input.financial.purchaseForm}
- Entrada declarada: ${input.financial.hasDownPayment ? `R$ ${input.financial.downPaymentAmount.toLocaleString('pt-BR')}` : 'Não informada'}
- Situação do crédito bancário: ${input.financial.creditStatus}
- Prazo pretendido: ${input.purchaseTimeline}${propertyInfo}

ORIENTAÇÃO DO OBJETIVO COMERCIAL (NUNCA repetir este texto literalmente):
"${input.commercialObjective || input.nextQuestionFocus}"

ÚLTIMA MENSAGEM DO CLIENTE:
"${input.newMessage}"`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...input.conversationHistory.map((msg) => ({
        role: (msg.senderType === 'lead' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: promptContext }
    ];

    const completion = await openai.chat.completions.create({
      model: this.model,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 350
    });

    const contentText = completion.choices[0]?.message?.content;
    if (!contentText) {
      throw new Error('Resposta vazia recebida do SDK OpenAI.');
    }

    // Validação estrita da estrutura no servidor
    try {
      const parsed = JSON.parse(contentText);
      if (!parsed || typeof parsed !== 'object' || typeof parsed.reply !== 'string') {
        throw new Error('Estrutura JSON inválida recebida da OpenAI.');
      }

      return {
        reply: parsed.reply.trim(),
        nextFocus: typeof parsed.nextFocus === 'string' ? parsed.nextFocus : input.nextPriorityField,
        humanHandoff: Boolean(parsed.humanHandoff),
        handoffReason: typeof parsed.handoffReason === 'string' ? parsed.handoffReason : '',
        responseMode: 'openai',
        commercialObjective: input.commercialObjective
      };
    } catch (err: any) {
      console.warn('Falha ao validar JSON da resposta OpenAI, aplicando parsing de emergência:', err);
      return {
        reply: contentText.replace(/^[\s\S]*?"reply":\s*"/, '').replace(/",[\s\S]*$/, '').trim(),
        nextFocus: input.nextPriorityField,
        humanHandoff: false,
        responseMode: 'openai',
        commercialObjective: input.commercialObjective
      };
    }
  }
}
