import { Lead, MetricCardData, FollowUpTask } from '../types';

export const BROKER_INFO = {
  name: "Gustavo Carneiro",
  title: "Corretor de Imóveis",
  creci: "52321",
  city: "Ponta Grossa/PR",
  email: "gustavo.carneiro@corretor.com.br",
  phone: "(42) 99988-7766"
};

export const IS_DEMO_DATA = true;
export const DEMO_NOTICE = "Dados fictícios de demonstração para Ponta Grossa/PR — Estrutura com suporte ao Supabase e busca tipada.";

export const DASHBOARD_METRICS: MetricCardData[] = [
  {
    id: 'total',
    title: 'Total de Leads',
    value: 5,
    change: '+15% este mês',
    isPositive: true,
    iconName: 'Users',
    description: 'Leads no funil ativo'
  },
  {
    id: 'novo',
    title: 'Leads Novos',
    value: 1,
    change: 'Aguardando 1º contato',
    isPositive: true,
    iconName: 'Sparkles',
    description: 'Recém-cadastrados'
  },
  {
    id: 'quente',
    title: 'Leads Quentes',
    value: 2,
    change: 'Alta intenção de compra',
    isPositive: true,
    classification: 'quente',
    iconName: 'Flame',
    description: 'Curto prazo + recursos ok'
  },
  {
    id: 'morno',
    title: 'Leads Mornos',
    value: 1,
    change: 'Depende de aprovação',
    isPositive: true,
    classification: 'morno',
    iconName: 'ThermometerSun',
    description: 'Em acompanhamento'
  },
  {
    id: 'planejamento',
    title: 'Em Planejamento',
    value: 1,
    change: 'Médio/Longo prazo',
    isPositive: true,
    classification: 'planejamento',
    iconName: 'Compass',
    description: 'Organização financeira'
  },
  {
    id: 'qualificado',
    title: 'Leads Qualificados',
    value: 2,
    change: 'Perfil validado',
    isPositive: true,
    iconName: 'CheckCircle2',
    description: 'Prontos para visita'
  }
];

export const LEAD_INFLOW_DATA = [
  { period: 'Sem 1', novos: 4, qualificados: 2, total: 6 },
  { period: 'Sem 2', novos: 7, qualificados: 3, total: 10 },
  { period: 'Sem 3', novos: 12, qualificados: 5, total: 17 },
  { period: 'Sem 4', novos: 18, qualificados: 8, total: 26 },
  { period: 'Atual', novos: 24, qualificados: 12, total: 36 },
];

export const LEAD_DISTRIBUTION_DATA = [
  { name: 'Quentes', value: 2, color: '#EF4444', classification: 'quente' },
  { name: 'Mornos', value: 1, color: '#F59E0B', classification: 'morno' },
  { name: 'Em Planejamento', value: 1, color: '#3B82F6', classification: 'planejamento' },
  { name: 'Não Classificados', value: 1, color: '#94A3B8', classification: 'nao_classificado' },
];

