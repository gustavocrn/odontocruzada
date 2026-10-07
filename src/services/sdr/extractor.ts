import { ExtractedDemand, ExtractedFinancial, ExtractedScheduleIntent } from './types';
import { PurchaseTimeline, CreditStatus, PurchaseForm, ConversationMessage } from '@/types';

/**
 * Converte expressões monetárias em texto para número.
 * Ex: "500 mil" -> 500000 | "500k" -> 500000 | "R$ 500 mil" -> 500000 | "1.5 milhão" -> 1500000 | "R$ 450.000" -> 450000
 */
export function parseMoneyValue(text: string): number | null {
  if (!text) return null;
  const cleaned = text.toLowerCase().replace(/\s+/g, ' ').trim();

  // Ex: R$ 500 mil, R$ 500.000, 500 mil, 500k, 1,5 milhão
  const match = cleaned.match(/(?:r\$\s*)?([\d\.,]+)\s*(mil|k|milhões|milhao|m)?\b/i);
  if (match) {
    const rawStr = match[1].replace(/\./g, '').replace(',', '.');
    let val = parseFloat(rawStr);
    const unit = match[2]?.toLowerCase();
    if (!isNaN(val)) {
      if (unit === 'mil' || unit === 'k') {
        val *= 1000;
      } else if (unit && (unit.startsWith('milh') || unit === 'm')) {
        val *= 1000000;
      } else if (val < 1000 && /\b(mil|k)\b/i.test(cleaned)) {
        val *= 1000;
      }
      return val;
    }
  }

  return null;
}

/**
 * Extrai o valor máximo/orçamento pretendido do imóvel.
 */
export function extractMaxPrice(text: string): number | null {
  const lower = text.toLowerCase();

  // 1. Procura termos como "até R$ 500 mil", "até 500k", "orçamento de 500 mil", "máximo 600k"
  const ateMatch = lower.match(/(?:até|maximo|máximo|orçamento|limite)\s*(?:de|até)?\s*(?:r\$\s*)?([\d\.,]+)\s*(mil|k|milhões|milhao|m)?\b/i);
  if (ateMatch) {
    const numStr = ateMatch[1];
    const unit = ateMatch[2];
    const moneyStr = unit ? `${numStr} ${unit}` : numStr;
    const parsed = parseMoneyValue(moneyStr);
    if (parsed && parsed >= 10000) return parsed;
  }

  // 2. Procura qualquer indicação de valor monetário isolado que não seja entrada, fgts ou aprovado
  const generalMatches = Array.from(lower.matchAll(/(?:r\$\s*)?([\d\.,]+)\s*(mil|k|milhões|milhao|m)\b/gi));
  for (const m of generalMatches) {
    const fullSnippet = m[0];
    const idx = m.index || 0;
    const surrounding = lower.substring(Math.max(0, idx - 25), Math.min(lower.length, idx + 45));
    if (!/entrada|fgts|aprovado|simul/i.test(surrounding)) {
      const parsed = parseMoneyValue(fullSnippet);
      if (parsed && parsed >= 50000) return parsed;
    }
  }

  return null;
}

/**
 * Extrai valor da entrada.
 * Expressões vagas (quase não tenho entrada, pouca entrada, etc.) NÃO geram valor quantificado nem autorizam assumir entrada.
 */
export function extractDownPayment(text: string): { hasDownPayment: boolean; amount: number } | null {
  const lower = text.toLowerCase();

  // Vague / negative / unquantified phrases
  if (/\b(quase não|quase nao|pouca entrada|pouco de entrada|não sei quanto|nao sei quanto|não tenho entrada|nao tenho entrada|sem entrada)\b/i.test(lower)) {
    return { hasDownPayment: false, amount: 0 };
  }

  const match = lower.match(/(?:tenho|dar|com|entrada|recursos)?\s*(?:de\s*)?(?:r\$\s*)?([\d\.,]+)\s*(mil|k|milhões|milhao|m)?\s*(?:de|para|na|para dar de)?\s*entrada/i);
  if (match) {
    const numStr = match[1];
    const unit = match[2];
    const moneyStr = unit ? `${numStr} ${unit}` : numStr;
    const parsed = parseMoneyValue(moneyStr);
    if (parsed && parsed > 0) {
      return { hasDownPayment: true, amount: parsed };
    }
  }

  if (/\b(dar de entrada|tenho entrada de|entrada de)\b/i.test(lower)) {
    return { hasDownPayment: true, amount: 0 };
  }

  return null;
}

