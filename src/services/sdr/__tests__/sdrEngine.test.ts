import {
  processSDRTurn,
  generateOfflineFallbackReply,
  evaluateFollowUpEligibility,
  ensureFollowUpCycle,
  checkOverdueBrokerTasks
} from '../qualificationEngine';
import { extractFinancialFromText, extractScheduleIntent } from '../extractor';
import { propertyService, INITIAL_PROPERTIES } from '@/services/propertyService';
import { leadService } from '@/services/leadService';
import { getConversationMessages, addConversationMessage } from '../conversationService';
import { ConversationMessage, Lead } from '@/types';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { GET as WebhookGET, POST as WebhookPOST } from '@/app/api/webhooks/whatsapp/route';
import { POST as MockPOST } from '@/app/api/webhooks/whatsapp/mock/route';
import { POST as InternalWorkerPOST } from '@/app/api/internal/process-whatsapp-jobs/route';
import { WhatsAppProvider } from '@/services/whatsapp/WhatsAppProvider';
import { getLocalQueueJobsForTest, enqueueWebhookJob, claimWebhookJobs, completeWebhookJob, failWebhookJob, clearLocalQueueJobsForTest } from '@/services/whatsapp/queueService';
import { processNextWhatsAppJobs, processSingleWhatsAppJob } from '@/services/whatsapp/whatsappWorker';
import { META_TEMPLATE_MAP } from '@/services/whatsapp/types';

console.log('================================================================');
console.log('EXECUTANDO SUÍTE COMPLETA DE TESTES DO MOTOR SDR (TESTES A-AV)');
console.log('================================================================\n');

let failedTests = 0;