export const CONTACT_SOURCE_DATA = [
  { source: 'WhatsApp', quantidade: 18, percent: '50%' },
  { source: 'Instagram', quantidade: 10, percent: '28%' },
  { source: 'Indicação', quantidade: 4, percent: '11%' },
  { source: 'Site', quantidade: 3, percent: '8%' },
  { source: 'Facebook', quantidade: 1, percent: '3%' },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Dra. Camila Rocha',
    phone: '(42) 99876-5432',
    email: 'camila.rocha@exemplo.com',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-05T11:30:00Z',
    source: 'WhatsApp',
    campaign: 'Lançamento Vila Estrela',
    ad: 'Anúncio Cobertura Duplex',
    externalId: 'WA-88421',
    sourceNotes: 'Entrou em contato direto via link do Instagram',
    
    demand: {
      purpose: 'Moradia',
      propertyType: 'Sobrado / Cobertura',
      city: 'Ponta Grossa',
      regions: ['Vila Estrela', 'Jardim Carvalho'],
      bedrooms: 4,
      needsSuite: true,
      parkingSpaces: 3,
      minPrice: 1200000,
      maxPrice: 1800000,
      keyFeatures: ['Espaço Gourmet', 'Piscina Privativa', 'Acabamento de Alto Padrão'],
      propertyNotes: 'Busca imóvel com sacada ampla e vista definitiva para a cidade.'
    },

    financial: {
      purchaseForm: 'Financiamento + recursos próprios',
      hasDownPayment: true,
      downPaymentAmount: 450000,
      intendsToIncreaseDownPayment: true,
      downPaymentNotes: 'Possui aplicação resgatável de R$ 100 mil no Sicoob',
      hasFGTS: true,
      intendsToUseFGTS: true,
      fgtsAmount: 85000,
      fgtsStatus: 'Informado',
      hasVehicleOrAsset: true,
      assetDescription: 'Toyota Corolla Cross 2024 (Avaliado em R$ 160.000)',
      assetAmount: 160000,
      hasSimulated: true,
      hasCreditAnalysis: true,
      bankInstitution: 'Itaú Personalité',
      creditStatus: 'Pré-aprovado',
      approvedAmount: 900000
    },

    purchaseTimeline: 'Até 30 dias',
    classification: 'quente',
    status: 'Visita agendada',
    nextAction: 'Confirmar visita no Residencial Vila Estrela para sábado às 10h',

    activities: [
      {
        id: 'act-101',
        timestamp: '2026-10-01T10:00:00Z',
        author: 'Sistema',
        action: 'Lead cadastrado via formulário do WhatsApp',
        type: 'creation'
      },
      {
        id: 'act-102',
        timestamp: '2026-10-02T14:20:00Z',
        author: 'Gustavo Carneiro',
        action: 'Qualificação financeira atualizada: Crédito pré-aprovado no Itaú (R$ 900 mil)',
        type: 'financial_update'
      },
      {
        id: 'act-103',
        timestamp: '2026-10-04T09:15:00Z',
        author: 'Gustavo Carneiro',
        action: 'Status alterado de Qualificando para Visita agendada',
        type: 'status_change'
      }
    ],

    notes: [
      {
        id: 'note-101',
        timestamp: '2026-10-02T14:30:00Z',
        author: 'Gustavo Carneiro',
        content: 'Cliente extremamente bem informada. Valoriza localização na Vila Estrela próxima a escolas.'
      }
    ]
  },

  {
    id: 'lead-2',
    name: 'Roberto Silveira',
    phone: '(42) 99123-4567',
    email: 'roberto.silveira@exemplo.com',
    createdAt: '2026-10-02T14:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
    source: 'Indicação',
    sourceNotes: 'Indicado pelo Dr. Henrique de Ponta Grossa',
    
    demand: {
      purpose: 'Investimento',
      propertyType: 'Apartamento',
      city: 'Ponta Grossa',
      regions: ['Oficinas', 'Centro'],
      bedrooms: 2,
      needsSuite: true,
      parkingSpaces: 1,
      minPrice: 450000,
      maxPrice: 650000,
      keyFeatures: ['Próximo à UEPG', 'Baixo Valor de Condomínio', 'Sacada com Churrasqueira'],
      propertyNotes: 'Foco em locação para estudantes de pós-graduação/médicos.'
    },

    financial: {
      purchaseForm: 'À vista',
      hasDownPayment: true,
      downPaymentAmount: 600000,
      intendsToIncreaseDownPayment: false,
      hasFGTS: false,
      intendsToUseFGTS: false,
      fgtsAmount: 0,
      fgtsStatus: 'Não informado',
      hasVehicleOrAsset: false,
      assetAmount: 0,
      hasSimulated: false,
      hasCreditAnalysis: false,
      creditStatus: 'Não informado',
      approvedAmount: 0
    },

    purchaseTimeline: 'Imediatamente',
    classification: 'quente',
    status: 'Negociação',
    nextAction: 'Enviar minuta do contrato de compra do Edifício Oficinas',

    activities: [
      {
        id: 'act-201',
        timestamp: '2026-10-02T14:00:00Z',
        author: 'Gustavo Carneiro',
        action: 'Lead cadastrado manualmente via recomendação',
        type: 'creation'
      },
      {
        id: 'act-202',
        timestamp: '2026-10-03T16:00:00Z',
        author: 'Gustavo Carneiro',
        action: 'Classificação definida como Quente (Pagamento à vista)',
        type: 'classification_change'
      }
    ],

    notes: [
      {
        id: 'note-201',
        timestamp: '2026-10-03T16:05:00Z',
        author: 'Gustavo Carneiro',
        content: 'Pagamento 100% à vista via PIX assim que a documentação da matrícula estiver pronta.'
      }
    ]
  },

  {
    id: 'lead-3',
    name: 'Eng. Marcos Paiva',
    phone: '(42) 99654-3210',
    email: 'marcos.paiva@exemplo.com',
    createdAt: '2026-10-03T11:00:00Z',
    updatedAt: '2026-10-04T15:00:00Z',
    source: 'Instagram',
    campaign: 'Condomínios Fechados PG',
    ad: 'Casa 3 Suítes Jardim Carvalho',

    demand: {
      purpose: 'Moradia',
      propertyType: 'Casa em Condomínio',
      city: 'Ponta Grossa',
      regions: ['Jardim Carvalho', 'Estrela'],
      bedrooms: 3,
      needsSuite: true,
      parkingSpaces: 2,
      minPrice: 850000,
      maxPrice: 1200000,
      keyFeatures: ['Condomínio Fechado', 'Portaria 24h', 'Quintal'],
      propertyNotes: 'Família com 2 filhos pequenos, prioridade para segurança e área verde.'
    },

    financial: {
      purchaseForm: 'Financiamento',
      hasDownPayment: true,
      downPaymentAmount: 250000,
      intendsToIncreaseDownPayment: true,
      hasFGTS: true,
      intendsToUseFGTS: true,
      fgtsAmount: 60000,
      fgtsStatus: 'Informado',
      hasVehicleOrAsset: true,
      assetDescription: 'Jeep Compass 2022',
      assetAmount: 130000,
      hasSimulated: true,
      hasCreditAnalysis: true,
      bankInstitution: 'Caixa Econômica',
      creditStatus: 'Em análise',
      approvedAmount: 0
    },

    purchaseTimeline: '1 a 3 meses',
    classification: 'morno',
    status: 'Qualificando',
    nextAction: 'Acompanhar resultado da análise de crédito na Caixa',

    activities: [
      {
        id: 'act-301',
        timestamp: '2026-10-03T11:00:00Z',
        author: 'Sistema',
        action: 'Lead capturado via formulário Instagram Ads',
        type: 'creation'
      }
    ],

    notes: []
  },

  {
    id: 'lead-4',
    name: 'Juliana Mendes',
    phone: '(42) 99555-8877',
    email: 'juliana.mendes@exemplo.com',
    createdAt: '2026-10-04T16:00:00Z',
    updatedAt: '2026-10-04T16:00:00Z',
    source: 'Site',

    demand: {
      purpose: 'Moradia',
      propertyType: 'Apartamento / Studio',
      city: 'Ponta Grossa',
      regions: ['Centro', 'Uvaranas'],
      bedrooms: 2,
      needsSuite: false,
      parkingSpaces: 1,
      minPrice: 280000,
      maxPrice: 380000,
      keyFeatures: ['Elevador', 'Baixo Custo Condominial'],
      propertyNotes: 'Primeiro imóvel próprio.'
    },

    financial: {
      purchaseForm: 'Financiamento',
      hasDownPayment: true,
      downPaymentAmount: 50000,
      intendsToIncreaseDownPayment: false,
      hasFGTS: true,
      intendsToUseFGTS: true,
      fgtsAmount: 35000,
      fgtsStatus: 'Informado',
      hasVehicleOrAsset: false,
      assetAmount: 0,
      hasSimulated: true,
      hasCreditAnalysis: false,
      creditStatus: 'Pretende analisar',
      approvedAmount: 0
    },

    purchaseTimeline: '3 a 6 meses',
    classification: 'planejamento',
    status: 'Em atendimento',
    nextAction: 'Simular financiamento Minha Casa Minha Vida / SBPE no site da Caixa',

    activities: [
      {
        id: 'act-401',
        timestamp: '2026-10-04T16:00:00Z',
        author: 'Sistema',
        action: 'Lead cadastrado pelo formulário do site',
        type: 'creation'
      }
    ],

    notes: []
  },

  {
    id: 'lead-5',
    name: 'Lucas Santos',
    phone: '(42) 99444-3322',
    createdAt: '2026-10-05T08:30:00Z',
    updatedAt: '2026-10-05T08:30:00Z',
    source: 'Facebook',
    campaign: 'Imóveis Ponta Grossa',

    demand: {
      purpose: 'Moradia',
      propertyType: 'Casa / Terreno',
      city: 'Ponta Grossa',
      regions: ['Neves', 'Uvaranas'],
      bedrooms: 3,
      needsSuite: false,
      parkingSpaces: 2,
      minPrice: 200000,
      maxPrice: 350000,
      keyFeatures: [],
      propertyNotes: ''
    },

    financial: {
      purchaseForm: 'Ainda não sabe',
      hasDownPayment: false,
      downPaymentAmount: 0,
      intendsToIncreaseDownPayment: false,
      hasFGTS: false,
      intendsToUseFGTS: false,
      fgtsAmount: 0,
      fgtsStatus: 'Não informado',
      hasVehicleOrAsset: false,
      assetAmount: 0,
      hasSimulated: false,
      hasCreditAnalysis: false,
      creditStatus: 'Não analisado',
      approvedAmount: 0
    },

    purchaseTimeline: 'Não informado',
    classification: 'nao_classificado',
    status: 'Novo',
    nextAction: 'Realizar primeiro contato via WhatsApp para entender perfil',

    activities: [
      {
        id: 'act-501',
        timestamp: '2026-10-05T08:30:00Z',
        author: 'Sistema',
        action: 'Lead cadastrado via Facebook Ads',
        type: 'creation'
      }
    ],

    notes: []
  }
];