/**
 * Extrai intenção de demanda imobiliária a partir da mensagem do lead.
 */
export function extractDemandFromText(text: string): ExtractedDemand {
  const extracted: ExtractedDemand = {};
  const lower = text.toLowerCase();

  // Verificação de Terreno como característica (espacinho de terreno, quintal, etc.) vs Tipo de Imóvel
  const isIncidentalTerreno = /(espacinho de terreno|espaço de terreno|espaco de terreno|pouco de terreno|terreno nos fundos|terreno grande|terreno pequeno|terreno na frente|com terreno|espaço externo|espaco externo|quintal|espaço atrás|espaco atras)/i.test(lower);
  const isExplicitTerrenoIntent = /(procuro|quero|comprar|pode ser|buscando|procurando)\s+(um\s+)?(terreno|lote)\b/i.test(lower) || /^(terreno|terrenos|lote|lotes)$/i.test(lower.trim());

  if (isIncidentalTerreno) {
    if (!extracted.keyFeatures) extracted.keyFeatures = [];
    extracted.keyFeatures.push('espaço de terreno');
  }

  // Tipo de Imóvel
  if (/\b(casa em condomínio|casa em condominio)\b/.test(lower)) {
    extracted.propertyType = 'Casa em Condomínio';
  } else if (/\b(sobrado|sobrados)\b/.test(lower)) {
    extracted.propertyType = 'Sobrado';
  } else if (/\b(apartamento|apartamentos|apê|ape|ap)\b/.test(lower)) {
    extracted.propertyType = 'Apartamento';
  } else if (/\b(cobertura|coberturas)\b/.test(lower)) {
    extracted.propertyType = 'Cobertura';
  } else if (/\b(chácara|chacara|sítio|sitio)\b/.test(lower)) {
    extracted.propertyType = 'Chácara';
  } else if (isExplicitTerrenoIntent || (/\b(terreno|terrenos|lote|lotes)\b/.test(lower) && !isIncidentalTerreno)) {
    extracted.propertyType = 'Terreno';
  } else if (/\b(casa|casas)\b/.test(lower) || (isIncidentalTerreno && !isExplicitTerrenoIntent)) {
    extracted.propertyType = 'Casa';
  }

  // Número de quartos
  const bedsMatch = lower.match(/(\d+)\s*(quarto|quartos|dormitório|dormitorios|dormitórios|qts|qt)/);
  if (bedsMatch) {
    extracted.bedrooms = parseInt(bedsMatch[1], 10);
  }

  // Suíte
  if (/\b(suíte|suite|suítes|suites|com suíte|com suite)\b/.test(lower)) {
    extracted.needsSuite = true;
  }

  // Vagas de garagem
  const parkingMatch = lower.match(/(\d+)\s*(vaga|vagas|garagem|garagens)/);
  if (parkingMatch) {
    extracted.parkingSpaces = parseInt(parkingMatch[1], 10);
  } else if (/\b(garagem|com garagem)\b/.test(lower)) {
    extracted.parkingSpaces = 1;
  }

  // Finalidade
  if (/\b(investir|investimento|alugar|renda)\b/.test(lower)) {
    extracted.purpose = 'Investimento';
  } else if (/\b(morar|moradia|minha casa|viver|residir)\b/.test(lower)) {
    extracted.purpose = 'Moradia';
  }

  // Cidade
  const cities = ['Ponta Grossa', 'Castro', 'Carambeí', 'Curitiba', 'Guarapuava', 'Telêmaco Borba'];
  for (const city of cities) {
    if (new RegExp(`\\b${city.toLowerCase()}\\b`).test(lower)) {
      extracted.city = city;
      break;
    }
  }

  // Bairros de Ponta Grossa / Regiões
  const knownRegions = [
    'Vila Estrela',
    'Jardim Carvalho',
    'Oficinas',
    'Uvaranas',
    'Estrela',
    'Centro',
    'Neves',
    'Contorno',
    'Olarias',
    'Santa Paula',
    'Nova Rússia',
    'Terraliz'
  ];
  const matchedRegions: string[] = [];
  for (const reg of knownRegions) {
    if (new RegExp(`\\b${reg.toLowerCase()}\\b`).test(lower)) {
      matchedRegions.push(reg);
    }
  }
  if (matchedRegions.length > 0) {
    extracted.regions = matchedRegions;
  }

  // Faixa de Preço Máxima
  const maxPrice = extractMaxPrice(text);
  if (maxPrice) {
    extracted.maxPrice = maxPrice;
  }

  return extracted;
}