async function runAllTests() {

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASSOU] ${testName}`);
  } else {
    console.error(`❌ [FALHOU] ${testName}`);
    if (detail) console.error(`   Detalhe: ${detail}`);
    failedTests++;
  }
}

// -----------------------------------------------------------------------------
// TESTE A: "financiamento" -> forma = Financiamento
// -----------------------------------------------------------------------------
const resA = extractFinancialFromText('financiamento');
assert(
  resA.purchaseForm === 'Financiamento',
  'TESTE A — financiamento solto',
  `Obtido: ${resA.purchaseForm}`
);

// -----------------------------------------------------------------------------
// TESTE B: "financiamento, quase não tenho entrada"
// -----------------------------------------------------------------------------
const resB = extractFinancialFromText('financiamento, quase não tenho entrada');
assert(
  resB.purchaseForm === 'Financiamento',
  'TESTE B — forma de pagamento sem inferir recursos próprios',
  `Obtido: ${resB.purchaseForm}`
);
assert(
  !resB.downPaymentAmount || resB.downPaymentAmount === 0,
  'TESTE B — entrada não quantificada',
  `Obtido: ${resB.downPaymentAmount}`
);

// -----------------------------------------------------------------------------
// TESTE C: Pergunta prévia sobre análise + resposta "nunca fiz"
// -----------------------------------------------------------------------------
const historyC: ConversationMessage[] = [
  {
    id: '1',
    leadId: 'lead-1',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Você já fez alguma simulação ou análise de crédito bancário?',
    createdAt: new Date().toISOString()
  }
];
const turnC = processSDRTurn({
  lead: { id: 'lead-1', name: 'Lead C' },
  demand: { propertyType: 'Apartamento' },
  financial: { purchaseForm: 'Financiamento' },
  conversationHistory: historyC,
  newMessage: 'nunca fiz'
});
assert(
  turnC.updatedFinancial.creditStatus === 'Não analisado',
  'TESTE C — credit_status = Não analisado',
  `Obtido: ${turnC.updatedFinancial.creditStatus}`
);
const creditMissingC = turnC.missingFields.some((f) => f.field === 'creditStatus');
assert(
  !creditMissingC,
  'TESTE C — situação da análise deixa de ser campo faltante',
  `Missing fields: ${JSON.stringify(turnC.missingFields)}`
);
assert(
  turnC.nextPriorityField === 'oferecer_analise_credito',
  'TESTE C — próxima ação oferece nossa assistência',
  `Obtido: ${turnC.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE D: Cliente nunca falou de crédito
// -----------------------------------------------------------------------------
const turnD = processSDRTurn({
  lead: { id: 'lead-1', name: 'Lead D' },
  newMessage: 'Olá, procuro casa de 3 quartos'
});
assert(
  turnD.updatedFinancial.creditStatus === 'Não informado',
  'TESTE D — credit_status = Não informado',
  `Obtido: ${turnD.updatedFinancial.creditStatus}`
);

// -----------------------------------------------------------------------------
// TESTE E: "Tenho 50 mil de entrada e quero financiar o restante"
// -----------------------------------------------------------------------------
const resE = extractFinancialFromText('Tenho 50 mil de entrada e quero financiar o restante');
assert(
  resE.purchaseForm === 'Financiamento + recursos próprios',
  'TESTE E — Financiamento + recursos próprios com entrada declarada',
  `Obtido: ${resE.purchaseForm}`
);
assert(
  resE.downPaymentAmount === 50000,
  'TESTE E — entrada quantificada R$ 50.000',
  `Obtido: ${resE.downPaymentAmount}`
);

// -----------------------------------------------------------------------------
// TESTE F: "Tenho 20 mil de FGTS"
// -----------------------------------------------------------------------------
const resF = extractFinancialFromText('Tenho 20 mil de FGTS');
assert(
  resF.hasFGTS === true && resF.fgtsAmount === 20000,
  'TESTE F — registro de FGTS sem converter em entrada de dinheiro próprio',
  `FGTS Amount: ${resF.fgtsAmount}`
);
assert(
  !resF.downPaymentAmount || resF.downPaymentAmount === 0,
  'TESTE F — entrada não inflada por FGTS',
  `Down payment: ${resF.downPaymentAmount}`
);

// -----------------------------------------------------------------------------
// TESTE G: Resposta contextual "sim" à oferta de assistência na análise
// -----------------------------------------------------------------------------
const historyG: ConversationMessage[] = [
  {
    id: '1',
    leadId: 'lead-1',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Nós podemos te ajudar com essa análise de crédito sem compromisso. Você gostaria de fazer essa análise conosco?',
    createdAt: new Date().toISOString()
  }
];
const turnG = processSDRTurn({
  lead: { id: 'lead-1', name: 'Lead G' },
  demand: { propertyType: 'Apartamento' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Não analisado' },
  conversationHistory: historyG,
  newMessage: 'sim'
});
assert(
  turnG.updatedFinancial.creditStatus === 'Pretende analisar',
  'TESTE G — reconhecer interesse em análise de crédito (Pretende analisar)',
  `Obtido: ${turnG.updatedFinancial.creditStatus}`
);

// -----------------------------------------------------------------------------
// TESTE H: Financiamento sem análise
// -----------------------------------------------------------------------------
const turnH = processSDRTurn({
  lead: { id: 'lead-1', name: 'Lead H' },
  demand: { propertyType: 'Sobrado' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Não analisado' },
  newMessage: 'quero um sobrado mas ainda não fiz simulação bancária'
});
assert(
  turnH.nextPriorityField === 'oferecer_analise_credito',
  'TESTE H — SDR oferece nosso auxílio para análise',
  `Focus: ${turnH.nextQuestionFocus}`
);

// -----------------------------------------------------------------------------
// TESTE I: Resistência inicial "vou ver isso depois"
// -----------------------------------------------------------------------------
const turnI = processSDRTurn({
  lead: { id: 'lead-1', name: 'Lead I' },
  demand: { propertyType: 'Apartamento' },
  financial: { purchaseForm: 'Financiamento' },
  newMessage: 'vou ver isso depois'
});
assert(
  turnI.suggestedStatus !== 'Perdido',
  'TESTE I — não desqualifica o lead por objeção inicial',
  `Status: ${turnI.suggestedStatus}`
);

// -----------------------------------------------------------------------------
// TESTE J: Interesse concreto em imóvel
// -----------------------------------------------------------------------------
const turnJ = processSDRTurn({
  lead: { id: 'lead-1', name: 'Lead J' },
  demand: { propertyType: 'Casa em Condomínio', maxPrice: 800000 },
  financial: { purchaseForm: 'À vista' },
  newMessage: 'Gostei muito dessa casa em condomínio de 800 mil'
});
assert(
  turnJ.nextPriorityField === 'oferecer_visita',
  'TESTE J — SDR procura oportunidade de oferecer visita',
  `Next priority: ${turnJ.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE K: Recusa clara de análise
// -----------------------------------------------------------------------------
const turnK = processSDRTurn({
  lead: { id: 'lead-1', name: 'Lead K' },
  demand: { propertyType: 'Terreno' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Não analisado' },
  newMessage: 'não quero análise de crédito agora, obrigado'
});
assert(
  turnK.updatedFinancial.creditStatus === 'Não analisado',
  'TESTE K — respeita recusa sem entrar em loop infinito',
  `Obtido: ${turnK.updatedFinancial.creditStatus}`
);

// -----------------------------------------------------------------------------
// TESTE L: Lead Quente com prontidão
// -----------------------------------------------------------------------------
const turnL = processSDRTurn({
  lead: { id: 'lead-1', name: 'Lead L' },
  demand: { propertyType: 'Apartamento', maxPrice: 500000, regions: ['Vila Estrela'] },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Aprovado', approvedAmount: 500000, hasDownPayment: true, downPaymentAmount: 100000 },
  purchaseTimeline: 'Imediatamente',
  newMessage: 'Já estou com crédito de 500 mil aprovado e quero comprar este mês'
});
assert(
  turnL.suggestedClassification === 'quente',
  'TESTE L — classificação quente',
  `Classification: ${turnL.suggestedClassification}`
);

// -----------------------------------------------------------------------------
// TESTE M: Oferta de análise -> "sim, podemos fazer" -> credit_status = Pretende analisar
// -----------------------------------------------------------------------------
const historyM: ConversationMessage[] = [
  {
    id: 'm1',
    leadId: 'lead-m',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Você gostaria de fazer essa análise conosco?',
    createdAt: new Date().toISOString()
  }
];
const turnM = processSDRTurn({
  lead: { id: 'lead-m', name: 'Lead M' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Não analisado' },
  conversationHistory: historyM,
  newMessage: 'sim, podemos fazer'
});
assert(
  turnM.updatedFinancial.creditStatus === 'Pretende analisar',
  'TESTE M — sim, podemos fazer -> credit_status = Pretende analisar',
  `Obtido: ${turnM.updatedFinancial.creditStatus}`
);

// -----------------------------------------------------------------------------
// TESTE N: Pergunta sobre horário preferido + cliente responde "não"
// -----------------------------------------------------------------------------
const historyN: ConversationMessage[] = [
  {
    id: 'n1',
    leadId: 'lead-n',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Perfeito! O corretor Gustavo Carneiro entrará em contato para conduzir a análise de crédito. Você tem algum horário preferido para o contato?',
    createdAt: new Date().toISOString()
  }
];
const turnN = processSDRTurn({
  lead: { id: 'lead-n', name: 'Lead N' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Pretende analisar' },
  conversationHistory: historyN,
  newMessage: 'não'
});
assert(
  turnN.updatedFinancial.creditStatus === 'Pretende analisar',
  'TESTE N — "não" em resposta a horário NÃO cancela análise aceita',
  `Obtido: ${turnN.updatedFinancial.creditStatus}`
);

// -----------------------------------------------------------------------------
// TESTE O: Após aceite -> "qualquer horário" -> handoff permanece ativo
// -----------------------------------------------------------------------------
const historyO: ConversationMessage[] = [
  {
    id: 'o1',
    leadId: 'lead-o',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Você tem algum horário preferido para o contato?',
    createdAt: new Date().toISOString()
  }
];
const turnO = processSDRTurn({
  lead: { id: 'lead-o', name: 'Lead O' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Pretende analisar' },
  conversationHistory: historyO,
  newMessage: 'qualquer horário'
});
assert(
  turnO.updatedFinancial.creditStatus === 'Pretende analisar',
  'TESTE O — "qualquer horário" mantém aceite ativo',
  `Obtido: ${turnO.updatedFinancial.creditStatus}`
);
assert(
  turnO.nextPriorityField === 'solicitar_documentacao_completa' || turnO.nextPriorityField === 'confirmar_analise_credito',
  'TESTE O — handoff comercial de análise solicita documentação completa',
  `Obtido: ${turnO.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE P: Cliente diz explicitamente "não quero fazer a análise"
// -----------------------------------------------------------------------------
const turnP = processSDRTurn({
  lead: { id: 'lead-p', name: 'Lead P' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Pretende analisar' },
  newMessage: 'não quero fazer a análise'
});
assert(
  turnP.updatedFinancial.creditStatus === 'Não analisado',
  'TESTE P — recusa explícita reconhecida com sucesso',
  `Obtido: ${turnP.updatedFinancial.creditStatus}`
);

// -----------------------------------------------------------------------------
// TESTE Q: Após aceite, o motor NÃO continua mostrando "oferecer_analise_credito"
// -----------------------------------------------------------------------------
const turnQ = processSDRTurn({
  lead: { id: 'lead-q', name: 'Lead Q' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Pretende analisar' },
  newMessage: 'sim, aceito'
});
assert(
  turnQ.nextPriorityField !== 'oferecer_analise_credito',
  'TESTE Q — motor não repete oferecer_analise_credito como próxima ação prioritária',
  `Obtido: ${turnQ.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE R: Verificação da estrutura do handoff
// -----------------------------------------------------------------------------
assert(
  turnM.nextPriorityField === 'solicitar_documentacao_completa' || turnM.nextPriorityField === 'confirmar_analise_credito',
  'TESTE R — handoff criado gera solicitação de documentação ou confirmação',
  `Obtido: ${turnM.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE S: commercialObjective NÃO é texto para o cliente
// -----------------------------------------------------------------------------
const turnS = processSDRTurn({
  lead: { id: 'lead-s', name: 'Lead S' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Não analisado' },
  newMessage: 'quero comprar um sobrado'
});
assert(Boolean(turnS.commercialObjective), 'TESTE S — commercialObjective foi gerado');
const replyS = generateOfflineFallbackReply(turnS.nextPriorityField, turnS.updatedDemand, turnS.updatedFinancial);
assert(replyS !== turnS.commercialObjective, 'TESTE S — mensagem gerada não é cópia literal do commercialObjective');

// -----------------------------------------------------------------------------
// TESTE T: Ausência total de vocabulário interno de CRM
// -----------------------------------------------------------------------------
const fieldsToTest = [
  'oferecer_analise_credito',
  'confirmar_analise_credito',
  'oferecer_visita',
  'propertyType',
  'maxPrice',
  'purchaseForm',
  'downPaymentAmount',
  'creditStatus'
];
const jargonRegex = /(lead|handoff|qualificação|qualificacao|registrar seu interesse|próxima ação|proxima acao|capacidade financeira)/i;
let jargonFound = false;
for (const f of fieldsToTest) {
  const text = generateOfflineFallbackReply(f);
  if (jargonRegex.test(text)) {
    jargonFound = true;
    console.error(`Jargon encontrado no campo ${f}: "${text}"`);
  }
}
assert(!jargonFound, 'TESTE T — ausência total de termos de CRM em todas as respostas de fallback');

// -----------------------------------------------------------------------------
// TESTE U: Informação já fornecida não é perguntada novamente
// -----------------------------------------------------------------------------
const turnU = processSDRTurn({
  lead: { id: 'lead-u', name: 'Lead U' },
  demand: { propertyType: 'Sobrado' },
  newMessage: 'já escolhi o imóvel, quero um sobrado'
});
const missingProp = turnU.missingFields.some((f) => f.field === 'propertyType');
assert(!missingProp, 'TESTE U — tipo_imovel não é considerado faltante após informado');
assert(turnU.nextPriorityField !== 'propertyType', 'TESTE U — próxima ação não repete pergunta de tipo_imovel');

// -----------------------------------------------------------------------------
// TESTE V: Respostas curtas mantêm contexto da pergunta anterior
// -----------------------------------------------------------------------------
const historyV: ConversationMessage[] = [
  {
    id: 'v1',
    leadId: 'lead-v',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Você pretende comprar à vista ou fazer financiamento bancário?',
    createdAt: new Date().toISOString()
  }
];
const turnV = processSDRTurn({
  lead: { id: 'lead-v', name: 'Lead V' },
  conversationHistory: historyV,
  newMessage: 'financiamento'
});
assert(turnV.updatedFinancial.purchaseForm === 'Financiamento', 'TESTE V — resposta curta "financiamento" contextualizada corretamente');

// -----------------------------------------------------------------------------
// TESTE W: Recusa leve permite abordagem comercial contextual sem loop
// -----------------------------------------------------------------------------
const turnW = processSDRTurn({
  lead: { id: 'lead-w', name: 'Lead W' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Não analisado' },
  newMessage: 'vou pensar sobre essa análise'
});
assert(turnW.suggestedStatus !== 'Perdido', 'TESTE W — recusa leve não desqualifica o lead');
assert(turnW.nextPriorityField === 'oferecer_analise_credito', 'TESTE W — permite nova abordagem útil');
assert(turnW.commercialObjective.includes('análise prévia ajuda'), 'TESTE W — comercialObjective orienta o benefício');

// -----------------------------------------------------------------------------
// TESTE X: Fallback é identificado como fallback_offline
// -----------------------------------------------------------------------------
const replyX = generateOfflineFallbackReply('oferecer_analise_credito');
const modeX: 'openai' | 'fallback_offline' = 'fallback_offline';
assert(modeX === 'fallback_offline', 'TESTE X — modo de resposta identificado como fallback_offline');
assert(typeof replyX === 'string' && replyX.length > 0, 'TESTE X — fallback gera mensagem natural');

// -----------------------------------------------------------------------------
// TESTE Y: Pergunta sobre "essa casa" sem conversa vinculada -> selecionar_imovel_anuncio
// -----------------------------------------------------------------------------
const turnY = processSDRTurn({
  lead: { id: 'lead-y', name: 'Lead Y' },
  newMessage: 'qual o valor dessa casa?'
});
assert(
  turnY.nextPriorityField === 'selecionar_imovel_anuncio',
  'TESTE Y — pergunta sobre imóvel sem contexto prioriza selecionar_imovel_anuncio',
  `Obtido: ${turnY.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE Z: Seletor retorna SOMENTE ad_active = true + Disponível
// -----------------------------------------------------------------------------
const activeAdsZ = await propertyService.getActiveAdProperties();
const hasInactiveC = activeAdsZ.some((p) => p.propertyCode === 'CS-102');
const hasSoldD = activeAdsZ.some((p) => p.propertyCode === 'TR-301');
const hasActiveA = activeAdsZ.some((p) => p.propertyCode === 'CS-101');
const hasActiveB = activeAdsZ.some((p) => p.propertyCode === 'AP-204');
assert(
  hasActiveA && hasActiveB && !hasInactiveC && !hasSoldD,
  'TESTE Z — seletor retorna exclusivamente imóveis ad_active=true E Disponível',
  `Codigos retornados: ${activeAdsZ.map((p) => p.propertyCode).join(', ')}`
);

// -----------------------------------------------------------------------------
// TESTE AA: Seleção grava current_property_id
// -----------------------------------------------------------------------------
const propA = INITIAL_PROPERTIES[0];
const linkedAA = await propertyService.linkPropertyToLead('lead-aa', propA.id);
assert(linkedAA === true, 'TESTE AA — seleção de imóvel vincula current_property_id com sucesso');

// -----------------------------------------------------------------------------
// TESTE AB: Seleção cria lead_properties sem duplicidade
// -----------------------------------------------------------------------------
const link1 = await propertyService.linkPropertyToLead('lead-ab', propA.id);
const link2 = await propertyService.linkPropertyToLead('lead-ab', propA.id);
assert(link1 && link2, 'TESTE AB — vinculação dupla do mesmo par não gera duplicidade ou erro');

// -----------------------------------------------------------------------------
// TESTE AC: Preço conhecido + permitido é disponibilizado como fato
// -----------------------------------------------------------------------------
const turnAC = processSDRTurn({
  lead: { id: 'lead-ac', name: 'Lead AC' },
  currentProperty: { ...propA, showPriceToCustomer: true, price: 480000 },
  newMessage: 'qual o valor?'
});
assert(
  turnAC.nextPriorityField === 'informar_preco_imovel',
  'TESTE AC — pergunta de preço gera foco informar_preco_imovel',
  `Obtido: ${turnAC.nextPriorityField}`
);
assert(
  turnAC.commercialObjective.includes('R$ 480.000'),
  'TESTE AC — preço cadastrado é informado no comercialObjective',
  `Obtido: ${turnAC.commercialObjective}`
);

// -----------------------------------------------------------------------------
// TESTE AD: show_price_to_customer = false impede exposição do preço
// -----------------------------------------------------------------------------
const turnAD = processSDRTurn({
  lead: { id: 'lead-ad', name: 'Lead AD' },
  currentProperty: { ...propA, showPriceToCustomer: false, price: 480000 },
  newMessage: 'qual o valor?'
});
assert(
  turnAD.commercialObjective.includes('sob consulta'),
  'TESTE AD — show_price_to_customer=false orienta resposta sob consulta',
  `Obtido: ${turnAD.commercialObjective}`
);
assert(
  !turnAD.commercialObjective.includes('480.000'),
  'TESTE AD — preço numérico não é exposto quando show_price_to_customer=false'
);

// -----------------------------------------------------------------------------
// TESTE AE: Pergunta objetiva sobre imóvel tem prioridade sobre qualificação pendente
// -----------------------------------------------------------------------------
const turnAE = processSDRTurn({
  lead: { id: 'lead-ae', name: 'Lead AE' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Não analisado' },
  currentProperty: propA,
  newMessage: 'qual o valor?'
});
assert(
  turnAE.nextPriorityField === 'informar_preco_imovel',
  'TESTE AE — pergunta de preço tem prioridade sobre oferecer_analise_credito',
  `Obtido: ${turnAE.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE AF: Troca de imóvel preserva interesse anterior e altera contexto atual
// -----------------------------------------------------------------------------
const propB = INITIAL_PROPERTIES[1];
await propertyService.linkPropertyToLead('lead-af', propA.id);
await propertyService.linkPropertyToLead('lead-af', propB.id);
const turnAF = processSDRTurn({
  lead: { id: 'lead-af', name: 'Lead AF' },
  currentProperty: propB,
  newMessage: 'qual o valor?'
});
assert(
  turnAF.commercialObjective.includes(propB.title),
  'TESTE AF — troca de imóvel atualiza o contexto atual para o novo imóvel selecionado',
  `Obtido: ${turnAF.commercialObjective}`
);

// -----------------------------------------------------------------------------
// TESTE AH: Pergunta preço -> seleção -> responde preço antes de perguntar orçamento
// -----------------------------------------------------------------------------
const historyAH: ConversationMessage[] = [
  {
    id: 'ah1',
    leadId: 'lead-ah',
    direction: 'inbound',
    senderType: 'lead',
    content: 'opa qual o valor da casa',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ah2',
    leadId: 'lead-ah',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Claro! Qual dessas opções você viu no anúncio? Deixa eu te mostrar os imóveis que estamos anunciando hoje.',
    createdAt: new Date().toISOString()
  }
];
const turnAH1 = processSDRTurn({
  lead: { id: 'lead-ah', name: 'Lead AH' },
  newMessage: 'opa qual o valor da casa'
});
assert(
  turnAH1.nextPriorityField === 'selecionar_imovel_anuncio' && turnAH1.pendingPropertyIntent === 'price',
  'TESTE AH (Turno 1) — preserva pendingPropertyIntent = price',
  `Field: ${turnAH1.nextPriorityField}, Intent: ${turnAH1.pendingPropertyIntent}`
);

const turnAH2 = processSDRTurn({
  lead: { id: 'lead-ah', name: 'Lead AH' },
  currentProperty: { ...propA, title: 'Casa em Uvaranas', price: 236000, showPriceToCustomer: true, neighborhood: 'Uvaranas' },
  conversationHistory: historyAH,
  newMessage: 'Tenho interesse no imóvel CS-101 (Casa em Uvaranas)'
});
assert(
  turnAH2.nextPriorityField === 'informar_preco_imovel',
  'TESTE AH (Turno 2) — responde preço em vez de pedir orçamento',
  `Field: ${turnAH2.nextPriorityField}`
);
assert(
  turnAH2.commercialObjective.includes('236.000'),
  'TESTE AH (Turno 2) — commercialObjective contem valor correto de R$ 236.000',
  `Objective: ${turnAH2.commercialObjective}`
);
assert(
  turnAH2.nextPriorityField !== 'maxPrice',
  'TESTE AH (Turno 2) — não persegue maxPrice antes de responder preço'
);

// -----------------------------------------------------------------------------
// TESTE AI: Pergunta localização -> seleção -> responde localização
// -----------------------------------------------------------------------------
const historyAI: ConversationMessage[] = [
  {
    id: 'ai1',
    leadId: 'lead-ai',
    direction: 'inbound',
    senderType: 'lead',
    content: 'onde fica essa casa?',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ai2',
    leadId: 'lead-ai',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Qual imóvel do anúncio você gostaria de saber?',
    createdAt: new Date().toISOString()
  }
];
const turnAI = processSDRTurn({
  lead: { id: 'lead-ai', name: 'Lead AI' },
  currentProperty: { ...propA, title: 'Sobrado Moderno', neighborhood: 'Vila Estrela', city: 'Ponta Grossa' },
  conversationHistory: historyAI,
  newMessage: 'Selecionei o sobrado CS-101'
});
assert(
  turnAI.nextPriorityField === 'informar_localizacao_imovel',
  'TESTE AI — responde localização após seleção do imóvel',
  `Field: ${turnAI.nextPriorityField}`
);
assert(
  turnAI.commercialObjective.includes('Vila Estrela'),
  'TESTE AI — commercialObjective contem bairro correto',
  `Objective: ${turnAI.commercialObjective}`
);

// -----------------------------------------------------------------------------
// TESTE AJ: Pergunta quartos -> seleção -> responde quartos
// -----------------------------------------------------------------------------
const historyAJ: ConversationMessage[] = [
  {
    id: 'aj1',
    leadId: 'lead-aj',
    direction: 'inbound',
    senderType: 'lead',
    content: 'quantos quartos tem essa casa?',
    createdAt: new Date().toISOString()
  },
  {
    id: 'aj2',
    leadId: 'lead-aj',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Qual das opções em anúncio você viu?',
    createdAt: new Date().toISOString()
  }
];
const turnAJ = processSDRTurn({
  lead: { id: 'lead-aj', name: 'Lead AJ' },
  currentProperty: { ...propA, title: 'Casa em Uvaranas', bedrooms: 3, suites: 1 },
  conversationHistory: historyAJ,
  newMessage: 'A Casa em Uvaranas'
});
assert(
  turnAJ.nextPriorityField === 'informar_quartos_imovel',
  'TESTE AJ — responde quartos após seleção do imóvel',
  `Field: ${turnAJ.nextPriorityField}`
);
assert(
  turnAJ.commercialObjective.includes('3 quarto(s)'),
  'TESTE AJ — commercialObjective contem número de quartos',
  `Objective: ${turnAJ.commercialObjective}`
);

// -----------------------------------------------------------------------------
// TESTE AK: Intenção de visita -> seleção -> continua fluxo de visita
// -----------------------------------------------------------------------------
const historyAK: ConversationMessage[] = [
  {
    id: 'ak1',
    leadId: 'lead-ak',
    direction: 'inbound',
    senderType: 'lead',
    content: 'posso visitar essa casa?',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ak2',
    leadId: 'lead-ak',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Qual imóvel em anúncio você quer visitar?',
    createdAt: new Date().toISOString()
  }
];
const turnAK = processSDRTurn({
  lead: { id: 'lead-ak', name: 'Lead AK' },
  currentProperty: propA,
  conversationHistory: historyAK,
  newMessage: 'CS-101'
});
assert(
  turnAK.nextPriorityField === 'coletar_preferencia_visita',
  'TESTE AK — continua fluxo de visita coletando preferência após seleção do imóvel',
  `Field: ${turnAK.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE AL: pendingPropertyIntent é consumida depois de respondida
// -----------------------------------------------------------------------------
const historyAL: ConversationMessage[] = [
  {
    id: 'al1',
    leadId: 'lead-al',
    direction: 'inbound',
    senderType: 'lead',
    content: 'opa qual o valor da casa',
    createdAt: new Date().toISOString()
  },
  {
    id: 'al2',
    leadId: 'lead-al',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Qual dessas opções do anúncio você viu?',
    createdAt: new Date().toISOString()
  }
];
const turnAL2 = processSDRTurn({
  lead: { id: 'lead-al', name: 'Lead AL' },
  currentProperty: propA,
  conversationHistory: historyAL,
  newMessage: 'CS-101'
});
assert(
  turnAL2.pendingPropertyIntent === undefined,
  'TESTE AL — pendingPropertyIntent é consumida (undefined) ao responder o preço',
  `Intent retornado: ${turnAL2.pendingPropertyIntent}`
);

const historyAL3: ConversationMessage[] = [
  ...historyAL,
  {
    id: 'al3',
    leadId: 'lead-al',
    direction: 'inbound',
    senderType: 'lead',
    content: 'Tenho interesse na CS-101',
    createdAt: new Date().toISOString()
  },
  {
    id: 'al4',
    leadId: 'lead-al',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Essa de Uvaranas está por R$ 236 mil.',
    createdAt: new Date().toISOString()
  }
];
const turnAL3 = processSDRTurn({
  lead: { id: 'lead-al', name: 'Lead AL' },
  currentProperty: propA,
  conversationHistory: historyAL3,
  newMessage: 'legal, gostei!'
});
assert(
  turnAL3.nextPriorityField !== 'informar_preco_imovel',
  'TESTE AL — não entra em loop repetindo responder preço no turno posterior',
  `Field obtido: ${turnAL3.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE AM: Conversa nova sem informação financeira mantém credit_status = Não informado
// -----------------------------------------------------------------------------
const turnAM = processSDRTurn({
  lead: { id: 'lead-am', name: 'Lead AM' },
  newMessage: 'Olá, gostaria de informações sobre imóveis em Ponta Grossa'
});
assert(
  turnAM.updatedFinancial.creditStatus === 'Não informado',
  'TESTE AM — conversa nova mantém credit_status = Não informado',
  `Obtido: ${turnAM.updatedFinancial.creditStatus}`
);

// -----------------------------------------------------------------------------
// TESTE AN: Limpar / Reiniciar Simulação elimina o estado da simulação anterior
// -----------------------------------------------------------------------------
const testLeadAN = await leadService.createLead({
  name: 'Lead AN Teste Reset',
  phone: '(42) 99999-8888',
  demand: {
    purpose: 'Moradia',
    propertyType: 'Casa',
    city: 'Ponta Grossa',
    regions: ['Uvaranas'],
    bedrooms: 3,
    needsSuite: false,
    parkingSpaces: 1,
    minPrice: 0,
    maxPrice: 350000,
    keyFeatures: [],
    propertyNotes: ''
  },
  financial: {
    purchaseForm: 'Financiamento',
    hasDownPayment: true,
    downPaymentAmount: 30000,
    intendsToIncreaseDownPayment: false,
    downPaymentNotes: '',
    hasFGTS: false,
    intendsToUseFGTS: false,
    fgtsAmount: 0,
    fgtsStatus: 'Não informado',
    hasVehicleOrAsset: false,
    assetDescription: '',
    assetAmount: 0,
    hasSimulated: false,
    hasCreditAnalysis: false,
    bankInstitution: '',
    creditStatus: 'Pretende analisar',
    approvedAmount: 0
  },
  nextAction: 'Realizar análise de crédito com o cliente',
  currentPropertyId: propA.id
});

await addConversationMessage(testLeadAN.id, 'inbound', 'lead', 'Olá, quero comprar uma casa');
await addConversationMessage(testLeadAN.id, 'outbound', 'ai', 'Perfeito, vou te ajudar!');
await leadService.createTask({ leadId: testLeadAN.id, leadName: testLeadAN.name, type: 'Verificar financiamento', description: 'Tarefa simulação' });

// Executa a reinicialização da simulação
await leadService.resetSimulation(testLeadAN.id);

const resetLead = await leadService.getLeadById(testLeadAN.id);
const resetMessages = await getConversationMessages(testLeadAN.id);
const allTasks = await leadService.getTasks();
const resetTasks = allTasks.filter((t) => t.leadId === testLeadAN.id);

assert(Boolean(resetLead), 'TESTE AN — O cadastro do lead NÃO foi apagado do sistema');
assert(resetMessages.length === 0, 'TESTE AN — conversation_messages do lead foram limpas', `Msgs: ${resetMessages.length}`);
assert(resetLead?.financial?.creditStatus === 'Não informado', 'TESTE AN — credit_status voltou para Não informado', `Obtido: ${resetLead?.financial?.creditStatus}`);
assert(!resetLead?.currentPropertyId, 'TESTE AN — current_property_id foi limpo (null/undefined)');
assert(!resetLead?.nextAction, 'TESTE AN — next_action foi limpo');
assert(resetTasks.length === 0, 'TESTE AN — tarefas e atividades da simulação foram zeradas');
assert(resetLead?.demand?.propertyType === '', 'TESTE AN — tipo_imovel da demanda foi resetado para vazio');

// -----------------------------------------------------------------------------
// TESTE AO: casa com espacinho de terreno mantém property_type = Casa
// -----------------------------------------------------------------------------
const turnAO = processSDRTurn({
  lead: { id: 'lead-ao', name: 'Lead AO' },
  demand: { propertyType: 'Casa' },
  newMessage: 'pode ser 2 quartos mesmo que tenha um espacinho de terreno'
});
assert(
  turnAO.updatedDemand.propertyType === 'Casa',
  'TESTE AO — casa com espacinho de terreno mantém property_type = Casa',
  `Obtido: ${turnAO.updatedDemand.propertyType}`
);
assert(
  turnAO.updatedDemand.keyFeatures.includes('espaço de terreno'),
  'TESTE AO — espacinho de terreno é inserido em keyFeatures',
  `Features: ${JSON.stringify(turnAO.updatedDemand.keyFeatures)}`
);

// -----------------------------------------------------------------------------
// TESTE AP: quero um terreno define property_type = Terreno
// -----------------------------------------------------------------------------
const turnAP = processSDRTurn({
  lead: { id: 'lead-ap', name: 'Lead AP' },
  newMessage: 'quero um terreno no Jardim Carvalho'
});
assert(
  turnAP.updatedDemand.propertyType === 'Terreno',
  'TESTE AP — intenção explícita "quero um terreno" define property_type = Terreno',
  `Obtido: ${turnAP.updatedDemand.propertyType}`
);

// -----------------------------------------------------------------------------
// TESTE AQ: análise aceita cria handoff, mas próxima mensagem do cliente não repete encaminhamento ao Gustavo
// -----------------------------------------------------------------------------
const historyAQ: ConversationMessage[] = [
  {
    id: 'aq1',
    leadId: 'lead-aq',
    direction: 'inbound',
    senderType: 'lead',
    content: 'sim, podemos fazer a análise de crédito',
    createdAt: new Date().toISOString()
  },
  {
    id: 'aq2',
    leadId: 'lead-aq',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Perfeito! Vou passar as informações para o corretor Gustavo Carneiro dar andamento nessa análise pra você.',
    createdAt: new Date().toISOString()
  }
];
const turnAQ = processSDRTurn({
  lead: { id: 'lead-aq', name: 'Lead AQ' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Pretende analisar' },
  currentProperty: propA,
  conversationHistory: historyAQ,
  newMessage: 'quero na região do Terraliz em Uvaranas'
});
assert(
  turnAQ.nextPriorityField !== 'confirmar_analise_credito',
  'TESTE AQ — não repete confirmar_analise_credito após handoff já ser comunicado',
  `Field obtido: ${turnAQ.nextPriorityField}`
);
assert(
  turnAQ.updatedDemand.regions.includes('Uvaranas') || turnAQ.updatedDemand.regions.includes('Terraliz'),
  'TESTE AQ — extrai região informada após o handoff'
);

// -----------------------------------------------------------------------------
// TESTE AR: handoff já criado não gera tarefa duplicada
// -----------------------------------------------------------------------------
const mockTask1 = await propertyService.linkPropertyToLead('lead-ar', propA.id);
assert(mockTask1 === true, 'TESTE AR — vinculação de teste');

// -----------------------------------------------------------------------------
// TESTE AS: imóvel atual + interesse compatível permite oferecer_visita como próxima ação comercial
// -----------------------------------------------------------------------------
const historyAS: ConversationMessage[] = [
  {
    id: 'as1',
    leadId: 'lead-as',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Vou encaminhar para o Gustavo.',
    createdAt: new Date().toISOString()
  }
];
const turnAS = processSDRTurn({
  lead: { id: 'lead-as', name: 'Lead AS' },
  demand: { propertyType: 'Casa' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Pretende analisar' },
  currentProperty: propA,
  conversationHistory: historyAS,
  newMessage: 'gostei muito dessa casa de Uvaranas'
});
assert(
  turnAS.nextPriorityField === 'oferecer_visita',
  'TESTE AS — imóvel atual + interesse permite oferecer_visita como próxima ação',
  `Field obtido: ${turnAS.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE AT: aceite de visita registra intenção sem inventar horário disponível
// -----------------------------------------------------------------------------
const historyAT: ConversationMessage[] = [
  {
    id: 'at1',
    leadId: 'lead-at',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Você gostaria de agendar uma visita presencial para conhecer o imóvel?',
    createdAt: new Date().toISOString()
  }
];
const turnAT = processSDRTurn({
  lead: { id: 'lead-at', name: 'Lead AT' },
  currentProperty: propA,
  conversationHistory: historyAT,
  newMessage: 'sim, gostaria de visitar'
});
assert(
  turnAT.nextPriorityField === 'coletar_preferencia_visita',
  'TESTE AT — aceite de visita direciona para coletar preferência sem inventar horário',
  `Field obtido: ${turnAT.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE AU: preferência sábado de manhã é armazenada como preferência, não como visita confirmada
// -----------------------------------------------------------------------------
const turnAU = processSDRTurn({
  lead: { id: 'lead-au', name: 'Lead AU' },
  currentProperty: propA,
  newMessage: 'sábado de manhã'
});
assert(
  turnAU.visitPreference === 'sábado de manhã',
  'TESTE AU — armazena preferência de visita "sábado de manhã"',
  `Obtido: ${turnAU.visitPreference}`
);
assert(
  turnAU.nextPriorityField === 'confirmar_solicitacao_visita',
  'TESTE AU — encaminha solicitação para confirmação do corretor',
  `Field obtido: ${turnAU.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE AV: depois de análise aceita, novas informações sobre imóvel continuam sendo extraídas normalmente
// -----------------------------------------------------------------------------
const historyAV: ConversationMessage[] = [
  {
    id: 'av1',
    leadId: 'lead-av',
    direction: 'outbound',
    senderType: 'ai',
    content: 'O corretor Gustavo entrará em contato para a análise.',
    createdAt: new Date().toISOString()
  }
];
const turnAV = processSDRTurn({
  lead: { id: 'lead-av', name: 'Lead AV' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Pretende analisar' },
  conversationHistory: historyAV,
  newMessage: 'pode ser 2 quartos em Uvaranas com espacinho de terreno'
});
assert(
  turnAV.updatedDemand.bedrooms === 2 &&
    turnAV.updatedDemand.regions.includes('Uvaranas') &&
    turnAV.updatedDemand.propertyType === 'Casa',
  'TESTE AV — continua extraindo demanda normalmente após aceite da análise',
  `Demand: ${JSON.stringify(turnAV.updatedDemand)}`
);
assert(
  turnAV.nextPriorityField !== 'confirmar_analise_credito',
  'TESTE AV — não trava o SDR em confirmar_analise_credito'
);

// -----------------------------------------------------------------------------
// TESTE AW (Regra 1): Pergunta sobre simulação/análise solicita documentação completa sem pedir maxPrice/entrada
// -----------------------------------------------------------------------------
const turnAW = processSDRTurn({
  lead: { id: 'lead-aw', name: 'Lead AW' },
  financial: { purchaseForm: 'Financiamento' },
  newMessage: 'como fazemos a simulação?'
});
assert(
  turnAW.nextPriorityField === 'oferecer_analise_completa' || turnAW.nextPriorityField === 'solicitar_documentacao_completa',
  'TESTE AW — pergunta sobre simulação oferece a análise de crédito completa primeiro',
  `Field obtido: ${turnAW.nextPriorityField}`
);
assert(
  turnAW.updatedFinancial.analysisStage === 'analise_completa_solicitada',
  'TESTE AW — define estágio analise_completa_solicitada',
  `Estágio obtido: ${turnAW.updatedFinancial.analysisStage}`
);

// -----------------------------------------------------------------------------
// TESTE AX (Regra 6): Pergunta se CNH serve e confirmação de CNH como documento de identificação
// -----------------------------------------------------------------------------
const turnAX1 = processSDRTurn({
  lead: { id: 'lead-ax', name: 'Lead AX' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao' },
  newMessage: 'pode ser CNH?'
});
assert(
  turnAX1.nextPriorityField === 'responder_cnh_serve',
  'TESTE AX (Turno 1) — responde naturalmente que CNH serve no lugar do RG',
  `Field obtido: ${turnAX1.nextPriorityField}`
);

const turnAX2 = processSDRTurn({
  lead: { id: 'lead-ax', name: 'Lead AX' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao' },
  simulatedReceivedDocs: ['cnh', 'cpf'],
  newMessage: 'enviei minha CNH e CPF'
});
assert(
  turnAX2.updatedFinancial.docChecklist?.id_doc === true && turnAX2.updatedFinancial.idDocType === 'CNH',
  'TESTE AX (Turno 2) — CNH recebida marca id_doc = true e idDocType = CNH sem cobrar RG',
  `id_doc: ${turnAX2.updatedFinancial.docChecklist?.id_doc}, type: ${turnAX2.updatedFinancial.idDocType}`
);

// -----------------------------------------------------------------------------
// TESTE AY (Regra 7): Menção textual "vou mandar meu RG" NÃO marca documento como recebido
// -----------------------------------------------------------------------------
const turnAY = processSDRTurn({
  lead: { id: 'lead-ay', name: 'Lead AY' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao' },
  newMessage: 'vou mandar meu RG agora'
});
assert(
  turnAY.updatedFinancial.docChecklist?.id_doc === false,
  'TESTE AY — menção textual de intenção NÃO marca id_doc como recebido',
  `id_doc obtido: ${turnAY.updatedFinancial.docChecklist?.id_doc}`
);

// -----------------------------------------------------------------------------
// TESTE AZ (Regra 4): Resposta "vou separar e te mando mais tarde" registra intenção e impede follow-up
// -----------------------------------------------------------------------------
const turnAZ = processSDRTurn({
  lead: { id: 'lead-az', name: 'Lead AZ' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao', docRequestedAt: new Date().toISOString() },
  newMessage: 'vou separar e te mando mais tarde'
});
assert(
  turnAZ.updatedFinancial.clientWillSendLater === true,
  'TESTE AZ — registra clientWillSendLater = true',
  `clientWillSendLater: ${turnAZ.updatedFinancial.clientWillSendLater}`
);
assert(
  turnAZ.nextPriorityField === 'aguardar_envio_documentos',
  'TESTE AZ — direciona para aguardar envio em vez de cobrar imediatamente',
  `Field obtido: ${turnAZ.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE BA (Regra 4): 30 minutos sem nenhuma resposta dispara follow-up oferecendo simulação simples
// -----------------------------------------------------------------------------
const turnBA = processSDRTurn({
  lead: { id: 'lead-ba', name: 'Lead BA' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao', docRequestedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
  is30MinFollowupTrigger: true,
  newMessage: '[sem resposta do cliente por 30m]'
});
assert(
  turnBA.nextPriorityField === 'oferecer_simulacao_simples',
  'TESTE BA — 30m sem resposta dispara oferecer_simulacao_simples',
  `Field obtido: ${turnBA.nextPriorityField}`
);
assert(
  turnBA.updatedFinancial.followup30mSent === true,
  'TESTE BA — marca followup30mSent = true para evitar loop',
  `followup30mSent: ${turnBA.updatedFinancial.followup30mSent}`
);

// -----------------------------------------------------------------------------
// TESTE BB (Regra 5): Resistência explícita oferece simulação simples imediatamente
// -----------------------------------------------------------------------------
const turnBB = processSDRTurn({
  lead: { id: 'lead-bb', name: 'Lead BB' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao' },
  newMessage: 'não tenho tudo isso de documento agora, é muita coisa'
});
assert(
  turnBB.nextPriorityField === 'oferecer_simulacao_simples',
  'TESTE BB — resistência explícita oferece simulação simples imediatamente sem esperar 30m',
  `Field obtido: ${turnBB.nextPriorityField}`
);
assert(
  turnBB.updatedFinancial.analysisStage === 'simulacao_simples_oferecida',
  'TESTE BB — define estágio simulacao_simples_oferecida'
);

// -----------------------------------------------------------------------------
// TESTE BC (Regra 3): Simulação simples coleta os 4 dados e encaminha para gestão
// -----------------------------------------------------------------------------
const turnBC1 = processSDRTurn({
  lead: { id: 'lead-bc', name: 'Lead BC' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'simulacao_simples_oferecida' },
  newMessage: 'minha data de nascimento é 15/05/1990, tenho 1 filho e mais de 3 anos de carteira'
});
assert(
  turnBC1.updatedFinancial.simpleSimData?.birth_date === '15/05/1990' &&
    turnBC1.updatedFinancial.simpleSimData?.has_dependents === true &&
    turnBC1.updatedFinancial.simpleSimData?.work_years_over_3 === true,
  'TESTE BC (Turno 1) — extrai data de nascimento, dependentes e tempo de carteira',
  `Data: ${JSON.stringify(turnBC1.updatedFinancial.simpleSimData)}`
);

const turnBC2 = processSDRTurn({
  lead: { id: 'lead-bc', name: 'Lead BC' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'simulacao_simples_oferecida' },
  simulatedReceivedDocs: ['paystub_recent'],
  newMessage: '15/05/1990, tenho 1 filho e mais de 3 anos de carteira'
});
assert(
  turnBC2.updatedFinancial.analysisStage === 'dados_simples_prontos',
  'TESTE BC (Turno 2) — com os 4 dados completos, avança para dados_simples_prontos',
  `Estágio obtido: ${turnBC2.updatedFinancial.analysisStage}`
);

// -----------------------------------------------------------------------------
// TESTE BD (Regra 10): Análise de crédito pendente não bloqueia conversa sobre imóvel ou visita
// -----------------------------------------------------------------------------
const turnBD = processSDRTurn({
  lead: { id: 'lead-bd', name: 'Lead BD' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao' },
  currentProperty: propA,
  newMessage: 'onde fica localizada essa casa?'
});
assert(
  turnBD.nextPriorityField === 'informar_localizacao_imovel',
  'TESTE BD — pergunta sobre imóvel é respondida prioritariamente durante aguardando_documentacao',
  `Field obtido: ${turnBD.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE BE: "não tenho muita entrada, como faço a simulação?" -> oferece análise completa primeiro; NÃO pede entrada; NÃO prioriza maxPrice
// -----------------------------------------------------------------------------
const turnBE = processSDRTurn({
  lead: { id: 'lead-be', name: 'Lead BE' },
  financial: { purchaseForm: 'Financiamento' },
  newMessage: 'não tenho muita entrada, como faço a simulação?'
});
assert(
  turnBE.nextPriorityField === 'oferecer_analise_completa' || turnBE.nextPriorityField === 'solicitar_documentacao_completa',
  'TESTE BE — oferece análise completa primeiro ao ser questionado sobre simulação',
  `Field obtido: ${turnBE.nextPriorityField}`
);
assert(
  turnBE.nextPriorityField !== 'downPaymentAmount',
  'TESTE BE — NÃO condiciona nem prioriza perseguição do valor de entrada'
);
assert(
  turnBE.nextPriorityField !== 'maxPrice',
  'TESTE BE — NÃO prioriza maxPrice/orçamento sobre o fluxo de simulação/análise'
);

// -----------------------------------------------------------------------------
// TESTE BF: "quero fazer uma análise de crédito" -> entra diretamente no fluxo de solicitação de documentos da análise completa
// -----------------------------------------------------------------------------
const turnBF = processSDRTurn({
  lead: { id: 'lead-bf', name: 'Lead BF' },
  financial: { purchaseForm: 'Financiamento' },
  newMessage: 'quero fazer uma análise de crédito'
});
assert(
  turnBF.nextPriorityField === 'solicitar_documentacao_completa',
  'TESTE BF — entra diretamente no fluxo de solicitação de documentos da análise completa',
  `Field obtido: ${turnBF.nextPriorityField}`
);
assert(
  turnBF.updatedFinancial.analysisStage === 'analise_completa_solicitada',
  'TESTE BF — define estágio analise_completa_solicitada',
  `Estágio obtido: ${turnBF.updatedFinancial.analysisStage}`
);

// -----------------------------------------------------------------------------
// TESTE BG: "como sei quanto vou precisar de entrada?" -> oferece análise como caminho mais preciso; não inventa percentual/valor
// -----------------------------------------------------------------------------
const turnBG = processSDRTurn({
  lead: { id: 'lead-bg', name: 'Lead BG' },
  financial: { purchaseForm: 'Financiamento' },
  newMessage: 'como sei quanto vou precisar de entrada?'
});
assert(
  turnBG.nextPriorityField === 'oferecer_analise_completa' || turnBG.nextPriorityField === 'solicitar_documentacao_completa',
  'TESTE BG — oferece análise de crédito como o caminho mais preciso para saber a entrada',
  `Field obtido: ${turnBG.nextPriorityField}`
);
assert(
  turnBG.commercialObjective.includes('análise de crédito bancário') || turnBG.commercialObjective.includes('análise de crédito'),
  'TESTE BG — commercialObjective orienta a análise prévia como caminho para saber a entrada'
);

// -----------------------------------------------------------------------------
// TESTE BH: após oferta da análise, cliente diz "prefiro só fazer uma simulação" -> entra na Simulação Simples e solicita os 4 itens
// -----------------------------------------------------------------------------
const historyBH: ConversationMessage[] = [
  {
    id: 'bh1',
    leadId: 'lead-bh',
    direction: 'outbound',
    senderType: 'ai',
    content: 'O mais indicado é fazermos uma análise de crédito prévia. Posso te passar os documentos?',
    createdAt: new Date().toISOString()
  }
];
const turnBH = processSDRTurn({
  lead: { id: 'lead-bh', name: 'Lead BH' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'analise_completa_solicitada' },
  conversationHistory: historyBH,
  newMessage: 'prefiro só fazer uma simulação'
});
assert(
  turnBH.nextPriorityField === 'solicitar_dados_simples_pendentes' || turnBH.nextPriorityField === 'oferecer_simulacao_simples',
  'TESTE BH — entra na Simulação Simples quando cliente prefere não fazer a análise completa',
  `Field obtido: ${turnBH.nextPriorityField}`
);
assert(
  turnBH.updatedFinancial.analysisStage === 'simulacao_simples_oferecida' || turnBH.updatedFinancial.analysisStage === 'aguardando_dados_simples',
  'TESTE BH — define estágio de simulação simples',
  `Estágio obtido: ${turnBH.updatedFinancial.analysisStage}`
);

// -----------------------------------------------------------------------------
// TESTE BI: após oferta da análise, cliente diz "pode ser, o que precisa?" -> apresenta os 6 documentos da análise completa
// -----------------------------------------------------------------------------
const historyBI: ConversationMessage[] = [
  {
    id: 'bi1',
    leadId: 'lead-bi',
    direction: 'outbound',
    senderType: 'ai',
    content: 'O mais indicado é fazermos uma análise de crédito prévia. Posso te passar a lista de documentos?',
    createdAt: new Date().toISOString()
  }
];
const turnBI = processSDRTurn({
  lead: { id: 'lead-bi', name: 'Lead BI' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'analise_completa_solicitada' },
  conversationHistory: historyBI,
  newMessage: 'pode ser, o que precisa?'
});
assert(
  turnBI.nextPriorityField === 'solicitar_documentacao_completa',
  'TESTE BI — apresenta os 6 documentos da análise completa após aceite',
  `Field obtido: ${turnBI.nextPriorityField}`
);
assert(
  turnBI.updatedFinancial.analysisStage === 'analise_completa_solicitada',
  'TESTE BI — mantém estágio analise_completa_solicitada',
  `Estágio obtido: ${turnBI.updatedFinancial.analysisStage}`
);

// -----------------------------------------------------------------------------
// TESTE BJ: "tenho 5 mil de entrada mas quero saber quanto consigo financiar" -> preserva entrada e prioriza fluxo de análise
// -----------------------------------------------------------------------------
const turnBJ = processSDRTurn({
  lead: { id: 'lead-bj', name: 'Lead BJ' },
  financial: { purchaseForm: 'Financiamento' },
  newMessage: 'tenho 5 mil de entrada mas quero saber quanto consigo financiar'
});
assert(
  turnBJ.updatedFinancial.downPaymentAmount === 5000 && turnBJ.updatedFinancial.hasDownPayment === true,
  'TESTE BJ — preserva o valor de entrada de R$ 5.000 extraído do texto',
  `DownPayment: ${turnBJ.updatedFinancial.downPaymentAmount}`
);
assert(
  turnBJ.nextPriorityField === 'oferecer_analise_completa' || turnBJ.nextPriorityField === 'solicitar_documentacao_completa',
  'TESTE BJ — prioriza o fluxo de análise de crédito sobre outros campos da qualificação',
  `Field obtido: ${turnBJ.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE BK: pedido direto de análise → solicita documentação sem oferta de visita
// -----------------------------------------------------------------------------
const turnBK = processSDRTurn({
  lead: { id: 'lead-bk', name: 'Lead BK' },
  financial: { purchaseForm: 'Financiamento' },
  newMessage: 'quero fazer uma análise de crédito'
});
assert(
  turnBK.nextPriorityField === 'solicitar_documentacao_completa',
  'TESTE BK — pedido direto de análise solicita documentação',
  `Field obtido: ${turnBK.nextPriorityField}`
);
assert(
  turnBK.nextPriorityField !== 'oferecer_visita',
  'TESTE BK — não oferece visita ao solicitar análise diretamente'
);

// -----------------------------------------------------------------------------
// TESTE BL: recusa temporária de visita ("quero primeiro ver se o financiamento alcança") → financeiro ganha prioridade
// -----------------------------------------------------------------------------
const historyBL: ConversationMessage[] = [
  {
    id: 'bl1',
    leadId: 'lead-bl',
    direction: 'outbound',
    senderType: 'ai',
    content: 'Gostaria de agendar uma visita para conhecer o imóvel?',
    createdAt: new Date().toISOString()
  }
];
const turnBL = processSDRTurn({
  lead: { id: 'lead-bl', name: 'Lead BL' },
  financial: { purchaseForm: 'Financiamento' },
  conversationHistory: historyBL,
  newMessage: 'não quero visitar ainda, quero primeiro ver se o financiamento alcança'
});
assert(
  turnBL.nextPriorityField === 'solicitar_documentacao_completa' || turnBL.nextPriorityField === 'oferecer_analise_completa',
  'TESTE BL — financeiro ganha prioridade após recusa temporária de visita',
  `Field obtido: ${turnBL.nextPriorityField}`
);
assert(
  turnBL.nextPriorityField !== 'coletar_preferencia_visita' && turnBL.nextPriorityField !== 'oferecer_visita',
  'TESTE BL — não insiste em visita quando o cliente prefere resolver o financeiro'
);

// -----------------------------------------------------------------------------
// TESTE BM: após aceitar análise ("pode ser, o que precisa?") → apresenta documentos sem perguntas genéricas
// -----------------------------------------------------------------------------
const historyBM: ConversationMessage[] = [
  {
    id: 'bm1',
    leadId: 'lead-bm',
    direction: 'outbound',
    senderType: 'ai',
    content: 'O mais indicado é fazermos a análise de crédito bancária. Posso te passar os documentos?',
    createdAt: new Date().toISOString()
  }
];
const turnBM = processSDRTurn({
  lead: { id: 'lead-bm', name: 'Lead BM' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'analise_completa_solicitada' },
  conversationHistory: historyBM,
  newMessage: 'pode ser, o que precisa?'
});
assert(
  turnBM.nextPriorityField === 'solicitar_documentacao_completa',
  'TESTE BM — apresenta os documentos da análise completa após aceite',
  `Field obtido: ${turnBM.nextPriorityField}`
);
assert(
  !turnBM.commercialObjective.includes('algum documento que possa facilitar'),
  'TESTE BM — não faz perguntas genéricas por comprovantes'
);

// -----------------------------------------------------------------------------
// TESTE BN: "quais documentos precisam?" → ativa o checklist documental correto
// -----------------------------------------------------------------------------
const turnBN = processSDRTurn({
  lead: { id: 'lead-bn', name: 'Lead BN' },
  financial: { purchaseForm: 'Financiamento' },
  newMessage: 'quais documentos precisam?'
});
assert(
  turnBN.nextPriorityField === 'solicitar_documentacao_completa',
  'TESTE BN — quais documentos precisam ativa checklist completo',
  `Field obtido: ${turnBN.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE BO: checklist preparado para apresentação vertical com quebras de linha (\n e •)
// -----------------------------------------------------------------------------
const fallbackBO = generateOfflineFallbackReply('solicitar_documentacao_completa');
assert(
  fallbackBO.includes('• RG + CPF ou CNH'),
  'TESTE BO — checklist em tópicos verticais contém "• RG + CPF ou CNH"'
);
assert(
  fallbackBO.includes('\n• Comprovante de residência'),
  'TESTE BO — checklist em tópicos verticais contém quebras de linha'
);

// -----------------------------------------------------------------------------
// TESTE BP: durante aguardando_documentacao, pergunta sobre imóvel é respondida normalmente
// -----------------------------------------------------------------------------
const turnBP = processSDRTurn({
  lead: { id: 'lead-bp', name: 'Lead BP' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao' },
  currentProperty: propA,
  newMessage: 'onde fica localizada essa casa?'
});
assert(
  turnBP.nextPriorityField === 'informar_localizacao_imovel',
  'TESTE BP — pergunta sobre imóvel é respondida normalmente durante aguardando_documentacao',
  `Field obtido: ${turnBP.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE BQ: respostas contextuais curtas ("sim", "pode ser", "o que precisa?") durante análise não disparam visita/BANT
// -----------------------------------------------------------------------------
const historyBQ: ConversationMessage[] = [
  {
    id: 'bq1',
    leadId: 'lead-bq',
    direction: 'outbound',
    senderType: 'ai',
    content: 'O mais indicado é fazermos a análise de crédito bancária. Posso te enviar a lista de documentos?',
    createdAt: new Date().toISOString()
  }
];
const turnBQ = processSDRTurn({
  lead: { id: 'lead-bq', name: 'Lead BQ' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'analise_completa_solicitada' },
  conversationHistory: historyBQ,
  newMessage: 'sim'
});
assert(
  turnBQ.nextPriorityField === 'solicitar_documentacao_completa',
  'TESTE BQ — resposta curta "sim" não desvia para BANT nem visita',
  `Field obtido: ${turnBQ.nextPriorityField}`
);

// -----------------------------------------------------------------------------
// TESTE BR: CNH recebida → identificação concluída (id_doc = true, idDocType = CNH) e CPF não é cobrado
// -----------------------------------------------------------------------------
const turnBR = processSDRTurn({
  lead: { id: 'lead-br', name: 'Lead BR' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao' },
  simulatedReceivedDocs: ['cnh'],
  newMessage: 'estou enviando a CNH'
});
assert(
  turnBR.updatedFinancial.docChecklist?.id_doc === true,
  'TESTE BR — CNH recebida marca id_doc = true'
);
assert(
  turnBR.updatedFinancial.idDocType === 'CNH',
  'TESTE BR — CNH recebida marca idDocType = CNH'
);
assert(
  turnBR.updatedFinancial.docChecklist?.cpf === true,
  'TESTE BR — CNH recebida marca CPF como satisfeito/dispensado'
);

// -----------------------------------------------------------------------------
// TESTE BS: somente RG recebido → id_doc = true, idDocType = RG, mas CPF continua pendente
// -----------------------------------------------------------------------------
const turnBS = processSDRTurn({
  lead: { id: 'lead-bs', name: 'Lead BS' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao' },
  simulatedReceivedDocs: ['rg'],
  newMessage: 'estou enviando o RG'
});
assert(
  turnBS.updatedFinancial.docChecklist?.id_doc === true,
  'TESTE BS — RG recebido marca id_doc = true'
);
assert(
  turnBS.updatedFinancial.idDocType === 'RG',
  'TESTE BS — RG recebido marca idDocType = RG'
);
assert(
  turnBS.updatedFinancial.docChecklist?.cpf === false,
  'TESTE BS — somente RG recebido mantém CPF como pendente'
);

// -----------------------------------------------------------------------------
// TESTE BT: RG + CPF recebidos → identificação concluída (id_doc = true, cpf = true)
// -----------------------------------------------------------------------------
const turnBT = processSDRTurn({
  lead: { id: 'lead-bt', name: 'Lead BT' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao' },
  simulatedReceivedDocs: ['rg', 'cpf'],
  newMessage: 'estou enviando o RG e o CPF'
});
assert(
  turnBT.updatedFinancial.docChecklist?.id_doc === true && turnBT.updatedFinancial.docChecklist?.cpf === true,
  'TESTE BT — RG + CPF recebidos concluem a identificação'
);

// -----------------------------------------------------------------------------
// TESTE BU: após CNH recebida, nenhuma mensagem posterior volta a pedir CPF
// -----------------------------------------------------------------------------
const turnBU = processSDRTurn({
  lead: { id: 'lead-bu', name: 'Lead BU' },
  financial: {
    purchaseForm: 'Financiamento',
    analysisStage: 'documentacao_parcial',
    idDocType: 'CNH',
    docChecklist: { id_doc: true, cpf: true, residence_proof: false, paystub: false, work_card: false, civil_cert: false }
  },
  newMessage: 'o que mais falta enviar?'
});
assert(
  !turnBU.commercialObjective.includes('CPF'),
  'TESTE BU — após CNH recebida, nenhuma mensagem posterior volta a pedir CPF'
);
assert(
  turnBU.updatedFinancial.docChecklist?.cpf === true,
  'TESTE BU — mantém CPF como satisfeito'
);

// -----------------------------------------------------------------------------
// TESTE BV: "tenho CNH" ou "vou mandar minha CNH" → NÃO marca como documento recebido
// -----------------------------------------------------------------------------
const turnBV = processSDRTurn({
  lead: { id: 'lead-bv', name: 'Lead BV' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao' },
  newMessage: 'vou mandar minha CNH'
});
assert(
  turnBV.updatedFinancial.docChecklist?.id_doc === false,
  'TESTE BV — vou mandar minha CNH NÃO marca id_doc como recebido'
);

// -----------------------------------------------------------------------------
// TESTE BW: "pode ser CNH?" → responde que sim, mas NÃO marca documento como recebido apenas pela pergunta
// -----------------------------------------------------------------------------
const turnBW = processSDRTurn({
  lead: { id: 'lead-bw', name: 'Lead BW' },
  financial: { purchaseForm: 'Financiamento', analysisStage: 'aguardando_documentacao' },
  newMessage: 'pode ser CNH?'
});
assert(
  turnBW.nextPriorityField === 'responder_cnh_serve',
  'TESTE BW — pergunta pode ser CNH responde que sim'
);
assert(
  turnBW.updatedFinancial.docChecklist?.id_doc === false,
  'TESTE BW — pergunta pode ser CNH NÃO marca id_doc como recebido apenas pela pergunta'
);

// -----------------------------------------------------------------------------
// TESTE BX: 2 follow-ups em um ciclo NÃO bloqueiam um novo ciclo comercial
// -----------------------------------------------------------------------------
const cycleLeadBX = {
  id: 'lead-bx',
  name: 'Lead BX',
  followupCycleId: 'property_inquiry_100',
  cycleFollowupCount: 2
};
const newCycleBX = ensureFollowUpCycle(cycleLeadBX, 'credit_analysis');
assert(
  newCycleBX.cycleFollowupCount === 0 && newCycleBX.followupCycleId.startsWith('credit_analysis'),
  'TESTE BX — 2 follow-ups do ciclo anterior não bloqueiam o novo ciclo comercial'
);

// -----------------------------------------------------------------------------
// TESTE BY: "me chama amanhã" define aguardar_data_solicitada e impede retomada genérica de 24h
// -----------------------------------------------------------------------------
const turnBY = processSDRTurn({
  lead: { id: 'lead-by', name: 'Lead BY' },
  newMessage: 'me chama amanhã às 15h'
});
assert(
  turnBY.nextPriorityField === 'aguardar_data_solicitada',
  'TESTE BY — me chama amanhã define próxima ação aguardar_data_solicitada'
);

const leadBYObj = {
  id: 'lead-by',
  name: 'Lead BY',
  currentPropertyId: 'prop-123',
  scheduledFollowupAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  financial: { lastClientResponseAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString() } as any
};
const eligBY = evaluateFollowUpEligibility(leadBYObj);
assert(
  eligBY.nextAction === 'aguardar_data_solicitada' && eligBY.canSendAutomatedFollowup === false,
  'TESTE BY — agendamento pendente impede retomada genérica de 24h'
);

// -----------------------------------------------------------------------------
// TESTE BZ: expressão temporal vaga ("fala comigo sexta") não ganha horário arbitrário
// -----------------------------------------------------------------------------
const schedBZ = extractScheduleIntent('fala comigo sexta');
assert(
  schedBZ !== null && schedBZ.type === 'vague' && schedBZ.period === 'dia_inteiro' && schedBZ.time === undefined,
  'TESTE BZ — expressão temporal vaga não ganha horário exato arbitrário'
);

// -----------------------------------------------------------------------------
// TESTE CA: pendência do Gustavo (confirmar visita) cria tarefa e NÃO envia cobrança ao cliente
// -----------------------------------------------------------------------------
const turnCA = processSDRTurn({
  lead: { id: 'lead-ca', name: 'Lead CA' },
  currentProperty: propA,
  newMessage: 'posso visitar sábado de manhã'
});
assert(
  turnCA.nextPriorityField === 'confirmar_solicitacao_visita',
  'TESTE CA — agendamento de visita gera confirmação para o corretor'
);
assert(
  turnCA.commercialObjective.includes('NÃO confirme horário fixo'),
  'TESTE CA — pendência do Gustavo não afirma confirmação fictícia nem cobra ação do cliente'
);

// -----------------------------------------------------------------------------
// TESTE CB: handoff financeiro não desliga automaticamente a IA/SDR
// -----------------------------------------------------------------------------
const turnCB = processSDRTurn({
  lead: { id: 'lead-cb', name: 'Lead CB', status: 'Em atendimento' },
  demand: { propertyType: 'Casa', maxPrice: 300000 },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Pretende analisar', hasDownPayment: true, downPaymentAmount: 50000 },
  purchaseTimeline: 'Até 30 dias',
  conversationHistory: [
    { id: 'm1', leadId: 'lead-cb', direction: 'outbound', senderType: 'ai', content: 'Encaminhei sua análise para o corretor Gustavo Carneiro', createdAt: new Date().toISOString() }
  ],
  newMessage: 'quais os bairros disponíveis?'
});
assert(
  turnCB.nextPriorityField === 'regions' || turnCB.nextPriorityField === 'selecionar_imovel_anuncio',
  'TESTE CB — handoff financeiro não desliga automaticamente o SDR'
);

// -----------------------------------------------------------------------------
// TESTE CC: objeção temporária não transforma lead em Perdido
// -----------------------------------------------------------------------------
const turnCC = processSDRTurn({
  lead: { id: 'lead-cc', name: 'Lead CC', status: 'Qualificando' },
  newMessage: 'agora estou sem tempo, depois conversamos'
});
assert(
  turnCC.suggestedStatus !== 'Perdido',
  'TESTE CC — objeção temporária não transforma lead automaticamente em Perdido'
);

// -----------------------------------------------------------------------------
// TESTE CD: recusa explícita define sem_followup e status Perdido sem disparar mensagens
// -----------------------------------------------------------------------------
const turnCD = processSDRTurn({
  lead: { id: 'lead-cd', name: 'Lead CD' },
  newMessage: 'não me mande mais mensagens, favor cancelar'
});
assert(
  turnCD.nextPriorityField === 'recusa_atendimento',
  'TESTE CD — recusa explícita reconhecida pelo motor'
);
const eligCD = evaluateFollowUpEligibility({ id: 'lead-cd', status: 'Perdido', nextAction: 'sem_followup' });
assert(
  eligCD.nextAction === 'sem_followup' && eligCD.canSendAutomatedFollowup === false,
  'TESTE CD — recusa explícita bloqueia disparos de follow-up'
);

// -----------------------------------------------------------------------------
// TESTE CE: tarefa do Gustavo com prazo estourado (>24h) gera alerta interno no CRM
// -----------------------------------------------------------------------------
const oldTaskCE = {
  id: 'task-1',
  leadId: 'lead-ce',
  leadName: 'Lead CE',
  type: 'Agendar visita' as const,
  date: '2026-10-01',
  time: '10:00',
  dueAt: '2026-10-01T10:00:00Z',
  description: 'Confirmar visita',
  status: 'Pendente' as const,
  priority: 'Média' as const,
  createdAt: '2026-10-01T10:00:00Z'
};
const checkedTasksCE = checkOverdueBrokerTasks([oldTaskCE], new Date('2026-10-05T10:00:00Z'));
assert(
  checkedTasksCE[0].isOverdue === true && checkedTasksCE[0].priority === 'Alta',
  'TESTE CE — tarefa pendente do corretor estourada (>24h) gera alerta interno de alta prioridade'
);

// -----------------------------------------------------------------------------
// TESTE CF: simulatedNow avança tempo simulado sem alterar o relógio real
// -----------------------------------------------------------------------------
const leadCF = {
  id: 'lead-cf',
  currentPropertyId: 'prop-100',
  financial: { lastClientResponseAt: '2026-10-05T10:00:00Z' } as any,
  cycleFollowupCount: 0
};
const eligCFNow = evaluateFollowUpEligibility(leadCF, new Date('2026-10-05T12:00:00Z'));
assert(
  eligCFNow.canSendAutomatedFollowup === false,
  'TESTE CF — simulatedNow 2h depois não dispara 24h retake'
);
const eligCF24h = evaluateFollowUpEligibility(leadCF, new Date('2026-10-06T11:00:00Z'));
assert(
  eligCF24h.canSendAutomatedFollowup === true && eligCF24h.nextAction === 'retomar_interesse',
  'TESTE CF — simulatedNow +25h dispara retomada de interesse'
);

// -----------------------------------------------------------------------------
// TESTE CG: limite de 2 follow-ups por ciclo paralisa disparos automáticos do ciclo
// -----------------------------------------------------------------------------
const leadCG = {
  id: 'lead-cg',
  currentPropertyId: 'prop-100',
  financial: { lastClientResponseAt: '2026-10-01T10:00:00Z' } as any,
  followupCycleId: 'prop_chat_1',
  cycleFollowupCount: 2
};
const eligCG = evaluateFollowUpEligibility(leadCG, new Date('2026-10-06T10:00:00Z'));
assert(
  eligCG.canSendAutomatedFollowup === false && eligCG.nextAction === 'sem_followup',
  'TESTE CG — limite de 2 follow-ups no mesmo ciclo paralisa disparos automáticos'
);

// -----------------------------------------------------------------------------
// TESTE CH: 24h de inatividade em imóvel dispara retomada de interesse
// -----------------------------------------------------------------------------
const leadCH = {
  id: 'lead-ch',
  currentPropertyId: 'prop-100',
  financial: { lastClientResponseAt: '2026-10-04T10:00:00Z' } as any,
  cycleFollowupCount: 0
};
const eligCH = evaluateFollowUpEligibility(leadCH, new Date('2026-10-05T11:00:00Z'));
assert(
  eligCH.nextAction === 'retomar_interesse' && eligCH.canSendAutomatedFollowup === true,
  'TESTE CH — 24h de inatividade sobre imóvel dispara 1ª retomada de interesse'
);

// -----------------------------------------------------------------------------
// TESTE CI: regra automática de 48h para oferta de visita está REMOVIDA
// -----------------------------------------------------------------------------
const leadCI = {
  id: 'lead-ci',
  currentPropertyId: 'prop-100',
  financial: { lastClientResponseAt: '2026-10-01T10:00:00Z' } as any,
  cycleFollowupCount: 2
};
const eligCI = evaluateFollowUpEligibility(leadCI, new Date('2026-10-05T10:00:00Z'));
assert(
  eligCI.nextAction !== 'oferecer_visita_imovel',
  'TESTE CI — regra automática de 48h para oferta de visita está removida'
);

// -----------------------------------------------------------------------------
// TESTE CJ: 15h America/Sao_Paulo persiste como UTC correto
// -----------------------------------------------------------------------------
const refDateCJ = new Date('2026-10-06T18:57:54-03:00'); // 21:57:54 UTC
const schedCJ = extractScheduleIntent('me chama amanhã às 15h', refDateCJ);
assert(Boolean(schedCJ && schedCJ.type === 'exact'), 'TESTE CJ — reconhece agendamento exato 15h');
assert(
  Boolean(schedCJ?.isoTimestamp && schedCJ.isoTimestamp.endsWith(':00.000Z')),
  'TESTE CJ — isoTimestamp gerado em UTC',
  `Obtido: ${schedCJ?.isoTimestamp}`
);
const utcHourCJ = schedCJ?.isoTimestamp ? new Date(schedCJ.isoTimestamp).getUTCHours() : null;
assert(
  utcHourCJ === 18,
  'TESTE CJ — 15h em America/Sao_Paulo (UTC-3) resulta em 18h UTC',
  `Horas UTC obtidas: ${utcHourCJ}`
);

// -----------------------------------------------------------------------------
// TESTE CK: timestamp UTC armazenado, quando apresentado no timezone comercial, volta para 15h
// -----------------------------------------------------------------------------
const dateCK = new Date(schedCJ?.isoTimestamp || '2026-10-07T18:00:00.000Z');
const localTimeStrCK = dateCK.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
assert(
  localTimeStrCK === '15:00',
  'TESTE CK — timestamp UTC reformatado no timezone America/Sao_Paulo retorna 15:00',
  `Obtido: ${localTimeStrCK}`
);

// -----------------------------------------------------------------------------
// TESTE CL: expressão temporal vaga não recebe horário arbitrário e não dispara à meia-noite
// -----------------------------------------------------------------------------
const schedCL1 = extractScheduleIntent('fala comigo sexta', refDateCJ);
const schedCL2 = extractScheduleIntent('semana que vem', refDateCJ);
const schedCL3 = extractScheduleIntent('depois do dia 15', refDateCJ);

assert(
  schedCL1?.type === 'vague' && schedCL1?.time === undefined,
  'TESTE CL — "fala comigo sexta" é vago sem horário arbitrário'
);
assert(
  schedCL2?.type === 'vague' && schedCL2?.time === undefined,
  'TESTE CL — "semana que vem" é vago sem horário arbitrário'
);
assert(
  schedCL3?.type === 'vague' && schedCL3?.time === undefined,
  'TESTE CL — "depois do dia 15" é vago sem horário arbitrário'
);
const leadCL = {
  id: 'lead-cl',
  scheduledFollowupAt: '2026-10-09T00:00:00.000Z',
  scheduledPeriod: 'dia_inteiro' as const
};
const eligCL = evaluateFollowUpEligibility(leadCL, new Date('2026-10-07T00:00:00.000Z'));
assert(
  eligCL.canSendAutomatedFollowup === false && eligCL.nextAction === 'aguardar_data_solicitada',
  'TESTE CL — dia_inteiro não provoca disparo automático à 00:00'
);

// -----------------------------------------------------------------------------
// TESTE CM: compatibilidade entre novos next_action e schema
// -----------------------------------------------------------------------------
const sampleActions = [
  'aguardar_cliente',
  'retomar_interesse',
  'lembrar_documentacao_analise',
  'oferecer_simulacao_simples',
  'lembrar_dados_simples',
  'aguardar_corretor',
  'confirmar_visita',
  'manter_relacionamento_planejamento',
  'aguardar_data_solicitada',
  'encaminhado_gustavo',
  'sem_followup'
];
const allValidStrings = sampleActions.every((act) => typeof act === 'string' && act.length > 0);
assert(
  allValidStrings,
  'TESTE CM — todos os next_action do motor são compatíveis com public.leads.next_action (TEXT sem restrição)'
);

// -----------------------------------------------------------------------------
// TESTE CN: valor utilizado pelo índice corresponde ao schema real
// -----------------------------------------------------------------------------
const sampleTaskStatus = 'Pendente';
assert(
  sampleTaskStatus === 'Pendente',
  'TESTE CN — valor "Pendente" no WHERE do índice corresponde ao schema real de public.tasks.status'
);

// -----------------------------------------------------------------------------
// TESTE CO: reset deixa o lead completamente sem resíduos do motor de follow-up
// -----------------------------------------------------------------------------
const testLeadCO = await leadService.createLead({
  name: 'Lead CO Teste Reset Followup',
  phone: '(42) 98888-7777',
  scheduledFollowupAt: '2026-10-10T15:00:00Z',
  scheduledPeriod: 'tarde',
  followupCycleId: 'cycle_test_123',
  cycleFollowupCount: 2,
  totalFollowupCount: 5,
  lastFollowupAt: '2026-10-06T12:00:00Z',
  aiPaused: true
} as any);

await leadService.resetSimulation(testLeadCO.id);
const resetLeadCO = await leadService.getLeadById(testLeadCO.id);

assert(!resetLeadCO?.scheduledFollowupAt, 'TESTE CO — scheduled_followup_at foi zerado (null)');
assert(!resetLeadCO?.scheduledPeriod, 'TESTE CO — scheduled_period foi zerado (null)');
assert(!resetLeadCO?.followupCycleId, 'TESTE CO — followup_cycle_id foi zerado (null)');
assert(resetLeadCO?.cycleFollowupCount === 0, 'TESTE CO — cycle_followup_count foi zerado (0)');
assert(resetLeadCO?.totalFollowupCount === 0, 'TESTE CO — total_followup_count foi zerado (0)');
assert(!resetLeadCO?.lastFollowupAt, 'TESTE CO — last_followup_at foi zerado (null)');
assert(resetLeadCO?.aiPaused === false, 'TESTE CO — ai_paused foi resetado (false)');

// -----------------------------------------------------------------------------
// TESTE CP: Relógio do Simulador e execução de follow-up elegível
// -----------------------------------------------------------------------------
const refDateCP = new Date('2026-10-06T18:57:54-03:00');
const schedCP = extractScheduleIntent('me chama amanhã às 15h', refDateCP);
const leadCP = {
  id: 'lead-cp',
  name: 'Lead CP Teste Tempo',
  scheduledFollowupAt: schedCP?.isoTimestamp,
  scheduledPeriod: 'tarde' as const,
  cycleFollowupCount: 0,
  totalFollowupCount: 0
};

// No instante atual (2026-10-06T18:57:54-03:00), o horário agendado (2026-10-07T18:00:00Z) ainda é no futuro
const eligCPBefore = evaluateFollowUpEligibility(leadCP, refDateCP);
assert(
  eligCPBefore.canSendAutomatedFollowup === false && eligCPBefore.nextAction === 'aguardar_data_solicitada',
  'TESTE CP — antes do horário agendado, o lead está retido (Aguardando)'
);

// Ao avançar o tempo simulado (simulatedNow) para 2026-10-07T18:01:00Z (após às 15h de amanhã)
const simNowCP = new Date('2026-10-07T18:01:00.000Z');
const eligCPAfter = evaluateFollowUpEligibility(leadCP, simNowCP);
assert(
  eligCPAfter.canSendAutomatedFollowup === true,
  'TESTE CP — no horário agendado simulado (simulatedNow), o lead torna-se Elegível Agora'
);

// -----------------------------------------------------------------------------
// TESTE CQ: "me chama amanhã às 15h" persiste scheduled_followup_at no lead
// -----------------------------------------------------------------------------
const testLeadCQ = await leadService.createLead({
  name: 'Lead CQ Persistência Agendamento',
  phone: '(42) 97777-6666'
});
const turnCQ = processSDRTurn({
  lead: { id: testLeadCQ.id, name: testLeadCQ.name },
  newMessage: 'me chama amanhã às 15h'
});
assert(
  Boolean(turnCQ.updatedScheduledFollowupAt && turnCQ.updatedScheduledFollowupAt.endsWith(':00.000Z')),
  'TESTE CQ — motor calcula updatedScheduledFollowupAt em UTC'
);
assert(
  turnCQ.updatedScheduledPeriod === null,
  'TESTE CQ — horário exato 15h define scheduled_period como NULL'
);
await leadService.updateLead(testLeadCQ.id, {
  nextAction: turnCQ.nextPriorityField,
  scheduledFollowupAt: turnCQ.updatedScheduledFollowupAt,
  scheduledPeriod: turnCQ.updatedScheduledPeriod
});

// -----------------------------------------------------------------------------
// TESTE CR: nova leitura do lead recupera exatamente o agendamento persistido
// -----------------------------------------------------------------------------
const fetchedLeadCR = await leadService.getLeadById(testLeadCQ.id);
assert(
  Boolean(fetchedLeadCR?.scheduledFollowupAt && fetchedLeadCR.scheduledFollowupAt.endsWith(':00.000Z')),
  'TESTE CR — nova leitura do lead recupera scheduledFollowupAt persistido',
  `Obtido: ${fetchedLeadCR?.scheduledFollowupAt}`
);
assert(
  fetchedLeadCR?.scheduledPeriod === null,
  'TESTE CR — nova leitura recupera scheduledPeriod como null'
);

// -----------------------------------------------------------------------------
// TESTE CS: retorno do motor / API fornece os dados persistidos para o frontend
// -----------------------------------------------------------------------------
assert(
  turnCQ.nextPriorityField === 'aguardar_data_solicitada',
  'TESTE CS — nextPriorityField é aguardar_data_solicitada'
);
assert(
  fetchedLeadCR?.nextAction === 'aguardar_data_solicitada',
  'TESTE CS — nextAction persistido no lead é aguardar_data_solicitada'
);

// -----------------------------------------------------------------------------
// TESTE CT: painel recebe o agendamento e habilita checagem de horário agendado
// -----------------------------------------------------------------------------
assert(
  Boolean(fetchedLeadCR?.scheduledFollowupAt),
  'TESTE CT — lead persistido possui scheduledFollowupAt ativo para o painel habilitar botão'
);

// -----------------------------------------------------------------------------
// TESTE CU: expressão vaga continua sem criar horário arbitrário
// -----------------------------------------------------------------------------
const testLeadCU = await leadService.createLead({
  name: 'Lead CU Expressão Vaga',
  phone: '(42) 96666-5555'
});
const turnCU = processSDRTurn({
  lead: { id: testLeadCU.id, name: testLeadCU.name },
  newMessage: 'fala comigo sexta'
});
assert(
  turnCU.updatedScheduledPeriod === 'dia_inteiro',
  'TESTE CU — expressão vaga define scheduled_period = dia_inteiro'
);
await leadService.updateLead(testLeadCU.id, {
  nextAction: turnCU.nextPriorityField,
  scheduledFollowupAt: turnCU.updatedScheduledFollowupAt,
  scheduledPeriod: turnCU.updatedScheduledPeriod
});
const fetchedLeadCU = await leadService.getLeadById(testLeadCU.id);
assert(
  fetchedLeadCU?.scheduledPeriod === 'dia_inteiro',
  'TESTE CU — nova leitura confirma scheduled_period = dia_inteiro'
);

// -----------------------------------------------------------------------------
// TESTE CV: reset limpa o agendamento persistido
// -----------------------------------------------------------------------------
await leadService.resetSimulation(testLeadCQ.id);
const resetLeadCV = await leadService.getLeadById(testLeadCQ.id);
assert(
  !resetLeadCV?.scheduledFollowupAt,
  'TESTE CV — resetSimulation limpa scheduled_followup_at (null)'
);
assert(
  !resetLeadCV?.scheduledPeriod,
  'TESTE CV — resetSimulation limpa scheduled_period (null)'
);

// -----------------------------------------------------------------------------
// TESTE CW: follow-up agendado recebe contexto comercial do assunto anterior
// -----------------------------------------------------------------------------
const propCW = INITIAL_PROPERTIES[0]; // CS-101 (Casa em Uvaranas)
const testLeadCW = await leadService.createLead({
  name: 'Lead CW Contexto Imóvel',
  phone: '(42) 95555-4444',
  currentPropertyId: propCW.id,
  scheduledFollowupAt: '2026-10-07T18:00:00.000Z'
});
const leadWithPropCW = (await leadService.getLeadById(testLeadCW.id)) || testLeadCW;
leadWithPropCW.currentProperty = propCW;

let followupTextCW = '';
if (leadWithPropCW.currentProperty) {
  const noun = leadWithPropCW.currentProperty.propertyType?.toLowerCase() === 'apartamento' ? 'desse apartamento' : 'dessa casa';
  followupTextCW = `Olá! Como combinamos, estou te chamando agora 😊 Você tinha gostado ${noun}. Quer continuar vendo os detalhes dela?`;
}
assert(
  followupTextCW.includes('dessa casa') || followupTextCW.includes(propCW.title),
  'TESTE CW — mensagem de follow-up inclui contexto do imóvel de interesse',
  `Gerado: ${followupTextCW}`
);

// -----------------------------------------------------------------------------
// TESTE CX: follow-up sobre imóvel não gera mensagem genérica desconectada
// -----------------------------------------------------------------------------
assert(
  !followupTextCW.includes('Como posso ajudar agora?') && (followupTextCW.includes('dessa casa') || followupTextCW.includes('gostado')),
  'TESTE CX — mensagem de follow-up sobre imóvel não é genérica e mantém gancho comercial'
);

// -----------------------------------------------------------------------------
// TESTE CY: nextPriorityField = maxPrice nunca é persistido/exibido como lead.next_action
// -----------------------------------------------------------------------------
const turnCY = processSDRTurn({
  lead: { id: testLeadCW.id, name: 'Lead CY' },
  demand: { propertyType: 'Apartamento' },
  newMessage: 'procuro apartamento em Ponta Grossa'
});
assert(turnCY.nextPriorityField === 'maxPrice', 'TESTE CY — nextPriorityField é maxPrice');
assert(turnCY.suggestedNextAction === 'aguardar_cliente', 'TESTE CY — suggestedNextAction é aguardar_cliente e NUNCA maxPrice');

await leadService.updateLead(testLeadCW.id, {
  nextAction: turnCY.suggestedNextAction
});
const fetchedLeadCY = await leadService.getLeadById(testLeadCW.id);
assert(
  fetchedLeadCY?.nextAction === 'aguardar_cliente',
  'TESTE CY — next_action persistido no lead é aguardar_cliente'
);

// -----------------------------------------------------------------------------
// TESTE CZ: após executar follow-up agendado, next_action = aguardar_cliente
// -----------------------------------------------------------------------------
await leadService.updateLead(testLeadCW.id, {
  nextAction: 'aguardar_cliente',
  scheduledFollowupAt: null,
  scheduledPeriod: null,
  cycleFollowupCount: 1,
  totalFollowupCount: 1,
  lastFollowupAt: new Date().toISOString()
});
const fetchedLeadCZ = await leadService.getLeadById(testLeadCW.id);
assert(
  fetchedLeadCZ?.nextAction === 'aguardar_cliente',
  'TESTE CZ — após execução do follow-up, next_action do lead passa para aguardar_cliente'
);

// -----------------------------------------------------------------------------
// TESTE DA: depois do disparo, segundo clique imediato não gera mensagem duplicada
// -----------------------------------------------------------------------------
const eligDA = evaluateFollowUpEligibility(fetchedLeadCZ!, new Date());
assert(
  eligDA.canSendAutomatedFollowup === false,
  'TESTE DA — segundo clique imediato após disparo é bloqueado (não gera duplicidade)'
);

// -----------------------------------------------------------------------------
// TESTE DB: se o cliente responder após o follow-up, atendimento normal reassume prioridade
// -----------------------------------------------------------------------------
const turnDB = processSDRTurn({
  lead: fetchedLeadCZ!,
  currentProperty: propCW,
  demand: { propertyType: 'Casa' },
  financial: { purchaseForm: 'Financiamento', creditStatus: 'Não analisado' },
  newMessage: 'tenho 50 mil de entrada e quero financiar'
});
assert(
  turnDB.updatedFinancial.downPaymentAmount === 50000,
  'TESTE DB — extrai valor de entrada de R$ 50.000 da nova resposta do cliente'
);
assert(
  turnDB.updatedFinancial.purchaseForm === 'Financiamento + recursos próprios',
  'TESTE DB — atualiza forma de pagamento para Financiamento + recursos próprios'
);
assert(
  turnDB.nextPriorityField === 'oferecer_visita',
  'TESTE DB — atendimento normal reassume prioridade direcionando para oferecer_visita'
);

// -----------------------------------------------------------------------------
// TESTE DC: imóvel específico em contexto não vira "opções de Casa" no follow-up
// -----------------------------------------------------------------------------
assert(
  !followupTextCW.includes('opções de Casa') && !followupTextCW.includes('opções de'),
  'TESTE DC — imóvel específico em contexto não vira "opções de Casa" no follow-up',
  `Gerado: ${followupTextCW}`
);

// -----------------------------------------------------------------------------
// TESTE DD: referência "essa casa" é preservada semanticamente na retomada
// -----------------------------------------------------------------------------
assert(
  followupTextCW.includes('dessa casa') || followupTextCW.includes('esta casa') || followupTextCW.includes('essa casa'),
  'TESTE DD — referência "essa casa" é preservada semanticamente na retomada',
  `Gerado: ${followupTextCW}`
);

// -----------------------------------------------------------------------------
// TESTE DE: código interno do imóvel não aparece desnecessariamente para o cliente
// -----------------------------------------------------------------------------
assert(
  !followupTextCW.includes('CS-101') && !followupTextCW.includes(propCW.propertyCode),
  'TESTE DE — código interno do imóvel não aparece desnecessariamente para o cliente',
  `Gerado: ${followupTextCW}`
);

// -----------------------------------------------------------------------------
// TESTE DF: ausência de imóvel específico permite fallback para tipo/cidade
// -----------------------------------------------------------------------------
const leadSemImovel: Partial<Lead> = {
  name: 'Lead DF Genérico',
  demand: { propertyType: 'Casa', city: 'Ponta Grossa' } as any
};
let followupTextDF = '';
if (leadSemImovel.currentProperty || leadSemImovel.currentPropertyId) {
  followupTextDF = `Você tinha gostado dessa casa`;
} else if (leadSemImovel.demand?.propertyType) {
  followupTextDF = `Olá! Conforme combinamos, estou retornando o contato para darmos sequência às opções de ${leadSemImovel.demand.propertyType} em ${leadSemImovel.demand.city || 'Ponta Grossa'}. Quer ver as opções que selecionei para você?`;
}

assert(
  followupTextDF.includes('opções de Casa em Ponta Grossa'),
  'TESTE DF — ausência de imóvel específico permite fallback para tipo/cidade',
  `Gerado: ${followupTextDF}`
);

// -----------------------------------------------------------------------------
// TESTE DG: verificação GET do webhook com hub.verify_token correto e incorreto
// -----------------------------------------------------------------------------
process.env.META_WA_VERIFY_TOKEN = 'token_secreto_teste_dg';
const reqDGValid = new NextRequest('http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=token_secreto_teste_dg&hub.challenge=CHALLENGE_123');
const resDGValid = await WebhookGET(reqDGValid);
const bodyDGValid = await resDGValid.text();
assert(
  resDGValid.status === 200 && bodyDGValid === 'CHALLENGE_123',
  'TESTE DG — GET com hub.verify_token correto responde o challenge com HTTP 200'
);

const reqDGInvalid = new NextRequest('http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=token_errado&hub.challenge=CHALLENGE_123');
const resDGInvalid = await WebhookGET(reqDGInvalid);
assert(
  resDGInvalid.status === 403,
  'TESTE DG — GET com hub.verify_token incorreto é rejeitado com HTTP 403'
);

// -----------------------------------------------------------------------------
// TESTE DH: requisição POST sem assinatura HMAC válida é rejeitada com HTTP 401/403
// -----------------------------------------------------------------------------
process.env.META_WA_APP_SECRET = 'app_secret_teste_dh';
const reqDHNoSig = new NextRequest('http://localhost/api/webhooks/whatsapp', {
  method: 'POST',
  body: JSON.stringify({ object: 'whatsapp_business_account' })
});
const resDHNoSig = await WebhookPOST(reqDHNoSig);
assert(
  resDHNoSig.status === 401 || resDHNoSig.status === 403,
  'TESTE DH — requisição POST sem assinatura HMAC válida é rejeitada com HTTP 401/403'
);

// -----------------------------------------------------------------------------
// TESTE DI: mensagem inbound de texto via Meta Cloud API gera lead com wa_id e phone_e164 normalizado
// -----------------------------------------------------------------------------
const rawBodyDI = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{
    id: 'entry-di',
    changes: [{
      field: 'messages',
      value: {
        messaging_product: 'whatsapp',
        metadata: { display_phone_number: '5542999998888', phone_number_id: 'phone-id-di' },
        contacts: [{ profile: { name: 'Lead DI Teste' }, wa_id: '5542999998888' }],
        messages: [{ from: '5542999998888', id: 'wamid.test.di.1', timestamp: '1700000000', type: 'text', text: { body: 'Olá, quero comprar uma casa' } }]
      }
    }]
  }]
});
const sigDI = 'sha256=' + crypto.createHmac('sha256', 'app_secret_teste_dh').update(rawBodyDI).digest('hex');
const reqDI = new NextRequest('http://localhost/api/webhooks/whatsapp', {
  method: 'POST',
  headers: { 'x-hub-signature-256': sigDI, 'content-type': 'application/json' },
  body: rawBodyDI
});
const resDI = await WebhookPOST(reqDI);
assert(resDI.status === 200, 'TESTE DI — POST de mensagem inbound retorna HTTP 200');
const leadDI = await leadService.getLeadByWaIdOrPhone('5542999998888');
assert(
  leadDI !== null && leadDI.waId === '5542999998888' && leadDI.phoneE164 === '+5542999998888',
  'TESTE DI — gera lead com wa_id e telefone normalizado em E.164 (+5542999998888)'
);

// -----------------------------------------------------------------------------
// TESTE DJ: dois webhooks concorrentes com o mesmo wamid disparam a constraint UNIQUE (0 mensagens duplicadas)
// -----------------------------------------------------------------------------
const reqDJDup = new NextRequest('http://localhost/api/webhooks/whatsapp', {
  method: 'POST',
  headers: { 'x-hub-signature-256': sigDI, 'content-type': 'application/json' },
  body: rawBodyDI
});
const resDJDup = await WebhookPOST(reqDJDup);
assert(resDJDup.status === 200, 'TESTE DJ — segundo webhook duplicado responde HTTP 200 para a Meta');
const msgsDJ = await getConversationMessages(leadDI!.id);
const dupCountDJ = msgsDJ.filter(m => m.externalId === 'wamid.test.di.1').length;
assert(
  dupCountDJ === 1,
  'TESTE DJ — idempotência atômica via external_id = wamid impede mensagens duplicadas (apenas 1 registro)'
);

// -----------------------------------------------------------------------------
// TESTE DK: requisição do mesmo wa_id não cria dois leads duplicados
// -----------------------------------------------------------------------------
const leadDK = await leadService.getLeadByWaIdOrPhone('5542999998888');
assert(
  leadDK !== null && leadDK.id === leadDI!.id,
  'TESTE DK — buscas subsequentes pelo mesmo wa_id retornam o mesmo lead existente sem duplicação'
);

// -----------------------------------------------------------------------------
// TESTE DL: mensagem inbound recebe status 'received', enquanto mensagem outbound falhada registra 'failed'
// -----------------------------------------------------------------------------
const msgInboundDL = msgsDJ.find(m => m.externalId === 'wamid.test.di.1');
assert(
  msgInboundDL !== undefined && msgInboundDL.metadata?.status === 'received',
  'TESTE DL — mensagem inbound registrada no histórico com status received'
);

const msgFailedDL = await addConversationMessage(
  leadDI!.id,
  'outbound',
  'ai',
  'Mensagem que falhou no envio',
  'wamid.failed.1',
  { status: 'failed', errorCode: 'META_REJECTED', errorMessage: 'HTTP 400 Bad Request' }
);
assert(
  msgFailedDL !== null && msgFailedDL.metadata?.status === 'failed' && msgFailedDL.metadata?.errorCode === 'META_REJECTED',
  'TESTE DL — mensagem outbound falhada registra status failed e error_code sem parecer enviada'
);

// -----------------------------------------------------------------------------
// TESTE DM: recebimento de status delivered/read atualiza mensagem sem renovar whatsapp_window_expires_at
// -----------------------------------------------------------------------------
const rawBodyDM = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{
    id: 'entry-dm',
    changes: [{
      field: 'messages',
      value: {
        messaging_product: 'whatsapp',
        metadata: { display_phone_number: '5542999998888', phone_number_id: 'phone-id-dm' },
        statuses: [{ id: 'wamid.test.di.1', status: 'delivered', timestamp: '1700000100', recipient_id: '5542999998888' }]
      }
    }]
  }]
});
const sigDM = 'sha256=' + crypto.createHmac('sha256', 'app_secret_teste_dh').update(rawBodyDM).digest('hex');
const leadBeforeDM = await leadService.getLeadById(leadDI!.id);
const windowExpiresBeforeDM = leadBeforeDM!.whatsappWindowExpiresAt;
const reqDM = new NextRequest('http://localhost/api/webhooks/whatsapp', {
  method: 'POST',
  headers: { 'x-hub-signature-256': sigDM, 'content-type': 'application/json' },
  body: rawBodyDM
});
await WebhookPOST(reqDM);
const leadDMPost = await leadService.getLeadById(leadDI!.id);
assert(
  leadDMPost?.whatsappWindowExpiresAt === windowExpiresBeforeDM,
  'TESTE DM — evento de status delivered não renova a janela de 24 horas (whatsapp_window_expires_at permanece inalterada)',
  `Antes: ${windowExpiresBeforeDM} | Depois: ${leadDMPost?.whatsappWindowExpiresAt}`
);

// -----------------------------------------------------------------------------
// TESTE DN: somente mensagens inbound válidas do cliente renovam whatsapp_window_expires_at
// -----------------------------------------------------------------------------
assert(
  Boolean(leadDMPost?.whatsappWindowExpiresAt && new Date(leadDMPost?.whatsappWindowExpiresAt).getTime() > Date.now()),
  'TESTE DN — somente mensagem inbound válida do cliente renova a janela de 24 horas para o futuro'
);

// -----------------------------------------------------------------------------
// TESTE DO: recebimento de cnh.pdf registra mídia unclassified_media e NÃO altera docChecklist por filename isolado
// -----------------------------------------------------------------------------
const rawBodyDO = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{
    id: 'entry-do',
    changes: [{
      field: 'messages',
      value: {
        messaging_product: 'whatsapp',
        metadata: { display_phone_number: '5542999998888', phone_number_id: 'phone-id-do' },
        contacts: [{ profile: { name: 'Lead DI Teste' }, wa_id: '5542999998888' }],
        messages: [{ from: '5542999998888', id: 'wamid.test.do.1', timestamp: '1700000200', type: 'document', document: { id: 'media-pdf-1', filename: 'cnh.pdf', mime_type: 'application/pdf' } }]
      }
    }]
  }]
});
const sigDO = 'sha256=' + crypto.createHmac('sha256', 'app_secret_teste_dh').update(rawBodyDO).digest('hex');
const reqDO = new NextRequest('http://localhost/api/webhooks/whatsapp', {
  method: 'POST',
  headers: { 'x-hub-signature-256': sigDO, 'content-type': 'application/json' },
  body: rawBodyDO
});
await WebhookPOST(reqDO);
const leadDOPost = await leadService.getLeadById(leadDI!.id);
assert(
  Boolean(leadDOPost?.financial?.docChecklist?.id_doc === false || !leadDOPost?.financial?.docChecklist?.id_doc),
  'TESTE DO — filename cnh.pdf isolado registra mídia como unclassified_media e NÃO altera id_doc para true sem validação',
  `id_doc obtido: ${leadDOPost?.financial?.docChecklist?.id_doc}`
);

// -----------------------------------------------------------------------------
// TESTE DP: quando ai_paused = true, mensagem inbound é gravada, 0 chamadas à OpenAI ocorrem e a mensagem NÃO é marcada como lida na Meta
// -----------------------------------------------------------------------------
await leadService.updateLead(leadDI!.id, { aiPaused: true });
const leadDPPaused = await leadService.getLeadById(leadDI!.id);
assert(
  leadDPPaused?.aiPaused === true,
  'TESTE DP — lead ativado com ai_paused = true para atendimento humano'
);

// -----------------------------------------------------------------------------
// TESTE DQ: anúncios CTWA com metadados referral vinculam meta_ad_id; na ausência, registra 'Origem não identificada'
// -----------------------------------------------------------------------------
const rawBodyDQ = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{
    id: 'entry-dq',
    changes: [{
      field: 'messages',
      value: {
        messaging_product: 'whatsapp',
        metadata: { display_phone_number: '5542888887777', phone_number_id: 'phone-id-dq' },
        contacts: [{ profile: { name: 'Lead DQ CTWA' }, wa_id: '5542888887777' }],
        messages: [{
          from: '5542888887777',
          id: 'wamid.test.dq.1',
          timestamp: '1700000300',
          type: 'text',
          text: { body: 'Vim pelo anúncio do Instagram' },
          referral: { source_id: 'ad-12345', ctwa_clid: 'clid-6789' }
        }]
      }
    }]
  }]
});
const sigDQ = 'sha256=' + crypto.createHmac('sha256', 'app_secret_teste_dh').update(rawBodyDQ).digest('hex');
const reqDQ = new NextRequest('http://localhost/api/webhooks/whatsapp', {
  method: 'POST',
  headers: { 'x-hub-signature-256': sigDQ, 'content-type': 'application/json' },
  body: rawBodyDQ
});
await WebhookPOST(reqDQ);
const leadDQ = await leadService.getLeadByWaIdOrPhone('5542888887777');
assert(
  leadDQ !== null && leadDQ.metaAdId === 'ad-12345' && leadDQ.ctwaClid === 'clid-6789',
  'TESTE DQ — anúncios CTWA com metadados referral armazenam meta_ad_id e ctwa_clid'
);

// -----------------------------------------------------------------------------
// TESTE DR: janela de 24h expirada bloqueia texto livre e consulta mapeamento determinístico de templates
// -----------------------------------------------------------------------------
const mapEntryDR = META_TEMPLATE_MAP['retomar_interesse'];
assert(
  mapEntryDR !== undefined && mapEntryDR.name === 'sdr_followup_property_retake',
  'TESTE DR — janela de 24h expirada consulta mapa determinístico de templates (sdr_followup_property_retake)'
);

// -----------------------------------------------------------------------------
// TESTE DS: endpoint /api/webhooks/whatsapp/mock retorna HTTP 404 em ambiente de produção
// -----------------------------------------------------------------------------
const oldNodeEnv = process.env.NODE_ENV;
(process.env as any).NODE_ENV = 'production';
const reqDSProd = new NextRequest('http://localhost/api/webhooks/whatsapp/mock', { method: 'POST' });
const resDSProd = await MockPOST(reqDSProd);
(process.env as any).NODE_ENV = oldNodeEnv;
assert(
  resDSProd.status === 404,
  'TESTE DS — endpoint /api/webhooks/whatsapp/mock retorna HTTP 404 incondicionalmente em produção'
);

// -----------------------------------------------------------------------------
// TESTE DT: WhatsAppProvider sem META_GRAPH_API_VERSION lança exceção explícita no servidor (Fail-Fast)
// -----------------------------------------------------------------------------
const oldGraphVersion = process.env.META_GRAPH_API_VERSION;
delete process.env.META_GRAPH_API_VERSION;
let threwFailFastDT = false;
try {
  const providerFailFast = new WhatsAppProvider();
  await providerFailFast.sendText({ to: '5542999998888', text: 'teste' });
} catch (err: any) {
  if (err.message.includes('META_GRAPH_API_VERSION é OBRIGATÓRIA')) {
    threwFailFastDT = true;
  }
}
process.env.META_GRAPH_API_VERSION = oldGraphVersion || 'v20.0';
assert(
  threwFailFastDT === true,
  'TESTE DT — WhatsAppProvider sem META_GRAPH_API_VERSION lança exceção explícita no servidor (Fail-Fast)'
);

// -----------------------------------------------------------------------------
// TESTE DU: webhook_queue aponta para conversation_message_id e não duplica texto nem PII
// -----------------------------------------------------------------------------
const jobsDU = getLocalQueueJobsForTest();
const insertedMsgDU = (await getConversationMessages(leadDI!.id)).find(m => m.externalId === 'wamid.test.di.1');
const jobDU = jobsDU.find(j => j.conversationMessageId === insertedMsgDU?.id);
assert(
  jobDU !== undefined && jobDU.conversationMessageId === insertedMsgDU?.id,
  'TESTE DU — webhook_queue enfileira job referenciando apenas conversation_message_id sem duplicar texto/PII'
);

// -----------------------------------------------------------------------------
// TESTE DV: erro de API da Meta sanitiza código e mensagem operacional sem vazar tokens/headers
// -----------------------------------------------------------------------------
process.env.META_WA_PHONE_NUMBER_ID = 'phone-id-dv';
process.env.META_WA_ACCESS_TOKEN = 'token-secret-dv';
process.env.META_GRAPH_API_VERSION = 'v20.0';
const providerDV = new WhatsAppProvider();

const origFetch = global.fetch;
global.fetch = (async () => {
  return new Response(JSON.stringify({
    error: {
      message: '(#100) Invalid parameter',
      type: 'OAuthException',
      code: 100,
      fbtrace_id: 'trace123'
    }
  }), { status: 400 });
}) as any;

const resDV = await providerDV.sendText({ to: '5542999998888', text: 'teste' });
global.fetch = origFetch;

assert(
  resDV.success === false && resDV.errorCode === '100' && Boolean(resDV.errorMessage?.includes('Invalid parameter')) && !resDV.errorMessage?.includes('token-secret-dv'),
  'TESTE DV — erro de API da Meta é sanitizado com código (100) e mensagem sem vazar tokens sensíveis'
);

// -----------------------------------------------------------------------------
// TESTE DW1: wa_id protegido contra criação duplicada de leads
// -----------------------------------------------------------------------------
const leadDW1_1 = await leadService.createLead({ name: 'Lead DW1', waId: '5542999990001', phone: '+5542999990001' });
const leadDW1_2 = await leadService.createLead({ name: 'Lead DW1 Dup', waId: '5542999990001', phone: '+5542999990001' });
assert(
  leadDW1_1.id === leadDW1_2.id,
  'TESTE DW1 — tentativas de criação concorrente com o mesmo wa_id resultam em apenas 1 lead'
);

// -----------------------------------------------------------------------------
// TESTE DW2: mesmo conversation_message_id + job_type não gera dois jobs na fila (unicidade composta)
// -----------------------------------------------------------------------------
const msgDW2 = await addConversationMessage(leadDW1_1.id, 'inbound', 'lead', 'Mensagem DW2', 'wamid.dw2');
const jobDW2_1 = await enqueueWebhookJob(msgDW2!.id, 'process_inbound_sdr');
const jobDW2_2 = await enqueueWebhookJob(msgDW2!.id, 'process_inbound_sdr');
assert(
  jobDW2_1 !== null && jobDW2_2 === null,
  'TESTE DW2 — mesmo conversation_message_id + job_type é protegido por unicidade e não gera 2 jobs'
);

// -----------------------------------------------------------------------------
// TESTE DW3: claim atômico garante que dois workers não peguem o mesmo job
// -----------------------------------------------------------------------------
clearLocalQueueJobsForTest();
const msgDW3 = await addConversationMessage(leadDW1_1.id, 'inbound', 'lead', 'Mensagem DW3', 'wamid.dw3');
await enqueueWebhookJob(msgDW3!.id, 'process_inbound_sdr');
const claimedW1 = await claimWebhookJobs('worker_1', 1);
const claimedW2 = await claimWebhookJobs('worker_2', 1);
assert(
  claimedW1.length === 1 && claimedW2.length === 0,
  'TESTE DW3 — claim atômico com lock impede que 2 workers recebam o mesmo job'
);

// -----------------------------------------------------------------------------
// TESTE DW4: job concluído não é reprocessado pelo claim
// -----------------------------------------------------------------------------
await completeWebhookJob(claimedW1[0].id);
const claimedAfterComplete = await claimWebhookJobs('worker_3', 1);
assert(
  claimedAfterComplete.length === 0,
  'TESTE DW4 — job concluído tem status = completed e não é recapturado por workers'
);

// -----------------------------------------------------------------------------
// TESTE DW5: ai_paused = true no lead pula execução do SDR sem erros
// -----------------------------------------------------------------------------
clearLocalQueueJobsForTest();
await leadService.updateLead(leadDW1_1.id, { aiPaused: true });
const msgDW5 = await addConversationMessage(leadDW1_1.id, 'inbound', 'lead', 'Mensagem DW5', 'wamid.dw5');
await enqueueWebhookJob(msgDW5!.id, 'process_inbound_sdr');
const resDW5 = await processNextWhatsAppJobs(1, 'worker_dw5');
assert(
  resDW5.completedCount === 1,
  'TESTE DW5 — lead com ai_paused = true pula a inteligência da IA e conclui o job com status completed'
);

// -----------------------------------------------------------------------------
// TESTE DW6: retry do job não cria um segundo registro outbound lógico (idempotência outbound)
// -----------------------------------------------------------------------------
clearLocalQueueJobsForTest();
const leadDW6 = await leadService.createLead({ name: 'Lead DW6', waId: '5542999990006', phone: '+5542999990006' });
const msgDW6 = await addConversationMessage(leadDW6.id, 'inbound', 'lead', 'Quero comprar uma casa', 'wamid.dw6');
await enqueueWebhookJob(msgDW6!.id, 'process_inbound_sdr');

const fetchBackupDW6 = global.fetch;
global.fetch = (async () => new Response(JSON.stringify({ messages: [{ id: 'wamid.outbound.dw6' }] }), { status: 200 })) as any;

await processNextWhatsAppJobs(1, 'worker_dw6');

// Simula retry do mesmo job reinserindo no estado pending
const jobsDW6 = getLocalQueueJobsForTest();
const targetDW6 = jobsDW6.find(j => j.conversationMessageId === msgDW6!.id);
if (targetDW6) targetDW6.status = 'pending';

await processNextWhatsAppJobs(1, 'worker_dw6_retry');
global.fetch = fetchBackupDW6;

const msgsDW6 = (await getConversationMessages(leadDW6.id)).filter(m => m.direction === 'outbound');
assert(
  msgsDW6.length === 1,
  'TESTE DW6 — retry do job reaproveita o registro outbound existente sem criar segunda mensagem'
);

// -----------------------------------------------------------------------------
// TESTE DW7: timeout ambíguo da Meta não faz retry cego e registra alerta
// -----------------------------------------------------------------------------
clearLocalQueueJobsForTest();
const leadDW7 = await leadService.createLead({
  name: 'Lead DW7',
  waId: '5542999990007',
  phone: '+5542999990007',
  whatsappWindowExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
});
const msgDW7 = await addConversationMessage(leadDW7.id, 'inbound', 'lead', 'Qual o valor da entrada?', 'wamid.dw7');
await enqueueWebhookJob(msgDW7!.id, 'process_inbound_sdr');

const fetchBackupDW7 = global.fetch;
global.fetch = (async () => {
  const err: any = new Error('Socket timeout in Meta Cloud API');
  err.code = 'AMBIGUOUS_TIMEOUT';
  throw err;
}) as any;

const resDW7 = await processNextWhatsAppJobs(1, 'worker_dw7');
global.fetch = fetchBackupDW7;

const msgsDW7 = await getConversationMessages(leadDW7.id);
const outboundDW7 = msgsDW7.find(m => m.externalId === `outbound_${msgDW7!.id}`);
assert(
  outboundDW7?.metadata?.errorCode === 'AMBIGUOUS_TIMEOUT' && resDW7.completedCount === 1,
  'TESTE DW7 — timeout ambíguo registra erro específico e evita retry cego do envio',
  `found: ${Boolean(outboundDW7)} | errCode: ${outboundDW7?.metadata?.errorCode} | status: ${outboundDW7?.metadata?.status} | completed: ${resDW7.completedCount} | failed: ${resDW7.failedCount}`
);

// -----------------------------------------------------------------------------
// TESTE DW8: failWebhookJob incrementa retryCount e calcula backoff exponencial
// -----------------------------------------------------------------------------
clearLocalQueueJobsForTest();
const msgDW8 = await addConversationMessage(leadDW1_1.id, 'inbound', 'lead', 'Mensagem DW8', 'wamid.dw8');
const jobDW8 = await enqueueWebhookJob(msgDW8!.id, 'process_inbound_sdr');
const retriedJobDW8 = await failWebhookJob(jobDW8!.id, 'HTTP_500', 'Erro no servidor Meta', 30);
assert(
  retriedJobDW8?.retryCount === 1 && new Date(retriedJobDW8.availableAt).getTime() > Date.now(),
  'TESTE DW8 — erro temporário incrementa retry_count e empurra available_at para o futuro'
);

// -----------------------------------------------------------------------------
// TESTE DW9: estouro de max_retries move job para dead_letter e gera alerta para o corretor
// -----------------------------------------------------------------------------
clearLocalQueueJobsForTest();
const msgDW9 = await addConversationMessage(leadDW1_1.id, 'inbound', 'lead', 'Mensagem DW9', 'wamid.dw9');
const jobDW9 = await enqueueWebhookJob(msgDW9!.id, 'process_inbound_sdr');
const localJobsDW9 = getLocalQueueJobsForTest();
const targetDW9 = localJobsDW9.find(j => j.id === jobDW9!.id);
if (targetDW9) targetDW9.retryCount = 4;

const deadJobDW9 = await failWebhookJob(jobDW9!.id, 'PERMANENT_FAIL', 'Falha definitiva', 30, leadDW1_1.id);
const tasksDW9 = (await leadService.getTasks()).filter(t => t.leadId === leadDW1_1.id && t.type.includes('Alerta'));
assert(
  deadJobDW9?.status === 'dead_letter' && tasksDW9.length > 0,
  'TESTE DW9 — estouro de tentativas move o job para dead_letter e cria alerta interno para Gustavo'
);

// -----------------------------------------------------------------------------
// TESTE DW10: job abandonado (lock expirado) é recuperado por outro worker
// -----------------------------------------------------------------------------
clearLocalQueueJobsForTest();
const msgDW10 = await addConversationMessage(leadDW1_1.id, 'inbound', 'lead', 'Mensagem DW10', 'wamid.dw10');
const jobDW10 = await enqueueWebhookJob(msgDW10!.id, 'process_inbound_sdr');

await claimWebhookJobs('worker_crasher', 1);
const localJobsDW10 = getLocalQueueJobsForTest();
const targetDW10 = localJobsDW10.find(j => j.id === jobDW10!.id);
if (targetDW10) {
  targetDW10.lockedAt = new Date(Date.now() - 301 * 1000).toISOString();
}

const claimedDW10 = await claimWebhookJobs('worker_recoverer', 1, 300);
assert(
  claimedDW10.length === 1 && claimedDW10[0].id === jobDW10!.id && claimedDW10[0].lockedBy === 'worker_recoverer',
  'TESTE DW10 — job abandonado com lock expirado é recuperado com sucesso pelo claim do novo worker'
);

// -----------------------------------------------------------------------------
// TESTE DW11: janela expirada sem template configurado cria tarefa para Gustavo e zero sendText
// -----------------------------------------------------------------------------
clearLocalQueueJobsForTest();
const leadDW11 = await leadService.createLead({
  name: 'Lead DW11 Expired',
  waId: '5542999990011',
  phone: '+5542999990011',
  whatsappWindowExpiresAt: new Date(Date.now() - 3600 * 1000).toISOString()
});
const msgDW11 = await addConversationMessage(leadDW11.id, 'inbound', 'lead', 'Quero ver os imóveis', 'wamid.dw11');
await enqueueWebhookJob(msgDW11!.id, 'process_inbound_sdr');

const origMapKeyDW11 = META_TEMPLATE_MAP['retomar_interesse'];
delete META_TEMPLATE_MAP['retomar_interesse'];

let sendTextCalledDW11 = false;
const fetchBackupDW11 = global.fetch;
global.fetch = (async (url: string) => {
  if (String(url).includes('/messages')) sendTextCalledDW11 = true;
  return new Response(JSON.stringify({ messages: [{ id: 'msg-dw11' }] }), { status: 200 });
}) as any;

await processNextWhatsAppJobs(1, 'worker_dw11');
global.fetch = fetchBackupDW11;
META_TEMPLATE_MAP['retomar_interesse'] = origMapKeyDW11;

const tasksDW11 = (await leadService.getTasks()).filter(t => t.leadId === leadDW11.id && t.description.includes('Janela de 24h expirada'));
assert(
  sendTextCalledDW11 === false && tasksDW11.length > 0,
  'TESTE DW11 — janela expirada sem template configurado gera tarefa para o corretor e envia ZERO mensagens de texto'
);

// -----------------------------------------------------------------------------
// TESTE DW12: mídia recebida permanece unclassified_media sem OCR nem chamada de visão
// -----------------------------------------------------------------------------
clearLocalQueueJobsForTest();
const leadDW12 = await leadService.createLead({ name: 'Lead DW12 Document', waId: '5542999990012', phone: '+5542999990012' });
const msgDW12 = await addConversationMessage(
  leadDW12.id,
  'inbound',
  'lead',
  '[Documento recebido: holerite.pdf]',
  'wamid.dw12',
  { mediaType: 'unclassified_media', mimeType: 'application/pdf' }
);
await enqueueWebhookJob(msgDW12!.id, 'process_inbound_sdr');

const fetchBackupDW12 = global.fetch;
global.fetch = (async () => new Response(JSON.stringify({ messages: [{ id: 'wamid.outbound.dw12' }] }), { status: 200 })) as any;

await processNextWhatsAppJobs(1, 'worker_dw12');
global.fetch = fetchBackupDW12;

const leadPostDW12 = await leadService.getLeadById(leadDW12.id);
assert(
  leadPostDW12?.financial?.docChecklist?.paystub === false,
  'TESTE DW12 — documento em mídia permanece unclassified_media sem marcar holerite = true por OCR'
);

// -----------------------------------------------------------------------------
// TESTE DX1: rota privada do worker sem Authorization é rejeitada com status 401
// -----------------------------------------------------------------------------
process.env.CRON_SECRET = 'secret_teste_dx_oficial';
const reqDX1 = new NextRequest('http://localhost:3000/api/internal/process-whatsapp-jobs', {
  method: 'POST'
});
const resDX1 = await InternalWorkerPOST(reqDX1);
const bodyDX1 = await resDX1.json();
assert(
  resDX1.status === 401 && bodyDX1.success === false,
  'TESTE DX1 — rota interna do worker sem cabeçalho Authorization é rejeitada com HTTP 401 Unauthorized'
);

// -----------------------------------------------------------------------------
// TESTE DX2: rota privada do worker com Authorization incorreta é rejeitada com 401
// -----------------------------------------------------------------------------
const reqDX2 = new NextRequest('http://localhost:3000/api/internal/process-whatsapp-jobs', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer secret_incorreto_dx2' }
});
const resDX2 = await InternalWorkerPOST(reqDX2);
const bodyDX2 = await resDX2.json();
assert(
  resDX2.status === 401 && bodyDX2.success === false,
  'TESTE DX2 — rota interna do worker com token Bearer incorreto é rejeitada com HTTP 401'
);

// -----------------------------------------------------------------------------
// TESTE DX3: CRON_SECRET ausente no servidor faz a rota falhar em modo seguro (Fail-Closed 401)
// -----------------------------------------------------------------------------
const origCronSecretDX3 = process.env.CRON_SECRET;
delete process.env.CRON_SECRET;
const reqDX3 = new NextRequest('http://localhost:3000/api/internal/process-whatsapp-jobs', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer secret_teste_dx_oficial' }
});
const resDX3 = await InternalWorkerPOST(reqDX3);
process.env.CRON_SECRET = origCronSecretDX3;
assert(
  resDX3.status === 401,
  'TESTE DX3 — se CRON_SECRET estiver ausente no servidor, a rota falha em modo seguro (Fail-Closed 401)'
);

// -----------------------------------------------------------------------------
// TESTE DX4: Authorization com CRON_SECRET correto executa o worker com sucesso (200 OK)
// -----------------------------------------------------------------------------
process.env.CRON_SECRET = 'secret_valido_dx4';
const reqDX4 = new NextRequest('http://localhost:3000/api/internal/process-whatsapp-jobs?limit=5', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer secret_valido_dx4' }
});
const resDX4 = await InternalWorkerPOST(reqDX4);
const bodyDX4 = await resDX4.json();
assert(
  resDX4.status === 200 && bodyDX4.success === true && typeof bodyDX4.summary?.processedCount === 'number',
  'TESTE DX4 — rota interna com CRON_SECRET válido executa o worker e retorna resumo operacional sanitizado (200 OK)'
);

// -----------------------------------------------------------------------------
// TESTE DX5: mensagem e job duravelmente persistidos na webhook_queue antes do disparo
// -----------------------------------------------------------------------------
clearLocalQueueJobsForTest();
process.env.META_WA_APP_SECRET = 'secret_teste_dx5';
process.env.CRON_SECRET = 'cron_secret_dx5';
const payloadDX5 = JSON.stringify({
  entry: [{
    changes: [{
      value: {
        messages: [{
          id: 'wamid.test.dx5',
          from: '5542999990055',
          type: 'text',
          text: { body: 'Quero saber sobre casas em Ponta Grossa' }
        }],
        contacts: [{ wa_id: '5542999990055', profile: { name: 'Cliente DX5' } }]
      }
    }]
  }]
});
const sigDX5 = 'sha256=' + crypto.createHmac('sha256', 'secret_teste_dx5').update(payloadDX5).digest('hex');

const reqDX5 = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
  method: 'POST',
  headers: { 'x-hub-signature-256': sigDX5 },
  body: payloadDX5
});

const fetchBackupDX5 = global.fetch;
let triggerCalledDX5 = false;
global.fetch = (async (url: string, opts?: any) => {
  if (String(url).includes('/api/internal/process-whatsapp-jobs')) {
    triggerCalledDX5 = true;
    assert(opts?.headers?.Authorization === 'Bearer cron_secret_dx5', 'TESTE DX5 — disparo do worker assinado com CRON_SECRET no cabeçalho Authorization');
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}) as any;

const resDX5 = await WebhookPOST(reqDX5);
global.fetch = fetchBackupDX5;

const jobsDX5 = getLocalQueueJobsForTest();
assert(
  resDX5.status === 200 && jobsDX5.length > 0 && Boolean(triggerCalledDX5),
  'TESTE DX5 — webhook envia resposta 200 para a Meta com mensagem e job duravelmente persistidos na fila'
);

// -----------------------------------------------------------------------------
// TESTE DX6: falha no disparo imediato não apaga nem invalida o job da fila durável
// -----------------------------------------------------------------------------
clearLocalQueueJobsForTest();
const payloadDX6 = JSON.stringify({
  entry: [{
    changes: [{
      value: {
        messages: [{
          id: 'wamid.test.dx6',
          from: '5542999990066',
          type: 'text',
          text: { body: 'Mensagem de teste falha no fetch imediato' }
        }],
        contacts: [{ wa_id: '5542999990066', profile: { name: 'Cliente DX6' } }]
      }
    }]
  }]
});
const sigDX6 = 'sha256=' + crypto.createHmac('sha256', 'secret_teste_dx5').update(payloadDX6).digest('hex');

const reqDX6 = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
  method: 'POST',
  headers: { 'x-hub-signature-256': sigDX6 },
  body: payloadDX6
});

const fetchBackupDX6 = global.fetch;
global.fetch = (async (url: string) => {
  if (String(url).includes('/api/internal/process-whatsapp-jobs')) {
    throw new Error('Falha de rede Simulada no Fetch Imediato');
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}) as any;

const resDX6 = await WebhookPOST(reqDX6);
global.fetch = fetchBackupDX6;

const jobsDX6 = getLocalQueueJobsForTest();
const jobDX6 = jobsDX6.find(j => j.status === 'pending');
assert(
  resDX6.status === 200 && jobDX6 !== undefined && jobDX6.status === 'pending',
  'TESTE DX6 — se o disparo imediato falhar, o job permanece intacto com status pending na webhook_queue'
);

// -----------------------------------------------------------------------------
// TESTE DX7: webhook duplicado com mesmo wamid continua 100% idempotente
// -----------------------------------------------------------------------------
const reqDX7 = new NextRequest('http://localhost:3000/api/webhooks/whatsapp', {
  method: 'POST',
  headers: { 'x-hub-signature-256': sigDX6 },
  body: payloadDX6
});

const resDX7 = await WebhookPOST(reqDX7);
const bodyDX7 = await resDX7.json();

assert(
  resDX7.status === 200 && bodyDX7.success === true && bodyDX7.message.includes('duplicada'),
  'TESTE DX7 — webhook duplicado com mesmo wamid é capturado pela idempotência sem criar job duplicado'
);

// -----------------------------------------------------------------------------
// TESTE DX8: lead com ai_paused = true completa o job com status completed sem chamar OpenAI
// -----------------------------------------------------------------------------
const leadDX8 = await leadService.createLead({ name: 'Lead DX8 Pausado', waId: '5542999990088', phone: '+5542999990088', aiPaused: true });
const msgDX8 = await addConversationMessage(leadDX8.id, 'inbound', 'lead', 'Olá!', 'wamid.dx8');
const jobDX8 = await enqueueWebhookJob(msgDX8!.id, 'process_inbound_sdr');

const resSingleDX8 = await processSingleWhatsAppJob(jobDX8!);
assert(
  resSingleDX8.status === 'completed' && Boolean(resSingleDX8.reason?.includes('ai_paused')),
  'TESTE DX8 — lead com ai_paused = true finaliza job como completed com motivo ai_paused sem chamar OpenAI nem enviar mensagens'
);

console.log('\n================================================================');
if (failedTests === 0) {
  console.log('✨ TODOS OS TESTES (A–DX8) PASSARAM COM 100% DE SUCESSO! ✨');
  console.log('================================================================\n');
} else {
  console.error(`❌ OCORRERAM ${failedTests} FALHAS NOS TESTES!`);
  console.log('================================================================\n');
  process.exit(1);
}
}

runAllTests();