export const PRIORITY_LEADS: Lead[] = INITIAL_LEADS;

export const RECENT_ACTIVITIES = [
  {
    id: 'act-1',
    leadName: 'Dra. Camila Rocha',
    leadId: 'lead-1',
    action: 'Confirmou visita para sábado na Vila Estrela (Ponta Grossa)',
    timestamp: 'Há 15 min',
    type: 'visit',
    classification: 'quente' as const
  },
  {
    id: 'act-2',
    leadName: 'Eng. Marcos Paiva',
    leadId: 'lead-3',
    action: 'Análise de crédito enviada para a Caixa Econômica',
    timestamp: 'Há 42 min',
    type: 'ai_sdr',
    classification: 'morno' as const
  },
  {
    id: 'act-3',
    leadName: 'Roberto Silveira',
    leadId: 'lead-2',
    action: 'Solicitou minuta do contrato de compra em Oficinas',
    timestamp: 'Há 2h',
    type: 'status_change',
    classification: 'quente' as const
  }
];

export const INITIAL_TASKS: FollowUpTask[] = [
  {
    id: 'task-1',
    leadId: 'lead-1',
    leadName: 'Dra. Camila Rocha',
    type: 'Agendar visita',
    date: '2026-10-07',
    time: '10:00',
    description: 'Confirmar horário e enviar localização do sobrado na Vila Estrela via WhatsApp',
    status: 'Pendente',
    priority: 'Alta',
    createdAt: '2026-10-05T09:00:00Z'
  },
  {
    id: 'task-2',
    leadId: 'lead-2',
    leadName: 'Roberto Silveira',
    type: 'Enviar opções',
    date: '2026-10-06',
    time: '14:30',
    description: 'Enviar minuta do contrato do imóvel em Oficinas e certidões negativas',
    status: 'Pendente',
    priority: 'Alta',
    createdAt: '2026-10-05T10:00:00Z'
  },
  {
    id: 'task-3',
    leadId: 'lead-3',
    leadName: 'Eng. Marcos Paiva',
    type: 'Verificar financiamento',
    date: '2026-10-08',
    time: '11:00',
    description: 'Cobrar correspondente bancário da Caixa sobre análise de crédito',
    status: 'Pendente',
    priority: 'Média',
    createdAt: '2026-10-05T11:00:00Z'
  }
];