/**
 * Extrai preferência de dia/período para visita presencial ao imóvel.
 */
export function extractVisitPreference(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  const match =
    lower.match(/(sábado|sabado|domingo|fim de semana|fins de semana|segunda|terça|terca|quarta|quinta|sexta|amanhã|amanha|hoje|durante a semana)\s*(de manhã|de manha|à tarde|a tarde|à noite|a noite|de tarde|pela manhã|pela manha|pela tarde)?/i) ||
    lower.match(/(de manhã|de manha|à tarde|a tarde|à noite|a noite|período da tarde|periodo da tarde|período da manhã|periodo da manha)/i);

  if (match) {
    return match[0].trim();
  }
  return null;
}

/**
 * Extrai qualificação financeira a partir da mensagem do lead e do histórico conversacional prévio.
 */
export function extractFinancialFromText(
  text: string,
  conversationHistory: ConversationMessage[] = []
): ExtractedFinancial {
  const extracted: ExtractedFinancial = {};
  const lower = text.toLowerCase().trim();

  // Encontra a última mensagem enviada pelo SDR / IA no histórico para análise contextual
  const lastOutbound = [...conversationHistory]
    .reverse()
    .find((m) => m.senderType === 'ai' || m.senderType === 'human' || m.direction === 'outbound');
  const lastOutboundText = lastOutbound?.content?.toLowerCase() || '';

  // 1. FORMA DE PAGAMENTO & RECURSOS PRÓPRIOS
  const hasFinancing = /\b(financiar|financiamento|minha casa minha vida|mcmv|caixa|banco|crédito|credito)\b/.test(lower);
  const hasExplicitCash = /\b(à vista|a vista|dinheiro em mãos|dinheiro guardado)\b/.test(lower);
  const hasExplicitOwnResources = /\b(recursos próprios|recursos proprios|recursos de terceiros|saldo de venda)\b/.test(lower);

  const downPayment = extractDownPayment(text);
  if (downPayment) {
    extracted.hasDownPayment = downPayment.hasDownPayment;
    if (downPayment.amount > 0) {
      extracted.downPaymentAmount = downPayment.amount;
    }
  }

  // Apenas atribui 'Financiamento + recursos próprios' se houver valor quantificado de entrada > 0 ou recurso próprio/vista explicitamente declarado.
  if (hasExplicitCash && !hasFinancing) {
    extracted.purchaseForm = 'À vista';
  } else if (hasFinancing && (hasExplicitCash || hasExplicitOwnResources || (downPayment && downPayment.amount > 0))) {
    extracted.purchaseForm = 'Financiamento + recursos próprios';
  } else if (hasFinancing) {
    extracted.purchaseForm = 'Financiamento';
  }

  // 2. FGTS
  if (/\b(fgts|f.g.t.s)\b/.test(lower)) {
    extracted.hasFGTS = true;
    extracted.intendsToUseFGTS = true;

    const fgtsValMatch = lower.match(/(?:r\$\s*)?([\d\.,]+)\s*(mil|k|milhões|m)?\s*(de fgts|no fgts|do fgts|de saldo no fgts)/i) ||
      lower.match(/(?:tenho|com)?\s*(?:r\$\s*)?([\d\.,]+)\s*(mil|k|milhões|m)?\s*de fgts/i);

    if (fgtsValMatch) {
      const numStr = fgtsValMatch[1];
      const unit = fgtsValMatch[2];
      const moneyStr = unit ? `${numStr} ${unit}` : numStr;
      const val = parseMoneyValue(moneyStr);
      if (val !== null && val > 0) {
        extracted.fgtsAmount = val;
      }
    }
  }

  // 3. VEÍCULO OU BEM NA NEGOCIAÇÃO
  if (/\b(carro|veículo|veiculo|moto|troca|aceita carro|dar carro)\b/.test(lower)) {
    extracted.hasVehicleOrAsset = true;
    extracted.assetDescription = 'Veículo / Bem informado no chat';
  }

  // 4. ANÁLISE DE CRÉDITO & RESPOSTAS CONTEXTUAIS
  // Isolar a última frase/pergunta enviada pelo SDR
  const sentences = lastOutboundText.split(/(?<=[?!\.\n])/).map((s) => s.trim()).filter(Boolean);
  const lastQuestion = sentences.length > 0 ? sentences[sentences.length - 1] : lastOutboundText;

  const isAskingAboutCredit = /\b(análise|analise|analisou|simulou|simulação|simulacao|crédito|credito)\b/.test(lastQuestion);
  const isAskingAboutSchedule = /\b(horário|horario|período|periodo|melhor hora|preferência|preferencia|momento|contato)\b/.test(lastQuestion);
  const isOfferingCreditHelp = /\b(ajudar|auxiliar|ajuda|fazer essa análise|fazer essa analise|análise de crédito|analise de credito|podemos te ajudar|entrará em contato|entrara em contato)\b/.test(lastOutboundText);

  const isExplicitCreditRefusal = /(não quero|nao quero|prefiro não|prefiro nao|cancela|sem análise|sem analise|não tenho interesse|nao tenho interesse)/i.test(lower);
  const isNegatingNever = /\b(nunca fiz|não fiz|nao fiz|ainda não|ainda nao|nunca analisei|não analisei|nao analisei|nunca simulei|não simulei|nao simulei)\b/.test(lower) || (lower === 'não' || lower === 'nao');
  const isAcceptingHelp = /\b(sim|quero|pode ser|vamos fazer|vamos|pode|com certeza|sim por favor|pode sim|quero sim)\b/.test(lower);

  if (isAskingAboutSchedule && (lower === 'não' || lower === 'nao' || /\b(não tenho|nao tenho|qualquer|tanto faz|sem preferência|sem preferencia|qualquer horário|qualquer horario)\b/.test(lower))) {
    // Resposta referente a horário/agendamento. NÃO altera o status de análise de crédito.
  } else if (isExplicitCreditRefusal) {
    extracted.creditStatus = 'Não analisado';
    extracted.hasSimulated = false;
    extracted.hasCreditAnalysis = false;
  } else if (isAskingAboutCredit && isNegatingNever && !isAskingAboutSchedule) {
    extracted.creditStatus = 'Não analisado';
    extracted.hasSimulated = false;
    extracted.hasCreditAnalysis = false;
  } else if (isOfferingCreditHelp && isAcceptingHelp) {
    extracted.creditStatus = 'Pretende analisar';
    extracted.hasSimulated = false;
    extracted.hasCreditAnalysis = false;
  } else if (/\b(nunca fiz|não fiz simulação|nao fiz simulacao|ainda não fiz|ainda nao fiz|nunca analisei meu crédito|nunca analisei meu credito)\b/.test(lower)) {
    extracted.creditStatus = 'Não analisado';
    extracted.hasSimulated = false;
    extracted.hasCreditAnalysis = false;
  } else if (/\b(simul|simulei|simulação|fiz simulação)\b/.test(lower) && !isNegatingNever) {
    extracted.hasSimulated = true;
  }

  const isApproved = /\b(aprovado|pré-aprovado|pre-aprovado|crédito aprovado|credito aprovado|aprovada|liberado)\b/.test(lower) && !isNegatingNever;
  if (isApproved) {
    extracted.hasSimulated = true;
    extracted.hasCreditAnalysis = true;

    if (/\b(pré-aprovado|pre-aprovado)\b/.test(lower)) {
      extracted.creditStatus = 'Pré-aprovado';
    } else {
      extracted.creditStatus = 'Aprovado';
    }

    const approvedMatch = lower.match(/(?:r\$\s*)?([\d\.,]+)\s*(mil|k|milhões|m)?\s*(já\s*)?(aprovado|liberado|de crédito)/i);
    if (approvedMatch) {
      const numStr = approvedMatch[1];
      const unit = approvedMatch[2];
      const moneyStr = unit ? `${numStr} ${unit}` : numStr;
      const val = parseMoneyValue(moneyStr);
      if (val && val >= 50000) {
        extracted.approvedAmount = val;
      }
    }
  } else if (/\b(em análise|em analise|analisando)\b/.test(lower) && !isNegatingNever) {
    extracted.creditStatus = 'Em análise';
    extracted.hasCreditAnalysis = true;
  } else if (!isExplicitCreditRefusal && /\b(pretendo analisar|vou analisar|quero simular|quero fazer a análise|quero fazer a analise)\b/.test(lower)) {
    extracted.creditStatus = 'Pretende analisar';
  }

  // Banco
  if (/\bcaixa\b/.test(lower)) extracted.bankInstitution = 'Caixa Econômica Federal';
  else if (/\b(banco do brasil|bb)\b/.test(lower)) extracted.bankInstitution = 'Banco do Brasil';
  else if (/\bbradesco\b/.test(lower)) extracted.bankInstitution = 'Bradesco';
  else if (/\bitaú|itau\b/.test(lower)) extracted.bankInstitution = 'Itaú';
  else if (/\bsantander\b/.test(lower)) extracted.bankInstitution = 'Santander';

  // 6. INTENÇÕES E COMANDOS DO FLUXO DE ANÁLISE DE CRÉDITO & VISITA
  if (
    /(como fazemos a simulação|como faço a simulação|como faço uma simulação|como faço a análise|como faço a analise|como faz a simulação|como faz a analise|vocês fazem análise|voces fazem analise|o que precisa para financiar|o que precisa pra financiar|quais documentos precisa|quais documentos|quais os documentos|como funciona a simulação|como funciona o financiamento|quais os documentos|como funciona para financiar|quanto consigo financiar|quanto dá pra financiar|quanto consigo de financiamento|saber quanto consigo financiar|saber se consigo financiar|quanto preciso de entrada|quanto vou precisar de entrada|como sei quanto vou precisar de entrada|como sei quanto preciso de entrada|não tenho muita entrada|tenho pouca entrada|não sei quanto preciso dar|como faço pra simular|como faz pra simular|quero simular|queria simular|quero fazer uma análise|quero fazer uma analise|quero fazer analise|fazer uma análise de crédito|fazer analise de credito|ver se o financiamento alcança|ver se o financiamento aprova)/i.test(
      lower
    )
  ) {
    extracted.isCreditInquiry = true;
  }

  if (
    /(quero fazer (uma )?análise|quero fazer (uma )?analise|vamos fazer (a )?análise|vamos fazer (a )?analise|quero primeiro ver se o financiamento|primeiro ver se o financiamento|quero ver se o financiamento|fazer (uma )?análise de crédito|fazer (uma )?analise de credito|quero (fazer )?a análise completa|quero (fazer )?a analise completa|quais documentos|quais os documentos|quais documentos precisam|quais documentos preciso|quais são os documentos|quais sao os documentos)/i.test(
      lower
    )
  ) {
    extracted.isDirectFullAnalysisRequest = true;
  }

  if (
    /(prefiro só simular|prefiro so simular|prefiro só fazer uma simulação|prefiro so fazer uma simulacao|quero fazer só a simulação|quero fazer so a simulacao|não quero análise agora|nao quero analise agora|prefiro a simulação simples|tem como fazer uma simulação mais simples|fazer só a simulação|fazer so a simulacao|quero só simular|quero so simular|não quero mandar esses documentos agora|nao quero mandar esses documentos agora)/i.test(
      lower
    )
  ) {
    extracted.isPrefersSimpleSim = true;
  }

  if (
    /\b(pode ser|vamos fazer|manda|o que precisa|quais documentos|pode ser o que precisa|com certeza|vamos|pode sim|manda a lista|quais são os documentos|quais sao os documentos|pode passar|passa a lista)\b/i.test(
      lower
    )
  ) {
    extracted.isAcceptingFullAnalysis = true;
  }

  if (
    /(não quero visitar|nao quero visitar|não quero ir ver|nao quero ir ver|não quero agendar|nao quero agendar|não pretendo visitar|nao pretendo visitar|primeiro ver se o financiamento|primeiro ver o financiamento|antes da visita|antes de visitar)/i.test(
      lower
    )
  ) {
    extracted.isExplicitVisitRefusal = true;
  }

  if (/(pode ser cnh|cnh serve|posso mandar a carteira de motorista|posso enviar a cnh|não tenho rg, pode ser cnh|nao tenho rg, pode ser cnh|carteira de motorista serve|aceita cnh)/i.test(lower)) {
    extracted.isCNHQuestion = true;
  }

  if (/(vou separar|te mando mais tarde|quando chegar em casa|amanhã consigo|amanha consigo|depois eu mando|mando mais tarde|depois envio|vou procurar|mando à noite|mando a noite|assim que puder mando)/i.test(lower)) {
    extracted.isWillSendLater = true;
  }

  if (/(não tenho tudo isso|nao tenho tudo isso|é muita coisa|e muita coisa|não quero mandar esses documentos agora|nao quero mandar esses documentos agora|não tenho minha carteira de trabalho|nao tenho minha carteira de trabalho|muito documento|não tenho ctps|nao tenho ctps|não tenho como mandar tudo isso|nao tenho como mandar tudo isso)/i.test(lower)) {
    extracted.isExplicitDocResistance = true;
  }

  // Extração de agendamento temporal ou recusa estrita
  const sched = extractScheduleIntent(text);
  if (sched) {
    if (sched.explicitRefusal) {
      extracted.isExplicitRefusal = true;
    } else {
      extracted.scheduleIntent = sched;
    }
  }

  // Extração de dados para Simulação Simples (4 itens)
  const bdateMatch = lower.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (bdateMatch) {
    extracted.extractedBirthDate = bdateMatch[1];
  }

  if (/(tenho|possuo|com)\s+(\d+|um|dois|três|tres)?\s*(filho|filhos|dependente|dependentes)/i.test(lower)) {
    extracted.extractedHasDependents = true;
  } else if (/(não tenho dependente|nao tenho dependente|sem dependentes|não tenho filho|nao tenho filho|não tenho dependentes|sem filhos)/i.test(lower)) {
    extracted.extractedHasDependents = false;
  }

  if (/(mais de 3 anos|passa de 3 anos|ultrapassa 3 anos|tenho 3 anos|tenho mais de 3|trabalho há \d+ anos|trabalho ha \d+ anos|\d+ anos de carteira)/i.test(lower)) {
    extracted.extractedWorkYearsOver3 = true;
  } else if (/(não tenho 3 anos|nao tenho 3 anos|menos de 3 anos|não soma 3 anos|nao soma 3 anos|pouco tempo de carteira)/i.test(lower)) {
    extracted.extractedWorkYearsOver3 = false;
  }

  return extracted;
}