export const MOCK_CONVERSATIONS = [
  {
    id: 'chat-1',
    contactName: 'Dra. Camila Rocha',
    avatar: 'CR',
    status: 'online',
    lastMessage: 'Perfeito Gustavo! Sábado às 10h na Vila Estrela me atende muito bem.',
    timestamp: '11:42',
    unread: 2,
    classification: 'quente' as const,
    messages: [
      { sender: 'lead', text: 'Olá Gustavo! Vi a cobertura na Vila Estrela.', time: '10:15' },
      { sender: 'sdr', text: 'Olá Dra. Camila! Excelente sobrado/cobertura com vista privilegiada. Qual o seu prazo ideal para mudança?', time: '10:18' },
      { sender: 'lead', text: 'Estou buscando para os próximos 30 dias. Já possuo aprovação de crédito.', time: '11:30' },
      { sender: 'sdr', text: 'Maravilhoso! Podemos agendar uma visita exclusiva este sábado?', time: '11:35' },
      { sender: 'lead', text: 'Perfeito Gustavo! Sábado às 10h na Vila Estrela me atende muito bem.', time: '11:42' }
    ]
  }
];

export const MOCK_APPOINTMENTS = [
  {
    id: 'app-1',
    leadName: 'Roberto Silveira',
    property: 'Edifício Oficinas - Apt 42',
    date: 'Amanhã, 06 de Outubro',
    time: '15:00',
    type: 'Visita Presencial',
    status: 'Confirmado',
    location: 'Oficinas - Ponta Grossa/PR'
  },
  {
    id: 'app-2',
    leadName: 'Dra. Camila Rocha',
    property: 'Sobrado / Cobertura Vila Estrela',
    date: 'Sábado, 10 de Outubro',
    time: '10:00',
    type: 'Visita Presencial',
    status: 'Confirmado',
    location: 'Vila Estrela - Ponta Grossa/PR'
  }
];