/**
 * Extrai agendamento temporal de retorno ou recusa estrita a partir do texto do lead ("me chama amanhã", "fala comigo sexta").
 */
export function extractScheduleIntent(
  text: string,
  referenceDate: Date = new Date()
): ExtractedScheduleIntent | null {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  // 1. Recusa explícita
  if (/(não me ligue|nao me ligue|não me mande|nao me mande|não me perturbe|nao me perturbe|não tenho mais interesse|nao tenho mais interesse|favor cancelar|cancele o atendimento|retire meu número|retire meu numero)/i.test(lower)) {
    return {
      type: 'vague',
      rawText: text,
      explicitRefusal: true
    };
  }

  // Se for intenção explícita de visita presencial (ex: "posso visitar sábado de manhã", "quero agendar visita"), não tratar como agendamento de retorno de contato
  const isVisitContext = /(posso visitar|quero visitar|agendar visita|marcar visita|visita presencial|ver o imóvel|ver o imovel)/i.test(lower);
  const hasCallVerbs = /(chama|fala|ligue|liga|mande|manda|contato|retorne|retorna|retorno)/i.test(lower);

  if (isVisitContext && !hasCallVerbs) {
    return null;
  }

  // 2. Agendamento exato (dia + horário explícito, ex: "me chama amanhã às 15h")
  const exactTimeMatch = lower.match(/(amanhã|amanha|hoje|segunda|terça|terca|quarta|quinta|sexta|sábado|sabado).*?\b(\d{1,2})(?:h|:(\d{2}))?/i);
  if (exactTimeMatch) {
    const dayWord = exactTimeMatch[1];
    const hour = parseInt(exactTimeMatch[2], 10);
    const min = exactTimeMatch[3] ? parseInt(exactTimeMatch[3], 10) : 0;

    if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
      const targetDate = new Date(referenceDate);
      if (dayWord.startsWith('amanh')) {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (dayWord.startsWith('seg')) targetDate.setDate(targetDate.getDate() + ((1 + 7 - targetDate.getDay()) % 7 || 7));
      else if (dayWord.startsWith('ter')) targetDate.setDate(targetDate.getDate() + ((2 + 7 - targetDate.getDay()) % 7 || 7));
      else if (dayWord.startsWith('qua')) targetDate.setDate(targetDate.getDate() + ((3 + 7 - targetDate.getDay()) % 7 || 7));
      else if (dayWord.startsWith('qui')) targetDate.setDate(targetDate.getDate() + ((4 + 7 - targetDate.getDay()) % 7 || 7));
      else if (dayWord.startsWith('sex')) targetDate.setDate(targetDate.getDate() + ((5 + 7 - targetDate.getDay()) % 7 || 7));
      else if (dayWord.startsWith('sáb') || dayWord.startsWith('sab')) targetDate.setDate(targetDate.getDate() + ((6 + 7 - targetDate.getDay()) % 7 || 7));

      const timeFormatted = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const dateStr = targetDate.toISOString().split('T')[0];
      const isoTimestamp = new Date(`${dateStr}T${timeFormatted}:00-03:00`).toISOString();

      return {
        type: 'exact',
        date: dateStr,
        time: timeFormatted,
        isoTimestamp,
        rawText: text
      };
    }
  }

  // 3. Agendamento por dia e/ou período (sem hora exata, ex: "fala comigo sexta", "me chama amanhã à noite")
  const dayMatch = lower.match(/\b(amanhã|amanha|hoje|segunda|terça|terca|quarta|quinta|sexta|sábado|sabado)\b/i);
  const periodMatch = lower.match(/\b(de manhã|de manha|pela manhã|pela manha|à tarde|a tarde|pela tarde|de tarde|à noite|a noite|pela noite)\b/i);
  const isTomorrowOrFutureVague = /(amanhã|amanha|hoje|semana que vem|próxima semana|proxima semana|mês que vem|mes que vem|depois do dia)/i.test(lower);

  if (hasCallVerbs || isTomorrowOrFutureVague) {
    const dayStr = dayMatch ? dayMatch[1] : null;
    const pStr = periodMatch ? periodMatch[1] : null;

    let period: 'manha' | 'tarde' | 'noite' | 'dia_inteiro' | undefined;
    if (pStr && /(manhã|manha)/i.test(pStr)) period = 'manha';
    else if (pStr && /(tarde)/i.test(pStr)) period = 'tarde';
    else if (pStr && /(noite)/i.test(pStr)) period = 'noite';

    if (dayStr || period || hasCallVerbs) {
      const targetDate = new Date(referenceDate);
      if (dayStr && dayStr.startsWith('amanh')) {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (dayStr && dayStr.startsWith('seg')) targetDate.setDate(targetDate.getDate() + ((1 + 7 - targetDate.getDay()) % 7 || 7));
      else if (dayStr && dayStr.startsWith('ter')) targetDate.setDate(targetDate.getDate() + ((2 + 7 - targetDate.getDay()) % 7 || 7));
      else if (dayStr && dayStr.startsWith('qua')) targetDate.setDate(targetDate.getDate() + ((3 + 7 - targetDate.getDay()) % 7 || 7));
      else if (dayStr && dayStr.startsWith('qui')) targetDate.setDate(targetDate.getDate() + ((4 + 7 - targetDate.getDay()) % 7 || 7));
      else if (dayStr && dayStr.startsWith('sex')) targetDate.setDate(targetDate.getDate() + ((5 + 7 - targetDate.getDay()) % 7 || 7));
      else if (dayStr && (dayStr.startsWith('sáb') || dayStr.startsWith('sab'))) targetDate.setDate(targetDate.getDate() + ((6 + 7 - targetDate.getDay()) % 7 || 7));

      return {
        type: period ? 'period' : 'vague',
        date: targetDate.toISOString().split('T')[0],
        period: period || 'dia_inteiro',
        rawText: text
      };
    }
  }

  // 4. Expressões vagas ("semana que vem", "depois do dia 15", "mês que vem")
  if (/(semana que vem|próxima semana|proxima semana|depois do dia \d+|mês que vem|mes que vem|fala comigo depois|me chama depois)/i.test(lower)) {
    const targetDate = new Date(referenceDate);
    const afterDayMatch = lower.match(/depois do dia (\d+)/i);

    if (afterDayMatch) {
      const dayNum = parseInt(afterDayMatch[1], 10);
      targetDate.setDate(dayNum + 1);
      if (targetDate <= referenceDate) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }
    } else if (/(semana que vem|próxima semana|proxima semana)/i.test(lower)) {
      targetDate.setDate(targetDate.getDate() + 7);
    } else if (/(mês que vem|mes que vem)/i.test(lower)) {
      targetDate.setMonth(targetDate.getMonth() + 1);
    } else {
      targetDate.setDate(targetDate.getDate() + 3);
    }

    return {
      type: 'vague',
      date: targetDate.toISOString().split('T')[0],
      period: 'dia_inteiro',
      rawText: text
    };
  }

  return null;
}

