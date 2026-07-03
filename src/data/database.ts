export interface WordItem {
  word: string;
  clue: string;
  explanation: string;
}

export interface Level {
  id: number;
  title: string;
  category: string;
  words: WordItem[];
}

export const OdontoDatabase: Level[] = [
  // --- BLOCO 1: INTRODUÇÃO À ODONTOLOGIA (FASES 1 A 5) ---
  {
    id: 1,
    title: "Conceitos Básicos",
    category: "Introdução à Odontologia",
    words: [
      { word: "DENTE", clue: "Estrutura mineralizada na boca para mastigação.", explanation: "Órgão duro composto por esmalte, dentina, polpa e cemento, fixado no osso alveolar." },
      { word: "BOCA", clue: "Cavidade de entrada do sistema digestório.", explanation: "Estrutura anatômica que abriga os dentes, língua, glândulas salivares e tecidos moles." },
      { word: "DENTISTA", clue: "Profissional especializado na saúde bucal.", explanation: "Profissional de saúde capacitado para prevenir, diagnosticar e tratar problemas bucais." },
      { word: "SALIVA", clue: "Líquido secretado pelas glândulas bucais.", explanation: "Fluido biológico que auxilia na digestão, lubrificação e autolimpeza da boca." },
      { word: "ESCOVA", clue: "Instrumento com cerdas para limpeza dos dentes.", explanation: "Utensílio mecânico essencial para remoção mecânica do biofilme dentário." },
      { word: "GENGIVA", clue: "Tecido fibrocoso rosa que recobre o osso alveolar.", explanation: "Parte da mucosa mastigatória que circunda a porção cervical dos dentes." },
      { word: "CARIE", clue: "Doença infecciosa que desmineraliza o dente.", explanation: "Doença multifatorial mediada por biofilme e açúcares que corrói os tecidos duros do dente." },
      { word: "HIGIENE", clue: "Prática de manter a boca limpa para evitar doenças.", explanation: "Conjunto de métodos (como escovação e uso de fio dental) para manter a saúde bucal." },
      { word: "CLINICA", clue: "Local de atendimento odontológico.", explanation: "Espaço físico estruturado para a realização de consultas e tratamentos dentários." },
      { word: "PACIENTE", clue: "Pessoa que recebe o tratamento odontológico.", explanation: "Indivíduo submetido a exame, diagnóstico e procedimentos odontológicos." }
    ]
  },
  {
    id: 2,
    title: "Equipamentos do Consultório",
    category: "Introdução à Odontologia",
    words: [
      { word: "FLUOR", clue: "Mineral que previne a desmineralização dentária.", explanation: "Elemento químico adicionado a cremes dentais e à água de abastecimento para fortalecer o esmalte." },
      { word: "FIODENTAL", clue: "Fio de seda ou nylon para limpar entre os dentes.", explanation: "Dispositivo de limpeza interdental usado para remover detritos e biofilme onde a escova não alcança." },
      { word: "CONSULTORIO", clue: "Sala onde o dentista realiza os atendimentos.", explanation: "Ambiente clínico equipado com cadeira odontológica, periféricos e insumos necessários." },
      { word: "CADEIRA", clue: "Assento reclinável onde o paciente se deita.", explanation: "Mobiliário ergonômico central do consultório que posiciona o paciente confortavelmente." },
      { word: "REFLETOR", clue: "Foco de luz potente sobre a boca do paciente.", explanation: "Dispositivo de iluminação acoplado ao equipo que permite visualizar a cavidade bucal." },
      { word: "CUSPIDEIRA", clue: "Recipiente para o paciente cuspir líquidos.", explanation: "Cuba de cerâmica ou plástico com fluxo de água para descarte de saliva e enxágue." },
      { word: "SUGADOR", clue: "Cânula para sucção de saliva e água.", explanation: "Dispositivo conectado ao vácuo para remover o excesso de líquidos da cavidade bucal durante o trabalho." },
      { word: "RECEPCAO", clue: "Área de espera para os pacientes.", explanation: "Espaço de acolhimento e triagem onde os pacientes aguardam a consulta e realizam cadastros." },
      { word: "ODONTOGRAMA", clue: "Ficha gráfica com o desenho dos dentes.", explanation: "Representação visual da arcada dentária usada para registrar as condições e tratamentos do paciente." },
      { word: "PRONTUARIO", clue: "Conjunto de documentos clínicos do paciente.", explanation: "Registro legal com histórico de saúde, anamnese, tratamentos e exames do paciente." }
    ]
  },
  {
    id: 3,
    title: "Biossegurança Básica",
    category: "Introdução à Odontologia",
    words: [
      { word: "JALECO", clue: "Vestimenta de proteção corporal do dentista.", explanation: "Avental de manga longa usado como barreira física contra aerossóis, sangue e fluidos corporais." },
      { word: "MASCARA", clue: "Barreira de proteção para nariz e boca.", explanation: "Equipamento de Proteção Individual (EPI) que evita a inalação de micro-organismos suspensos no ar." },
      { word: "LUVAS", clue: "Proteção descartável para as mãos.", explanation: "Barreira física que impede o contato direto com fluidos biológicos e agentes contaminantes." },
      { word: "GORRO", clue: "Cobertura para o cabelo do profissional.", explanation: "EPI de proteção capilar que evita queda de fios na área clínica e protege o profissional de aerossóis." },
      { word: "OCULOS", clue: "Proteção ocular contra respingos e detritos.", explanation: "Acessório de proteção para os olhos contra partículas voadoras de brocas e respingos bacterianos." },
      { word: "AUTOCLAVE", clue: "Aparelho de esterilização por calor úmido sob pressão.", explanation: "Equipamento que elimina todas as formas de vida microbiana em materiais por vapor sob pressão." },
      { word: "ESTUFA", clue: "Equipamento de esterilização por calor seco.", explanation: "Aparelho de aquecimento elétrico usado no passado para esterilizar instrumentais por oxidação térmica." },
      { word: "ASSEPSIA", clue: "Prevenção de contaminação em tecidos vivos.", explanation: "Conjunto de medidas para impedir a introdução de patógenos no organismo e no campo cirúrgico." },
      { word: "ANTISEPSIA", clue: "Desinfecção química de tecidos vivos.", explanation: "Aplicação de agentes químicos biocidas na pele ou mucosa para reduzir a microbiota local." },
      { word: "BIOSSEGURANCA", clue: "Medidas para prevenir riscos à saúde na clínica.", explanation: "Conjunto de ações voltadas para a prevenção, minimização ou eliminação de riscos biológicos e químicos." }
    ]
  },
  {
    id: 4,
    title: "Termos Clínicos Gerais",
    category: "Introdução à Odontologia",
    words: [
      { word: "EXAME", clue: "Avaliação inicial do estado físico do paciente.", explanation: "Procedimento de inspeção visual, palpação e percussão para diagnosticar problemas bucais." },
      { word: "SINTOMA", clue: "Manifestação subjetiva relatada pelo paciente.", explanation: "Indicação de alteração física percebida pelo paciente, como dor ou sensibilidade." },
      { word: "EXAMEFISICO", clue: "Inspeção visual e manual feita pelo cirurgião.", explanation: "Fase clínica que avalia dentes, mucosas, linfonodos e articulações de forma tátil e visual." },
      { word: "PREVENCAO", clue: "Ações para evitar o surgimento de doenças.", explanation: "Conjunto de medidas preventivas como aplicação de flúor e selantes para manter a saúde bucal." },
      { word: "SAUDE", clue: "Estado de completo bem-estar físico e mental.", explanation: "Equilíbrio biológico do corpo, incluindo a cavidade oral livre de dores e processos infecciosos." },
      { word: "HALITOSE", clue: "Mau hálito crônico ou temporário.", explanation: "Odor desagradável emanado da boca, gerado por saburra lingual, cáries ou disfunções sistêmicas." },
      { word: "PLACA", clue: "Película bacteriana transparente sobre os dentes.", explanation: "Biofilme viscoso de bactérias e restos alimentares aderidos ao esmalte dentário." },
      { word: "TARTARO", clue: "Placa bacteriana mineralizada e endurecida.", explanation: "Cálculo dentário que se forma pela deposição de sais minerais sobre a placa, exigindo raspagem." },
      { word: "CARGA", clue: "Quantidade de micro-organismos infectantes no meio.", explanation: "Nível de contaminação bacteriana ou viral presente em um determinado campo operatório ou instrumental." },
      { word: "ESTÉTICA", clue: "Área focada na beleza do sorriso.", explanation: "Aspecto visual agradável e harmonioso dos dentes e do sorriso, integrado à face." }
    ]
  },
  {
    id: 5,
    title: "Biossegurança e Microbiologia",
    category: "Introdução à Odontologia",
    words: [
      { word: "DESINFECCAO", clue: "Eliminação de germes patogênicos de superfícies.", explanation: "Processo químico ou físico que destrói a maioria dos micro-organismos de objetos inanimados." },
      { word: "ESTERILIZACAO", clue: "Destruição total de micro-organismos e esporos.", explanation: "Processo que elimina toda e qualquer forma de vida microbiana em materiais odontológicos." },
      { word: "BACTERIA", clue: "Micro-organismo unicelular procarionte.", explanation: "Agente biológico microscópico causador de patologias bucais comuns como a cárie e a periodontite." },
      { word: "VIRUS", clue: "Agente infeccioso acelular parasita obrigatório.", explanation: "Estrutura submicroscópica capaz de causar infecções como herpes labial e hepatite na prática clínica." },
      { word: "FUNGO", clue: "Micro-organismo eucarionte que causa infecções como sapinho.", explanation: "Agente patogênico como a Candida albicans, responsável por estomatites sob próteses." },
      { word: "CONTAMINACAO", clue: "Presença indesejada de agentes infecciosos em algo.", explanation: "Introdução acidental de impurezas, substâncias químicas ou micro-organismos patogênicos em materiais." },
      { word: "PATOGENO", clue: "Organismo capaz de produzir doenças.", explanation: "Qualquer agente biológico (vírus, bactéria, fungo) capaz de desencadear processos infecciosos." },
      { word: "EPI", clue: "Equipamento de Proteção Individual.", explanation: "Dispositivos como luvas, máscara e óculos que resguardam o profissional de riscos biológicos." },
      { word: "LIMPEZA", clue: "Remoção física de sujidades antes de esterilizar.", explanation: "Fase prévia que remove detritos orgânicos com água e detergente enzimático dos instrumentais." },
      { word: "ODONTOLOGIA", clue: "Ciência que estuda o sistema estomatognático.", explanation: "Especialidade médica que cuida da boca, dentes, ossos da face e tecidos adjacentes." }
    ]
  },

  // --- BLOCO 2: ANATOMIA DENTAL (FASES 6 A 10) ---
  {
    id: 6,
    title: "Tecidos Dentários",
    category: "Anatomia Dental",
    words: [
      { word: "ESMALTE", clue: "Tecido externo e mais duro do dente.", explanation: "Camada altamente mineralizada que protege a coroa anatômica do dente de desgastes externos." },
      { word: "DENTINA", clue: "Tecido conjuntivo calcificado sob o esmalte.", explanation: "Estrutura sensível que forma a maior parte do corpo do dente, contendo túbulos dentinários." },
      { word: "POLPA", clue: "Tecido mole vascularizado e inervado do dente.", explanation: "Coração vivo do dente localizado no centro, responsável pela nutrição e sensibilidade térmica." },
      { word: "CEMENTO", clue: "Tecido mineralizado que recobre a raiz.", explanation: "Fina camada conjuntiva calcificada que ancora as fibras do ligamento periodontal à raiz." },
      { word: "ALVEOLO", clue: "Cavidade óssea onde a raiz é alojada.", explanation: "Espaço no osso maxilar ou mandibular no qual a raiz do dente se fixa através de ligamentos." },
      { word: "COROA", clue: "Parte visível do dente acima da gengiva.", explanation: "Porção anatômica recoberta por esmalte, visível clinicamente na cavidade bucal." },
      { word: "RAIZ", clue: "Parte do dente inserida no osso.", explanation: "Porção de ancoragem do dente recoberta por cemento que o fixa nos tecidos de suporte." },
      { word: "COLO", clue: "Linha de transição entre coroa e raiz.", explanation: "Região cervical onde há o limite de junção entre o esmalte da coroa e o cemento radicular." },
      { word: "CUSPIDE", clue: "Elevação pontiaguda na face oclusal dos dentes.", explanation: "Pontas funcionais de mastigação presentes nas superfícies dos pré-molares e molares." },
      { word: "APEX", clue: "Ponta extrema da raiz dentária.", explanation: "Terminação apical da raiz por onde entram os feixes de vasos sanguíneos e nervos do dente." }
    ]
  },
  {
    id: 7,
    title: "Tipos de Dentes e Arcada",
    category: "Anatomia Dental",
    words: [
      { word: "CANINO", clue: "Dente pontiagudo usado para rasgar alimentos.", explanation: "Dente de raiz longa posicionado no canto da arcada, crucial para guias de desoclusão." },
      { word: "INCISIVO", clue: "Dente frontal com borda cortante.", explanation: "Grupo de dentes anteriores responsáveis por cortar os alimentos na fase inicial da mastigação." },
      { word: "PREMOLAR", clue: "Dente com duas cúspides localizado após os caninos.", explanation: "Dentes de transição na mastigação, responsáveis por triturar alimentos." },
      { word: "MOLAR", clue: "Dente posterior largo para triturar comida.", explanation: "Grandes dentes posteriores com múltiplas cúspides e raízes, vitais para a eficiência mastigatória." },
      { word: "FORAME", clue: "Abertura no ápice radicular.", explanation: "Orifício minúsculo na extremidade apical da raiz que permite a entrada do feixe vasculonervoso." },
      { word: "PERIODONTO", clue: "Tecidos que envolvem e sustentam os dentes.", explanation: "Estrutura de inserção e proteção que inclui gengiva, ligamento periodontal, cemento e osso alveolar." },
      { word: "LIGAMENTO", clue: "Fibras colágenas que fixam o dente ao osso.", explanation: "Grupo de fibras elásticas que suspendem o dente no alvéolo e amortecem forças mastigatórias." },
      { word: "OCLUSAO", clue: "Relação de encaixe entre os dentes superiores e inferiores.", explanation: "Contato funcional e estático dos arcos dentários quando a mandíbula se fecha contra a maxila." },
      { word: "MAXILA", clue: "Osso fixo que constitui a arcada superior.", explanation: "Osso par da face que abriga os dentes superiores e delimita as fossas nasais e órbitas." },
      { word: "MANDIBULA", clue: "Osso móvel que constitui a arcada inferior.", explanation: "Único osso móvel da face que abriga os dentes inferiores e articula com o osso temporal." }
    ]
  },
  {
    id: 8,
    title: "Maxila, Mandíbula e ATM",
    category: "Anatomia Dental",
    words: [
      { word: "ARTICULACAO", clue: "União óssea que permite mobilidade da mandíbula.", explanation: "Junção biológica móvel que une a mandíbula ao crânio lateralmente (ATM)." },
      { word: "CONDILO", clue: "Projeção arredondada da mandíbula que articula na ATM.", explanation: "Cabeça da mandíbula que realiza movimentos de rotação e translação na fossa articular." },
      { word: "DISCOARTICULAR", clue: "Cartilagem amortecedora entre o côndilo e o crânio.", explanation: "Placa fibrocartilaginosa flexível que evita o atrito ósseo direto na articulação temporomandibular." },
      { word: "SINOVIA", clue: "Líquido lubrificante das articulações.", explanation: "Fluido viscoso secretado pela membrana sinovial que nutre e lubrifica as superfícies da ATM." },
      { word: "MASSETER", clue: "Principal músculo mastigatório na lateral da face.", explanation: "Poderoso músculo responsável pela elevação da mandíbula e compressão dos dentes." },
      { word: "TEMPORAL", clue: "Músculo em forma de leque na lateral do crânio.", explanation: "Músculo mastigatório que participa na elevação e retrusão da mandíbula." },
      { word: "PTERIGOIDEO", clue: "Músculo responsável por lateralidade e protrusão.", explanation: "Músculo da mastigação dividido em lateral e medial que guia movimentos de desvio e avanço." },
      { word: "BUCINADOR", clue: "Músculo da bochecha que auxilia na mastigação.", explanation: "Músculo que pressiona as bochechas contra os dentes, mantendo o bolo alimentar sob as faces oclusais." },
      { word: "MANDIBULAR", clue: "Referente ao arco inferior da boca.", explanation: "Termo anatômico associado a estruturas localizadas ou relacionadas com a mandíbula." },
      { word: "MASETICO", clue: "Relativo ao músculo masseter ou sua região.", explanation: "Termo de adjetivo anatômico usado para vasos, nervos ou fáscias ligadas ao masseter." }
    ]
  },
  {
    id: 9,
    title: "Tecidos Microscópicos",
    category: "Anatomia Dental",
    words: [
      { word: "EPITELIO", clue: "Tecido celular de revestimento da boca.", explanation: "Camada externa de células que protege as mucosas bucais de abrasões e invasões." },
      { word: "QUERATINOCITO", clue: "Célula que produz queratina na gengiva.", explanation: "Célula presumida na gengiva inserida, conferindo rigidez e barreira protetora à mucosa." },
      { word: "COLAGENOTIPO", clue: "Tipo de proteína abundante nos ligamentos.", explanation: "Variante estrutural de colágeno (geralmente Tipo I) que fornece resistência à tração das fibras." },
      { word: "FIBROBLASTO", clue: "Célula produtora de colágeno no ligamento.", explanation: "Célula conjuntiva responsável por sintetizar a matriz extracelular e as fibras periodontais." },
      { word: "OSTEOBLASTO", clue: "Célula responsável pela formação de osso.", explanation: "Célula que secreta a matriz óssea e regula sua mineralização nos alvéolos dentários." },
      { word: "AMELOBLASTO", clue: "Célula que forma o esmalte dentário.", explanation: "Célula de origem epitelial que secreta matriz orgânica que dará origem ao esmalte." },
      { word: "ODONTOBLASTO", clue: "Célula que produz a dentina.", explanation: "Célula localizada na borda da polpa que deposita dentina ao longo da vida do dente." },
      { word: "CEMENTOBLASTO", clue: "Célula que deposita cemento na raiz.", explanation: "Célula conjuntiva que recobre a raiz do dente e secreta a matriz orgânica do cemento." },
      { word: "HISTIOCITO", clue: "Célula fagocitária fixa do tecido conjuntivo pulpar.", explanation: "Macrófago tecidual inativo que atua na defesa e remoção de detritos na polpa dental." },
      { word: "MACROFAGO", clue: "Célula de defesa que digere patógenos.", explanation: "Célula imunitária que realiza fagocitose e apresenta antígenos durante inflamações bucais." }
    ]
  },
  {
    id: 10,
    title: "Morfologia e Detalhes Anatômicos",
    category: "Anatomia Dental",
    words: [
      { word: "FOSSETA", clue: "Pequena depressão na coroa do dente.", explanation: "Ponto de encontro de sulcos anatômicos no esmalte, propício ao acúmulo de biofilme." },
      { word: "ARESTA", clue: "Segmento de reta na união de vertentes.", explanation: "Borda linear formada pelo encontro das vertentes de uma cúspide dentária." },
      { word: "CRISTA", clue: "Eminência linear de esmalte nas bordas marginais.", explanation: "Elevação linear proeminente de esmalte localizada nos limites marginais das coroas." },
      { word: "VERTENTE", clue: "Superfície inclinada de uma cúspide.", explanation: "Plano inclinado que forma as encostas triturantes das cúspides anteriores e posteriores." },
      { word: "CAMARAPULPAR", clue: "Espaço no interior da coroa que abriga a polpa.", explanation: "Cavidade central interna da coroa anatômica preenchida pelo tecido conjuntivo pulpar." },
      { word: "CANALRADICULAR", clue: "Canal no interior da raiz por onde passa o nervo.", explanation: "Conduto no centro da raiz por onde passam vasos e fibras nervosas em direção ao ápice." },
      { word: "CEMENTOESMALTE", clue: "Linha de limite cervical do dente.", explanation: "Junção anatômica onde o cemento radicular encontra o esmalte coronário." },
      { word: "PROCESSOALVEOLAR", clue: "Parte da maxila ou mandíbula que abriga os alvéolos.", explanation: "Extensão óssea maxilar e mandibular que forma as paredes dos alvéolos de inserção." },
      { word: "SULCODEEPI", clue: "Depressão rasa que circunda a gengiva livre.", explanation: "Sulco gengival saudável que delimita a margem da gengiva livre do epitélio de união." },
      { word: "MORDIDADENTAL", clue: "Encaixe funcional dos dentes ao morder.", explanation: "Relação posicional dinâmica de toque entre os arcos superior e inferior em oclusão." }
    ]
  },

  // --- BLOCO 3: INSTRUMENTAIS ODONTOLÓGICOS (FASES 11 A 15) ---
  {
    id: 11,
    title: "Instrumental de Exame Clínico",
    category: "Instrumentais Odontológicos",
    words: [
      { word: "ESPELHO", clue: "Instrumento reflexivo para visualização bucal.", explanation: "Espelho clínico pequeno e redondo usado para ver áreas ocultas e rebater tecidos." },
      { word: "SONDA", clue: "Fino bastão metálico pontiagudo de exploração.", explanation: "Instrumento usado para testar lisura de superfícies dentárias e detectar sulcos ou cáries." },
      { word: "CURETA", clue: "Instrumento em forma de colher para raspar tecidos.", explanation: "Instrumental cortante para raspagem de tártaro subgengival ou remoção de tecido cariado." },
      { word: "FORCEPS", clue: "Alicate cirúrgico para extração dentária.", explanation: "Instrumental de alavanca dupla usado para segurar e extrair dentes do alvéolo." },
      { word: "ALAVANCA", clue: "Instrumental reto ou curvo para extração.", explanation: "Ferramenta cirúrgica para luxar dentes e remover raízes residuais (também chamado elevador)." },
      { word: "PINCA", clue: "Instrumental de pinçamento para algodão ou papel.", explanation: "Pinça clínica articulada para agarrar pequenos rolos de algodão e materiais na boca." },
      { word: "SERINGA", clue: "Dispositivo para injeção de anestésico.", explanation: "Instrumental para acoplar o tubete anestésico e a agulha na anestesia local." },
      { word: "SUGADORDEALTA", clue: "Cânula de sucção cirúrgica de grande vazão.", explanation: "Dispositivo metálico ou plástico para sugar sangue e grandes volumes de água durante cirurgias." },
      { word: "BROCA", clue: "Ponta rotatória acoplada à turbina para cortar dente.", explanation: "Instrumental diamantado ou de aço montado no motor para desgastar tecidos duros do dente." },
      { word: "ESPATULA", clue: "Lâmina metálica ou plástica para misturar massas.", explanation: "Utensílio usado para espatular cimentos, gessos, alginato e resinas no bloco de mistura." }
    ]
  },
  {
    id: 12,
    title: "Cirúrgicos e Isolamento",
    category: "Instrumentais Odontológicos",
    words: [
      { word: "SINDESMOTOMO", clue: "Instrumental para descolar a gengiva do dente.", explanation: "Instrumento de lâmina fina para separar a inserção epitelial do colo antes da extração." },
      { word: "CARPULE", clue: "Seringa específica para anestesia local odontológica.", explanation: "Seringa metálica esterilizável com refluxo que aloja tubetes cilíndricos de anestésico." },
      { word: "EXPLORADOR", clue: "Sonda de duas pontas finas de detecção.", explanation: "Instrumento metálico pontiagudo para registrar imperfeições no esmalte e margens de restaurações." },
      { word: "ESCAVADOR", clue: "Cureta manual para remover dentina cariada amolecida.", explanation: "Instrumental com ponta afiada em forma de colherinha para limpar a cavidade sem usar motor." },
      { word: "CONDENSADOR", clue: "Instrumento para compactar materiais na cavidade.", explanation: "Pilar metálico usado para calcar materiais como amálgama ou ionômero dentro do dente." },
      { word: "BISTURI", clue: "Instrumental cortante com lâmina fina para incisão.", explanation: "Cabo metálico acoplado a uma lâmina cirúrgica estéril para cortar tecidos moles." },
      { word: "BRUNIDOR", clue: "Instrumental de ponta esférica para polir amálgama.", explanation: "Acessório metálico polido usado para alisar o amálgama ainda plástico contra a margem cavitária." },
      { word: "DIQUE", clue: "Lençol de borracha usado para isolamento absoluto.", explanation: "Película elástica esticada sobre o dente para isolá-lo de saliva e umidade durante procedimentos." },
      { word: "CLAMP", clue: "Grampo metálico para fixar o dique no dente.", explanation: "Presilha de aço inoxidável encaixada no colo do dente para manter o dique de borracha estável." },
      { word: "ARCOYOUNG", clue: "Suporte metálico ou plástico para esticar o dique.", explanation: "Moldura em forma de U com garras para esticar o lençol de borracha ao redor da boca do paciente." }
    ]
  },
  {
    id: 13,
    title: "Instrumentais Específicos",
    category: "Instrumentais Odontológicos",
    words: [
      { word: "ALVEOLOTOMO", clue: "Alicate cirúrgico para cortar e regularizar osso.", explanation: "Instrumental com pontas cortantes fortes usado para remover espículas ósseas do alvéolo." },
      { word: "PORTAAGULHA", clue: "Pinça para segurar a agulha de sutura.", explanation: "Pinça de pontas curtas e ranhuradas com trava para manipular a agulha ao costurar tecidos." },
      { word: "TESOURA", clue: "Instrumento cortante cirúrgico para fios e tecidos.", explanation: "Tesoura delicada reta ou curva para cortar fios de sutura ou remover tecidos moles excedentes." },
      { word: "PINCAFACIAL", clue: "Pinça para fixação ou preensão de fragmentos.", explanation: "Pinça anatômica longa para manipular tecidos delicados ou posicionar objetos na cirurgia." },
      { word: "CINZEL", clue: "Instrumento de impacto para cortar ou clivar osso.", explanation: "Instrumento metálico com ponta chanfrada afiada para osteotomia manual ou remoção de dentes." },
      { word: "LIMAOSSOS", clue: "Lima cirúrgica para alisar bordas ósseas.", explanation: "Instrumento metálico estriado usado para aplainar e suavizar cristas ósseas ásperas após extrações." },
      { word: "GENGIVOTOMO", clue: "Lâmina dupla para incisão da gengiva.", explanation: "Faca periodontal cirúrgica para realizar incisões na gengiva (como o bisturi de Kirkland)." },
      { word: "PERIOSTOTOMO", clue: "Descolador de periósteo e gengiva do osso.", explanation: "Instrumento com ponta plana e romba para afastar o retalho mucoperiósteo do osso maxilar." },
      { word: "AFASTADOR", clue: "Instrumental para tracionar bochecha, língua ou lábio.", explanation: "Dispositivo metálico (como o afastador Minnesota) para afastar tecidos moles e melhorar a visão." },
      { word: "SONDAPERIODONTAL", clue: "Sonda milimetrada para medir bolsas gengivais.", explanation: "Instrumental marcado em milímetros para medir a profundidade do sulco gengival ou bolsa periodontal." }
    ]
  },
  {
    id: 14,
    title: "Dentística e Restauração",
    category: "Instrumentais Odontológicos",
    words: [
      { word: "PORTAMATRIZ", clue: "Dispositivo para fixar a fita matriz no dente.", explanation: "Aparelho metálico (Tofflemire) que prende a matriz de aço ao redor da coroa do dente." },
      { word: "BANDAMATRIZ", clue: "Fita de aço que envolve a coroa do dente.", explanation: "Tira fina de metal que recria a parede ausente do dente durante restaurações." },
      { word: "MATRIZ", clue: "Tira plástica ou metálica para conter a resina.", explanation: "Fita de poliéster ou aço posicionada interproximalmente para dar contorno ao material restaurador." },
      { word: "CUNHA", clue: "Pequeno pedaço de madeira ou plástico interdental.", explanation: "Dispositivo triangular inserido no espaço interproximal para afastar dentes e selar a matriz." },
      { word: "APLICADOR", clue: "Instrumento de ponta pequena para levar adesivo ou cimento.", explanation: "Microbrush ou haste metálica usada para depositar adesivo, ácidos ou selantes nas cavidades." },
      { word: "PINCEL", clue: "Escova minúscula de pelos macios para alisar resina.", explanation: "Acessório com ponta de cerdas para esculpir e alisar as camadas de resina composta." },
      { word: "MANDRIL", clue: "Haste metálica que segura discos de polimento no motor.", explanation: "Eixo montado no contra-ângulo no qual se fixam discos de lixa para acabamento de restaurações." },
      { word: "DISCOSOFLEX", clue: "Discos de lixa abrasiva para polimento de resina.", explanation: "Discos plásticos revestidos com óxido de alumínio em diferentes granulações para dar brilho." },
      { word: "TAÇA", clue: "Taça de borracha flexível para profilaxia.", explanation: "Copo de borracha acoplado ao motor para polir dentes com pasta profilática." },
      { word: "ESCOVAPROFILAXIA", clue: "Pequena escova rotatória para limpeza dental.", explanation: "Escovinha de Robinson montada em contra-ângulo usada para remover placas e manchas." }
    ]
  },
  {
    id: 15,
    title: "Equipamentos Rotatórios",
    category: "Instrumentais Odontológicos",
    words: [
      { word: "ULTRASSOM", clue: "Aparelho vibratório para remoção de tártaro.", explanation: "Equipamento piezoelétrico de alta frequência que fragmenta depósitos calcificados nos dentes." },
      { word: "JATOBAICARBONATO", clue: "Dispositivo que projeta ar, água e bicarbonato.", explanation: "Equipamento profilático de jateamento sob pressão para remover biofilme e manchas extrínsecas." },
      { word: "SERINGATRIPLICE", clue: "Dispositivo que injeta ar, água ou ambos.", explanation: "Seringa do equipo odontológico usada para lavar, secar e limpar o campo de trabalho." },
      { word: "TURBINA", clue: "Peça de mão de alta rotação movida a ar.", explanation: "Motor pneumático ultrarrápido (caneta de alta) usado para cortar esmalte e remover restaurações." },
      { word: "CONTRAANGULO", clue: "Peça de mão de baixa rotação angulada.", explanation: "Dispositivo mecânico para brocas de baixa rotação, usado para desgaste controlado e polimento." },
      { word: "PECAPORTA", clue: "Peça reta de baixa rotação para laboratório.", explanation: "Peça de mão linear usada principalmente para ajustes de próteses e aparelhos fora da boca." },
      { word: "MICROMOTOR", clue: "Motor elétrico ou pneumático de baixa velocidade.", explanation: "Unidade motora que aciona o contra-ângulo ou a peça reta na clínica odontológica." },
      { word: "AUTOCLAVELABORATORIO", clue: "Esterilizador dedicado a gessos e moldes.", explanation: "Autoclave especial ou adaptada para biossegurança específica de insumos e modelos de trabalho." },
      { word: "EXCAVADOR", clue: "Colher metálica dupla para remover tecido cariado.", explanation: "Cureta com extremidades afiadas em concha para remover raspas de dentina amolecida." },
      { word: "SUTURA", clue: "Conjunto de agulha e fio para fechar cortes.", explanation: "Material cirúrgico usado para aproximar bordas de tecidos incisados para cicatrização." }
    ]
  },

  // --- BLOCO 4: MATERIAIS ODONTOLÓGICOS (FASES 16 A 20) ---
  {
    id: 16,
    title: "Materiais Restauradores Básicos",
    category: "Materiais Odontológicos",
    words: [
      { word: "RESINA", clue: "Material restaurador estético ativado por luz.", explanation: "Compósito resinoso fotopolimerizável amplamente usado para restaurações estéticas diretas." },
      { word: "AMALGAMA", clue: "Material metálico cinza clássico de restauração.", explanation: "Liga metálica contendo mercúrio e prata, de altíssima durabilidade mas pouco estética." },
      { word: "IONOMERO", clue: "Cimento restaurador que libera flúor.", explanation: "Cimento de ionômero de vidro (CIV), biocompatível e com adesão química à dentina." },
      { word: "CERAMICA", clue: "Material de porcelana para dentes artificiais.", explanation: "Material inorgânico altamente estético usado em próteses, coroas, facetas e blocos." },
      { word: "ACRILICO", clue: "Resina plástica para bases de próteses.", explanation: "Polímero de metilmetacrilato usado para confeccionar dentes artificiais e gengivas de dentaduras." },
      { word: "GESSO", clue: "Pó mineral que vira pedra ao misturar com água.", explanation: "Sulfato de cálcio hemi-hidratado usado para vazar moldes e criar modelos físicos das arcadas." },
      { word: "ALGINATO", clue: "Material hidrocoloide irreversível de moldagem.", explanation: "Pó derivado de algas marinhas que gelifica ao contato com a água para moldagens de estudo." },
      { word: "SILICONE", clue: "Elastômero de alta precisão para moldagem.", explanation: "Material sintético elástico usado em moldagens de próteses (por condensação ou adição)." },
      { word: "CIMENTO", clue: "Substância para colar próteses ou forrar dentes.", explanation: "Material de presa química ou física usado para fixar coroas, bandas ou proteger a polpa." },
      { word: "GUTAPERCHA", clue: "Cone elástico usado para preencher canais.", explanation: "Polímero natural termoplástico derivado de árvore, base do preenchimento endodôntico." }
    ]
  },
  {
    id: 17,
    title: "Adesivos e Selantes",
    category: "Materiais Odontológicos",
    words: [
      { word: "ADESIVO", clue: "Líquido que cola a resina no dente.", explanation: "Sistema de monômeros que se infiltra nas fibras de colágeno da dentina para retenção." },
      { word: "SELANTE", clue: "Resina fluida para cobrir sulcos profundos.", explanation: "Película protetora aplicada em fóssulas e fissuras de dentes posteriores para evitar cáries." },
      { word: "HIDROXIDO", clue: "Pó alcalino para cimento de proteção pulpar.", explanation: "Hidróxido de cálcio, material alcalino indutor de dentina reparadora." },
      { word: "OXIDODEZINCO", clue: "Pó base para cimentos provisórios.", explanation: "Composto químico inorgânico usado em associação com o eugenol para cimentos temporários." },
      { word: "EUGENOL", clue: "Líquido aromático derivado do cravo.", explanation: "Líquido calmante para polpa dental usado com óxido de zinco (cimento OZE)." },
      { word: "FOSFATODECALCIO", clue: "Mineral que auxilia na remineralização.", explanation: "Sal mineral insolúvel que deposita íons cálcio e fosfato na superfície dentária desmineralizada." },
      { word: "FOSFATODEZINCO", clue: "Cimento clássico de fixação metálica.", explanation: "Cimento com forte acidez inicial usado para cimentar coroas metálicas e bandas ortodônticas." },
      { word: "POLICARBOXILATO", clue: "Primeiro cimento com adesão química ao dente.", explanation: "Cimento de poliacrilato de zinco, muito biocompatível com tecidos dentários." },
      { word: "SILICATO", clue: "Cimento vítreo estético antigo de silicato.", explanation: "Material precursor do ionômero de vidro, hoje em desuso por sua alta solubilidade." },
      { word: "RESINOSO", clue: "Tipo de cimento moderno de alta resistência.", explanation: "Cimento à base de resina para cimentação adesiva de lentes de contato e pinos de fibra." }
    ]
  },
  {
    id: 18,
    title: "Componentes e Reações",
    category: "Materiais Odontológicos",
    words: [
      { word: "MERCURIO", clue: "Metal líquido tóxico componente do amálgama.", explanation: "Único metal que se mantém líquido em temperatura ambiente, usado para amalgamar ligas de prata." },
      { word: "LIGA", clue: "Mistura de metais em pó para restauração.", explanation: "Pó metálico de prata, estanho, cobre e zinco que se mistura ao mercúrio no amálgama." },
      { word: "METACRILATO", clue: "Monômero básico das resinas acrílicas.", explanation: "Molécula orgânica volátil que polimeriza para formar plásticos rígidos transparentes." },
      { word: "MONOMERO", clue: "Molécula simples que se une a outras.", explanation: "Unidade química básica líquida que reage para formar cadeias poliméricas sólidas." },
      { word: "POLIMERO", clue: "Cadeias moleculares que formam o plástico rígido.", explanation: "Estrutura macromolecular sólida resultante da união de múltiplos monômeros." },
      { word: "ALGINATOPODER", clue: "Apresentação seca do material de moldagem (Alginato em pó).", explanation: "Forma em pó de alginato de sódio que requer hidratação para gelificar." },
      { word: "SILICONECONDENSACAO", clue: "Silicone que libera álcool na presa.", explanation: "Elastômero de moldagem que tem como subproduto da reação a evaporação de álcool etílico." },
      { word: "SILICONEADICAO", clue: "Silicone de máxima precisão sem subprodutos.", explanation: "Elastômero polimerizado por reação de adição, com excelente estabilidade dimensional." },
      { word: "GESSOESTRUTURAL", clue: "Gesso do tipo IV de alta dureza para troquéis.", explanation: "Gesso com cristais densos usado para confeccionar modelos de próteses fixas e troquéis." },
      { word: "GESSOHEMIHIDRATADO", clue: "Composição química do pó de gesso seco.", explanation: "Pó obtido pela calcinação do gesso natural (sulfato de cálcio di-hidratado)." }
    ]
  },
  {
    id: 19,
    title: "Clareamento e Condicionamento",
    category: "Materiais Odontológicos",
    words: [
      { word: "HIDROXIDODECALCIO", clue: "Fórmula química do forrador indutor de dentina.", explanation: "Substância alcalina (pH ~12.5) bactericida usada em curativos de canal e proteção pulpar." },
      { word: "AGUAOXIGENADA", clue: "Peróxido de hidrogênio em solução líquida.", explanation: "Agente oxidante e antisséptico usado para limpeza ou clareamento dentário." },
      { word: "PEROXIDOCARBAMIDA", clue: "Gel clareador usado na técnica caseira.", explanation: "Composto que se decompõe em peróxido de hidrogênio e ureia para clareamento dental." },
      { word: "PEROXIDOHIDROGENIO", clue: "Agente clareador ativo de consultório.", explanation: "Molécula instável que libera oxigênio livre para quebrar pigmentos cromóforos na dentina." },
      { word: "CONDICIONADOR", clue: "Ácido usado para criar microporosidades no dente.", explanation: "Ácido fosfórico que prepara o esmalte e a dentina para receber o adesivo." },
      { word: "ACIDOFOSFORICO", clue: "Ácido azul a 37% de ataque ácido.", explanation: "Substância ácida usada para desmineralizar esmalte e remover lama dentinária." },
      { word: "SILANO", clue: "Agente de união química entre cerâmica e resina.", explanation: "Molécula bifuncional que adere ao esmalte vítreo da cerâmica e aos monômeros da resina." },
      { word: "BARREIRA", clue: "Protetor gengival usado no clareamento.", explanation: "Resina fluida fotopolimerizável aplicada na gengiva para protegê-la de queimaduras ácidas." },
      { word: "ANESTESICO", clue: "Substância que bloqueia a dor localmente.", explanation: "Fármaco que impede a condução dos impulsos nervosos nas fibras sensoriais." },
      { word: "VASOCONSTRITOR", clue: "Substância que estreita os vasos sanguíneos.", explanation: "Aditivo do anestésico que reduz sangramento e prolonga a duração do bloqueio nervoso." }
    ]
  },
  {
    id: 20,
    title: "Anestésicos e Endodônticos",
    category: "Materiais Odontológicos",
    words: [
      { word: "MEPIVACAINA", clue: "Anestésico sem vasoconstritor comum.", explanation: "Sal anestésico de ação intermediária, ideal para pacientes cardiopatas quando sem vasoconstritor." },
      { word: "LIDOCAINA", clue: "Anestésico padrão mais utilizado no mundo.", explanation: "Sal anestésico do tipo amida, referência de eficácia e segurança na odontologia." },
      { word: "PRILOCAINA", clue: "Anestésico com felipressina.", explanation: "Sal anestésico contraindicado para grávidas e pacientes com meta-hemoglobinemia." },
      { word: "ARTICAINA", clue: "Anestésico de alta difusão óssea.", explanation: "Sal anestésico moderno com anel tiofeno, proporcionando excelente anestesia em tecidos duros." },
      { word: "BUPIVACAINA", clue: "Anestésico de longa duração para cirurgias.", explanation: "Sal anestésico potente usado em procedimentos cirúrgicos longos e controle da dor pós-operatória." },
      { word: "FELIPRESSINA", clue: "Vasoconstritor não adrenérgico.", explanation: "Análogo sintético da vasopressina que atua em receptores vasculares venosos." },
      { word: "EPINEFRINA", clue: "Adrenalina vasoconstritora.", explanation: "Vasoconstritor adrenérgico mais potente e comum na odontologia." },
      { word: "NOREPINEFRINA", clue: "Vasoconstritor adrenérgico menos potente.", explanation: "Agente adrenérgico com forte ação alfa, em desuso por riscos de picos hipertensivos." },
      { word: "RETENTOR", clue: "Pino de fibra ou metal para reter restauração.", explanation: "Pino cimentado no canal radicular para sustentar o núcleo de preenchimento em dentes destruídos." },
      { word: "CUNHAPLASTICA", clue: "Dispositivo plástico para adaptação de matrizes.", explanation: "Cunha colorida que adapta e sela a matriz na região cervical dos dentes." }
    ]
  },

  // --- BLOCO 5: PROCEDIMENTOS CLÍNICOS (FASES 21 A 25) ---
  {
    id: 21,
    title: "Procedimentos Preventivos e Básicos",
    category: "Procedimentos Clínicos",
    words: [
      { word: "PROFILAXIA", clue: "Limpeza profissional preventiva dos dentes.", explanation: "Procedimento clínico de remoção mecânica de placa e tártaro com taça de borracha e ultrassom." },
      { word: "RASPAGEM", clue: "Remoção de tártaro aderido ao dente.", explanation: "Terapia periodontal mecânica para desorganizar o cálculo dentário acima ou abaixo da gengiva." },
      { word: "RESTAURACAO", clue: "Procedimento para reconstruir dente cariado.", explanation: "Reconstrução da estrutura dentária perdida utilizando resina composta, CIV ou amálgama." },
      { word: "EXODONTIA", clue: "Termo técnico para extração de dente.", explanation: "Remoção cirúrgica de um elemento dentário do seu alvéolo ósseo." },
      { word: "CLAREAMENTO", clue: "Procedimento para branquear os dentes.", explanation: "Aplicação de géis de peróxido para oxidar pigmentos escuros no interior da dentina." },
      { word: "ANESTESIA", clue: "Bloqueio temporário da sensibilidade à dor.", explanation: "Procedimento pré-operatório essencial para garantir o conforto do paciente durante tratamentos invasivos." },
      { word: "IMPLANTE", clue: "Pino de titânio fixado no osso para substituir raiz.", explanation: "Parafuso biocompatível inserido cirurgicamente no osso alveolar para suportar coroas protéticas." },
      { word: "MOLDAGEM", clue: "Cópia em negativo da boca do paciente.", explanation: "Impressão física dos dentes e mucosas feita com alginato ou silicone para planejar próteses." },
      { word: "PROTESE", clue: "Dispositivo para substituir dentes perdidos.", explanation: "Elemento artificial (coroa, ponte, dentadura) que reabilita a função mastigatória e estética." },
      { word: "CIRURGIA", clue: "Intervenção manual operatória no paciente.", explanation: "Procedimento invasivo realizado para tratar patologias, traumas ou anomalias do sistema estomatognático." }
    ]
  },
  {
    id: 22,
    title: "Especialidades Clínicas",
    category: "Procedimentos Clínicos",
    words: [
      { word: "ENDODONTIA", clue: "Tratamento de canal do dente.", explanation: "Especialidade que trata da polpa dentária, sistema de canais e tecidos periapicais." },
      { word: "FACETA", clue: "Fina capa protética para a frente do dente.", explanation: "Lâmina restauradora (em resina ou cerâmica) colada na face vestibular para corrigir cor ou formato." },
      { word: "LENTEDECONTATO", clue: "Faceta cerâmica ultrafina sem desgaste.", explanation: "Lâmina de porcelana de espessura milimétrica colada no dente com desgaste mínimo ou nulo do esmalte." },
      { word: "ENXERTO", clue: "Transplante de tecido ósseo ou gengival.", explanation: "Procedimento de inserção de material biológico ou sintético para recuperar perdas de osso ou gengiva." },
      { word: "LIMPEZADENTAL", clue: "Profilaxia básica de remoção de resíduos.", explanation: "Higiene profissional realizada no consultório para manter os dentes livres de biofilmes nocivos." },
      { word: "CURETAGEM", clue: "Raspagem interna da parede da bolsa gengival.", explanation: "Remoção do epitélio doente inflamado que reveste internamente a bolsa periodontal." },
      { word: "GENGIVOPLASTIA", clue: "Cirurgia estética para contornar a gengiva.", explanation: "Remoção cirúrgica de excessos gengivais para harmonizar o tamanho dos dentes e do sorriso." },
      { word: "FRENECTOMIA", clue: "Corte cirúrgico de freio labial ou lingual.", explanation: "Cirurgia para remoção ou reposicionamento do freio fibroso que limita movimentos labiais ou da língua." },
      { word: "APICECTOMIA", clue: "Corte cirúrgico da ponta da raiz infeccionada.", explanation: "Remoção cirúrgica da ponta apical da raiz do dente para tratar lesões resistentes ao canal." },
      { word: "OSTEOTOMIA", clue: "Corte ou remoção de tecido ósseo.", explanation: "Procedimento cirúrgico que envolve o desgaste ou secção controlada de osso." }
    ]
  },
  {
    id: 23,
    title: "Procedimentos e Patologias",
    category: "Procedimentos Clínicos",
    words: [
      { word: "BIOPSIA", clue: "Remoção de tecido vivo para análise laboratorial.", explanation: "Retirada cirúrgica de uma amostra de lesão bucal para diagnóstico histopatológico de câncer ou cistos." },
      { word: "DRENAGEM", clue: "Evacuação de pus de um abscesso infectado.", explanation: "Incisão cirúrgica ou abertura de canal para escoar fluidos purulentos sob pressão na infecção." },
      { word: "SELAMENTO", clue: "Aplicação de selante em dentes sadios.", explanation: "Procedimento preventivo que veda as fissuras profundas dos molares contra restos alimentares." },
      { word: "FLUORTERAPIA", clue: "Aplicação tópica de flúor concentrado.", explanation: "Tratamento preventivo com gel de flúor acidulado ou neutro para fortalecer o esmalte desmineralizado." },
      { word: "ORTODONTIA", clue: "Especialidade de movimentação e alinhamento dentário.", explanation: "Ramo da odontologia focado no uso de aparelhos para corrigir a posição de dentes e ossos maxilares." },
      { word: "PERIODONTIA", clue: "Tratamento de doenças da gengiva e suporte do dente.", explanation: "Especialidade que trata da saúde dos tecidos de suporte dos dentes, combatendo a gengivite." },
      { word: "PATOLOGIABUCAL", clue: "Estudo das doenças da boca no laboratório.", explanation: "Ciência que investiga as causas, processos e efeitos de enfermidades orais." },
      { word: "CIRURGIAO", clue: "Título dado ao dentista clínico geral (dentista operatório).", explanation: "Designação profissional (Cirurgião-Dentista) habilitado para realizar atos cirúrgicos bucais." },
      { word: "RADIOGRAFIADENTAL", clue: "Exame de imagem interna dos dentes.", explanation: "Técnica radiográfica usada para revelar cáries ocultas, perda óssea e anatomia das raízes." },
      { word: "PREVENCAOSAUDE", clue: "Ações públicas de promoção de saúde bucal.", explanation: "Atividades coletivas ou individuais voltadas à educação, dieta saudável e prevenção de doenças." }
    ]
  },
  {
    id: 24,
    title: "Reabilitação e Prótese",
    category: "Procedimentos Clínicos",
    words: [
      { word: "REABILITACAO", clue: "Restauração completa da função e estética oral.", explanation: "Conjunto de tratamentos complexos (implantes, coroas) para devolver a boca à plena saúde." },
      { word: "COROATOTAL", clue: "Capa protética que recobre todo o dente desgastado.", explanation: "Restauração indireta extracoronária cimentada sobre um dente preparado ou pino protético." },
      { word: "BLOCO", clue: "Restauração indireta que substitui cúspides fraturadas.", explanation: "Restauração parcial rígida de porcelana ou resina fabricada em laboratório e colada no dente." },
      { word: "ONLAY", clue: "Restauração indireta parcial com cobertura de cúspide.", explanation: "Peça protética colada que recobre uma ou mais cúspides funcionais perdidas do dente posterior." },
      { word: "INLAY", clue: "Restauração indireta restrita ao interior das cúspides.", explanation: "Bloco protético intracavitário que não envolve o desgaste ou recobrimento de nenhuma cúspide." },
      { word: "OVERLAY", clue: "Restauração indireta com recobrimento oclusal completo.", explanation: "Peça cimentada que recobre toda a face mastigatória do dente posterior com desgaste minimizado." },
      { word: "PROTESETOTAL", clue: "Dentadura completa para pacientes sem nenhum dente.", explanation: "Dispositivo mucossuportado acrílico que substitui todos os dentes de uma arcada ausente." },
      { word: "PROTESEPARCIAL", clue: "Prótese removível de grampos metálicos.", explanation: "Aparelho retido por grampos nos dentes remanescentes que repõe elementos ausentes (PPR)." },
      { word: "ROACH", clue: "Prótese parcial removível com grampos de apoio.", explanation: "Denominação clássica da ponte móvel metálica baseada nos grampos projetados por Roach." },
      { word: "DENTADURA", clue: "Termo popular para a prótese total acrílica.", explanation: "Aparelho removível rosa de acrílico com dentes artificiais para desdentados totais." }
    ]
  },
  {
    id: 25,
    title: "Técnicas de Anestesia",
    category: "Procedimentos Clínicos",
    words: [
      { word: "ANESTESIATOPICA", clue: "Gel anestésico para pele ou mucosa superficial.", explanation: "Aplicação prévia de anestésico tópico (como benzocaína) para diminuir a dor da picada da agulha." },
      { word: "INFILTRATIVA", clue: "Anestesia depositada próximo às raízes locais.", explanation: "Injeção de anestésico no tecido conjuntivo supraperiósteo para bloquear dentes individuais." },
      { word: "PLEXUAL", clue: "Bloqueio do plexo nervoso terminal dentário.", explanation: "Tipo de anestesia local muito eficaz em maxila, onde o osso poroso permite a difusão da droga." },
      { word: "BLOQUEIO", clue: "Anestesia regional de grandes troncos nervosos.", explanation: "Depósito de anestésico longe do dente para adormecer um quadrante inteiro da boca." },
      { word: "TRONCULAR", clue: "Anestesia do nervo alveolar inferior no forame mandibular.", explanation: "Bloqueio que anestesia metade da mandíbula, incluindo dentes, gengiva, língua e lábio inferior." },
      { word: "SINDESMOTOMIA", clue: "Descolamento cirúrgico das fibras gengivais.", explanation: "Corte mecânico da inserção gengival epitelial que envolve o dente que será extraído." },
      { word: "LUXACAO", clue: "Movimento de afrouxar o dente no osso com alavanca.", explanation: "Forçamento mecânico da raiz contra as paredes alveolares para romper o ligamento periodontal." },
      { word: "PREAPREPARO", clue: "Ajuste e desgaste inicial do dente para coroa.", explanation: "Etapa de confecção do formato de encaixe do dente antes de receber uma restauração indireta." },
      { word: "CIMENTACAO", clue: "Colagem definitiva de peças protéticas nos dentes.", explanation: "Fixação química e mecânica da prótese no preparo usando cimentos resinosos ou fosfato." },
      { word: "ACABAMENTO", clue: "Ajuste fino de restaurações para remover excessos.", explanation: "Fase de remoção de rebarbas, ajuste de mordida e início do polimento de resinas." }
    ]
  },

  // --- BLOCO 6: ENDODONTIA (FASES 26 A 30) ---
  {
    id: 26,
    title: "Patologias e Conceitos de Canal",
    category: "Endodontia",
    words: [
      { word: "CANAL", clue: "Espaço no interior da raiz que aloja o nervo.", explanation: "Conduto ósseo radicular que contém a polpa dentária e requer tratamento quando infeccionado." },
      { word: "LIMA", clue: "Instrumento fino de metal para limpar o canal.", explanation: "Haste metálica serrilhada e flexível usada manualmente ou em motor para alargar canais." },
      { word: "OBTURACAO", clue: "Preenchimento hermético do canal limpo.", explanation: "Velamento do conduto radicular com cones de guta-percha e cimento endodôntico." },
      { word: "NECROSE", clue: "Morte do tecido pulpar no dente.", explanation: "Cessação das funções vitais da polpa devido a cárie profunda ou trauma, gerando infecção bacteriana." },
      { word: "PULPITE", clue: "Inflamação dolorosa da polpa dentária.", explanation: "Processo inflamatório pulpar agudo provocado por cáries, causando dor intensa espontânea." },
      { word: "IRRIGACAO", clue: "Lavagem química do canal durante o preparo.", explanation: "Injeção de líquidos antissépticos para remover detritos necróticos e eliminar germes." },
      { word: "INSTRUMENTACAO", clue: "Desgaste mecânico e limpeza das paredes do canal.", explanation: "Preparo físico do canal usando limas para dar forma cônica adequada à obturação." },
      { word: "CONDENSACAO", clue: "Compactação de guta-percha dentro do canal.", explanation: "Ação de empurrar lateralmente os cones de guta-percha para preencher todos os espaços." },
      { word: "APEXIFICACAO", clue: "Indução de barreira mineral em dentes jovens sem ápice.", explanation: "Tratamento para fechar a ponta da raiz aberta de dentes necrosados usando hidróxido de cálcio." },
      { word: "ODONTOMETRIA", clue: "Medição do comprimento de trabalho do canal.", explanation: "Determinação do limite de trabalho do canal por meio de radiografias ou localizadores eletrônicos." }
    ]
  },
  {
    id: 27,
    title: "Química e Medicamentos de Canal",
    category: "Endodontia",
    words: [
      { word: "PULPECTOMIA", clue: "Remoção total da polpa viva do dente.", explanation: "Extirpação mecânica da polpa dentária inflamada em canal saudável antes da infecção avançada." },
      { word: "BIOPULPECTOMIA", clue: "Tratamento de canal em dente com polpa viva.", explanation: "Intervenção em dente sadio ou com inflamação reversível, livre de contaminação bacteriana severa." },
      { word: "NECROPULPECTOMIA", clue: "Tratamento de canal em dente com polpa morta.", explanation: "Intervenção endodôntica em dentes com necrose e forte contaminação por bactérias no canal." },
      { word: "HIPOCLORITO", clue: "Líquido de lavagem de canal (cloro ativo).", explanation: "Solução de hipoclorito de sódio, solvente de matéria orgânica e excelente antisséptico de canal." },
      { word: "CLOREXIDINA", clue: "Substância antisséptica alternativa ao hipoclorito.", explanation: "Líquido ou gel bactericida usado para irrigação, de alta substantividade nos tecidos dentários." },
      { word: "EDAC", clue: "Líquido quelante para remover raspas de canal.", explanation: "Ácido EDTA que remove cálcio e limpa a lama dentinária aderida às paredes do canal." },
      { word: "TRICRESOL", clue: "Curativo de canal clássico com formocresol.", explanation: "Medicamento antisséptico forte de ação gasosa usado no interior da câmara pulpar." },
      { word: "PARAMONOCLOROFENOL", clue: "Medicamento antisséptico de ação prolongada.", explanation: "Curativo intracanal potente do grupo fenol para controle de infecções graves." },
      { word: "OTOSPORIN", clue: "Medicamento anti-inflamatório para dor pulpar.", explanation: "Solução otológica com corticosteroide e antibiótico usada para acalmar a polpa inflamada." },
      { word: "CALEN", clue: "Pasta comercial à base de hidróxido de cálcio.", explanation: "Substância de liberação lenta usada como curativo de demora entre as sessões de canal." }
    ]
  },
  {
    id: 28,
    title: "Tipos de Limas e Obturação",
    category: "Endodontia",
    words: [
      { word: "LIMAKERR", clue: "Lima manual tipo K de aço inoxidável.", explanation: "Lima de seção quadrangular ou triangular para exploração e alargamento de canais." },
      { word: "LIMAHEDSTROEM", clue: "Lima tipo H para remoção vigorosa de dentina.", explanation: "Lima helicoidal com alta capacidade de corte sob movimentos de tração." },
      { word: "LIMANITI", clue: "Lima flexível de Níquel-Titânio para canais curvos.", explanation: "Instrumento feito com liga de NiTi, superelástico que acompanha as curvaturas da raiz sem fraturar." },
      { word: "LOCALIZADOR", clue: "Aparelho eletrônico que mede o final do dente.", explanation: "Equipamento que detecta a constrição apical gerando sinal sonoro preciso para o limite do canal." },
      { word: "APICAL", clue: "Região próxima à ponta extrema da raiz.", explanation: "Zona limite do canal radicular onde se situa o forame apical." },
      { word: "CONEDEGUTA", clue: "Bastão cônico elástico para obturação.", explanation: "Ponta de guta-percha calibrada que preenche a maior parte do conduto radicular tratado." },
      { word: "CONEDEPAPEL", clue: "Ponta absorvente de papel para secar o canal.", explanation: "Bastãozinho de papel estéril superabsorvente usado para secar a umidade antes do cimento." },
      { word: "CIMENTOCANAL", clue: "Cimento endodôntico usado para colar os cones.", explanation: "Pasta vedadora que preenche os microespaços entre os cones de guta-percha e as paredes." },
      { word: "ESPACADOR", clue: "Ponta fina cônica metálica para abrir espaço.", explanation: "Instrumental endodôntico usado para empurrar os cones lateralmente e criar vagas para cones adicionais." },
      { word: "CONDENSADORPASTOSO", clue: "Lentulo, espiral para levar cimento ao canal.", explanation: "Broca em espiral que joga o cimento fluido para o ápice do canal em rotação." }
    ]
  },
  {
    id: 29,
    title: "Traumas e Diagnósticos Pulpares",
    category: "Endodontia",
    words: [
      { word: "REABSORCAO", clue: "Perda patológica de estrutura da raiz dentária.", explanation: "Destruição lenta do dente mediada por osteoclastos, ocorrendo nas superfícies internas ou externas." },
      { word: "TRAUMATISMO", clue: "Lesão física sofrida pelo dente em impactos.", explanation: "Pancada mecânica que pode causar concussão, luxação ou fratura do dente e sua polpa." },
      { word: "ANESTESIAPULPAR", clue: "Anestesia interna da polpa do elemento.", explanation: "Bloqueio profundo dos nervos do dente, necessário para realizar tratamentos de canal sem dor." },
      { word: "DIAGNOSTICOPULPAR", clue: "Exame para verificar o estado da polpa.", explanation: "Procedimento clínico para avaliar se o nervo está inflamado de forma reversível ou se está morto." },
      { word: "TESTEVITALIDADE", clue: "Teste térmico de frio ou calor no dente.", explanation: "Aplicação de spray gelado para testar se o dente responde (polpa viva) ou não (necrose)." },
      { word: "ABSCESSO", clue: "Acúmulo de pus resultante de infecção ativa.", explanation: "Coleção purulenta dolorosa associada à infecção do ápice do dente, provocando inchaço." },
      { word: "INFLAMACAO", clue: "Resposta defensiva do dente contra bactérias.", explanation: "Reação inflamatória da polpa que causa dor devido ao aumento de pressão na câmara de esmalte rígida." },
      { word: "EDEMA", clue: "Inchaço facial provocado por infecção do canal.", explanation: "Acúmulo de líquido inflamatório nos tecidos da bochecha decorrente de abscesso radicular." },
      { word: "FISTULA", clue: "Canal de saída de pus na gengiva.", explanation: "Caminho natural criado pelo corpo para drenar pus de uma infecção óssea crônica para fora." },
      { word: "PERIAPICOPATIA", clue: "Lesão inflamatória no osso ao redor do ápice.", explanation: "Patologia óssea apical decorrente da necrose pulpar, como granulomas ou cistos." }
    ]
  },
  {
    id: 30,
    title: "Casos Avançados de Canal",
    category: "Endodontia",
    words: [
      { word: "OBLITERACAO", clue: "Fechamento parcial ou total do canal por dentina.", explanation: "Calcificação progressiva do conduto radicular decorrente de idade avançada ou trauma antigo." },
      { word: "CALCIFICACAO", clue: "Depósito de minerais no interior da polpa.", explanation: "Formação de nódulos ou calcificação difusa que dificulta a passagem das limas no canal." },
      { word: "DILACERACAO", clue: "Curvatura excessiva na raiz do dente.", explanation: "Desviação anatômica angulada na trajetória da raiz, exigindo grande perícia na instrumentação." },
      { word: "PERFURACAO", clue: "Abertura acidental de comunicação falsa na raiz.", explanation: "Furo feito indevidamente na parede da raiz ou no assoalho da polpa durante o preparo." },
      { word: "INSTRUMENTOFRATURADO", clue: "Fragmento de lima quebrado no canal.", explanation: "Acidente operatório onde a ponta da lima quebra dentro do canal devido à fadiga de metal." },
      { word: "REINTERVENCAO", clue: "Retratamento de canal realizado novamente.", explanation: "Repetição do tratamento do canal devido a infecções persistentes ou falha na primeira obturação." },
      { word: "CIRURGIAPARENDODONTICA", clue: "Cirurgia no ápice radicular.", explanation: "Procedimento complementar de corte na raiz feito quando o tratamento convencional falha." },
      { word: "DESOBTURACAO", clue: "Remoção do material obturador do canal.", explanation: "Retirada dos cones de guta-percha antigos para permitir a limpeza em novo tratamento." },
      { word: "SOLVENTE", clue: "Líquido para amolecer a guta-percha.", explanation: "Substância química (como óleo de casca de laranja ou eucaliptol) que dissolve a guta." },
      { word: "REABSORCAORADICULAR", clue: "Desgaste destrutivo da raiz pelo organismo.", explanation: "Processo de destruição progressiva do cemento e dentina da raiz, interna ou externamente." }
    ]
  },

  // --- BLOCO 7: PERIODONTIA (FASES 31 A 35) ---
  {
    id: 31,
    title: "Doenças Periodontais Básicas",
    category: "Periodontia",
    words: [
      { word: "BOLSA", clue: "Espaço doente aprofundado entre dente e gengiva.", explanation: "Bolsa periodontal formada pela perda patológica de inserção óssea e gengival." },
      { word: "GENGIVITE", clue: "Inflamação superficial apenas da gengiva.", explanation: "Doença gengival reversível induzida por acúmulo de biofilme, sem perda óssea." },
      { word: "PERIODONTITE", clue: "Infecção gengival grave que destrói o osso de suporte.", explanation: "Doença inflamatória destrutiva crônica que consome o osso alveolar e o ligamento." },
      { word: "TARTARO", clue: "Cálculo endurecido fixado no esmalte.", explanation: "Depósito salino bacteriano calcificado que serve de nicho para novos patógenos." },
      { word: "BIOFILME", clue: "Comunidade organizada de germes na saliva.", explanation: "Película biológica viscosa aderida aos dentes, principal fator causador de cáries e gengivites." },
      { word: "INSERCAO", clue: "Fixação do dente no osso e gengiva.", explanation: "Conexão biológica do dente promovida pelo ligamento periodontal e epitélio de união." },
      { word: "MOBILIDADE", clue: "Grau de abalo ou dente frouxo na boca.", explanation: "Grau de oscilação do dente no alvéolo devido à destruição avançada do osso periodontal." },
      { word: "RECESSAO", clue: "Gengiva retraída que expõe a raiz do dente.", explanation: "Deslocamento da margem gengival em direção apical, deixando a raiz desprotegida e sensível." },
      { word: "SULCO", clue: "Espaço saudável raso entre gengiva e dente.", explanation: "Sulco gengival fisiológico de até 3mm de profundidade em condições normais." },
      { word: "FIORETRATOR", clue: "Fio inserido no sulco para afastar a gengiva.", explanation: "Corda fina de algodão usada para deslocar temporariamente a gengiva antes de moldagens." }
    ]
  },
  {
    id: 32,
    title: "Procedimentos e Curetas",
    category: "Periodontia",
    words: [
      { word: "RASPAGEMRADICULAR", clue: "Alisamento mecânico da superfície da raiz doente.", explanation: "Procedimento periodontal para remover tártaro aderido à raiz e alisar a dentina radicular." },
      { word: "ENXERTOGENGIVAL", clue: "Cirurgia para repor gengiva retraída.", explanation: "Transplante de tecido mucoso (do palato) para cobrir raízes expostas por recessão." },
      { word: "GENGIVITEULCERATIVA", clue: "Infecção gengival dolorosa necrosante rápida.", explanation: "Gengivite grave necrosante (GUN) caracterizada por crateras de necrose nas papilas e dor severa." },
      { word: "CURETAGRACEY", clue: "Cureta periodontal milimetrada específica por área.", explanation: "Família de curetas com lâmina angulada ativa de um só lado para raspagem subgengival específica." },
      { word: "ALVEOLITE", clue: "Inflamação dolorosa do osso do alvéolo vazio.", explanation: "Infeção pós-extração decorrente da perda precoce do coágulo sanguíneo protetor." },
      { word: "AUMENTOCOROA", clue: "Cirurgia para expor mais estrutura dentária.", explanation: "Remoção cirúrgica de gengiva e osso para expor dente sadio que receberá uma coroa." },
      { word: "PLACABACTERIANA", clue: "Massa microbiana macia aderida ao dente.", explanation: "Concentração bacteriana em matriz de mucoproteínas salivares, removível com escovação." },
      { word: "TARTAROSUBGENGIVAL", clue: "Cálculo escuro oculto abaixo da gengiva.", explanation: "Cálculo esverdeado ou preto fortemente aderido às raízes dentro das bolsas." },
      { word: "OSTECTOMIA", clue: "Desgaste ósseo para remover suporte excedente.", explanation: "Remoção de parte de osso alveolar em cirurgias de contorno estético ou periodontal." },
      { word: "GENGIVECTOMIA", clue: "Corte cirúrgico simples do excesso gengival.", explanation: "Remoção de porções hiperplásicas ou excessivas de gengiva livre para eliminar bolsas falsas." }
    ]
  },
  {
    id: 33,
    title: "Anatomia e Proteção Periodontal",
    category: "Periodontia",
    words: [
      { word: "PERIODONTOINSERCAO", clue: "Tecidos que prendem o dente no lugar.", explanation: "Conjunto formado por osso alveolar, ligamento periodontal e cemento radicular." },
      { word: "PERIODONTOPROTECAO", clue: "Gengiva que protege o dente de germes.", explanation: "Conjunto protetor composto por gengiva livre, gengiva inserida e epitélio juncional." },
      { word: "FIBRASELASTICAS", clue: "Fibras elásticas acessórias da polpa e ligamento.", explanation: "Estruturas que conferem flexibilidade vascular em tecidos conjuntivos periodontais." },
      { word: "FIBRASCOLAGENAS", clue: "Fibras principais que suspendem o dente.", explanation: "Feixes densos de colágeno que unem o dente ao osso amortecendo pressões." },
      { word: "CEMENTOCELULAR", clue: "Cemento do terço apical da raiz dentária.", explanation: "Cemento formado após a erupção do dente, contendo restos celulares (cementócitos)." },
      { word: "ESPACOFUNCIONAL", clue: "Distância milimétrica de folga do ligamento.", explanation: "Espaço radiográfico do ligamento periodontal que aumenta sob trauma de mastigação excessiva." },
      { word: "SULCOCLINICO", clue: "Sulco medido clinicamente com sonda.", explanation: "Medida em milímetros obtida pela inserção da sonda periodontal na margem gengival." },
      { word: "EPITELIOUNIAO", clue: "Epitélio juncional que sela o dente na base.", explanation: "Estrutura celular aderida diretamente ao esmalte ou cemento por hemidesmossomos." },
      { word: "JUNCAOCEMENTOESMALTE", clue: "Linha anatômica limite cervical do dente.", explanation: "Marco cervical onde terminam as células de esmalte e iniciam as de cemento." },
      { word: "FIBRASDESHARPEY", clue: "Pontas de fibras colágenas inseridas no osso.", explanation: "Extremidades calcificadas de fibras do ligamento ancoradas dentro do osso e cemento." }
    ]
  },
  {
    id: 34,
    title: "Biofilmes e Patogenia",
    category: "Periodontia",
    words: [
      { word: "BIOFILMEORAL", clue: "Nome técnico atual da placa bacteriana organizada.", explanation: "Ecossistema estruturado de micróbios envolto em matriz de polímeros extracelulares." },
      { word: "PLACAMADURA", clue: "Placa velha com bactérias anaeróbias perigosas.", explanation: "Acúmulo maduro de biofilme colonizado por bacilos anaeróbios gram-negativos agressivos." },
      { word: "SALIVAR", clue: "Relativo à saliva que banha e limpa dentes.", explanation: "Adjetivo associado à secreção bucal que contém anticorpos IgA e enzimas defensivas." },
      { word: "PELICULAADQUIRIDA", clue: "Fina película proteica limpa antes das bactérias.", explanation: "Película amorfa acelular formada por glicoproteínas salivares logo após a escovação." },
      { word: "TARTAROSUPRAGENGIVAL", clue: "Cálculo visível amarelado acima da gengiva.", explanation: "Depósito de minerais da saliva sobre a placa bacteriana na coroa dos dentes." },
      { word: "CALCULO", clue: "Sinônimo científico de tártaro.", explanation: "Depósito sólido calcificado resultante da precipitação de sais minerais na placa." },
      { word: "DESMINERALIZACAO", clue: "Perda de minerais do esmalte por ácidos de germes.", explanation: "Etapa química inicial da cárie e erosão ácida onde o cálcio sai do dente." },
      { word: "RECOLONIZACAO", clue: "Retorno rápido das bactérias aos dentes limpos.", explanation: "Processo de fixação de novas colônias microbianas logo após a profilaxia clínica." },
      { word: "ESCOVACAO", clue: "Ação de escovar dentes para remover placa.", explanation: "Principal mecanismo domiciliar mecânico de controle do biofilme e saúde gengival." },
      { word: "SAUDEGENGIVAL", clue: "Gengiva rosa sem sangramento ou inflamação.", explanation: "Estado clínico de integridade dos tecidos gengivais saudáveis." }
    ]
  },
  {
    id: 35,
    title: "Periodontia Avançada e Implantes",
    category: "Periodontia",
    words: [
      { word: "PERIMOLAR", clue: "Área gengival circundante dos dentes molares.", explanation: "Tecidos gengivais associados à bifurcação ou trifurcação das raízes dos molares." },
      { word: "PERIIMPLANTITE", clue: "Perda óssea destrutiva ao redor do implante.", explanation: "Doença inflamatória destrutiva análoga à periodontite, mas que afeta os implantes." },
      { word: "MUCOSITE", clue: "Inflamação da gengiva ao redor de um implante.", explanation: "Reação inflamatória reversível na mucosa ao redor do implante, sem perda de osso." },
      { word: "OSSODESINTEGRACAO", clue: "Perda da união do osso com o implante (falha).", explanation: "Desconexão mecânica do implante do tecido ósseo por infecção ou sobrecarga de força." },
      { word: "PERIOSTIO", clue: "Membrana fibrosa densa que envolve o osso.", explanation: "Tecido conjuntivo vascularizado que recobre e nutre as superfícies externas dos ossos." },
      { word: "RETALHO", clue: "Pedaço de gengiva descolado do osso em cirurgia.", explanation: "Porção de tecido gengival cortada e afastada para visualizar o osso adjacente." },
      { word: "MEMBRANA", clue: "Película usada em regeneração óssea guiada.", explanation: "Barreira de colágeno ou PTFE usada para isolar células gengivais de invadir o osso." },
      { word: "BARREIRA", clue: "Dispositivo que impede invasão epitelial no osso.", explanation: "Película física biocompatível para isolamento celular em enxertos de osso (membrana)." },
      { word: "REGENERACAO", clue: "Reconstrução dos tecidos perdidos de suporte.", explanation: "Processo histológico ideal de neoformação de osso, ligamento e cemento funcionais." },
      { word: "XENOGRAFTO", clue: "Enxerto ósseo derivado de outras espécies (ex: boi).", explanation: "Material ósseo inorgânico biocompatível estrangeiro usado para preencher cavidades ósseas." }
    ]
  },

  // --- BLOCO 8: ORTODONTIA (FASES 36 A 40) ---
  {
    id: 36,
    title: "Componentes do Aparelho Fixo",
    category: "Ortodontia",
    words: [
      { word: "BRAQUETE", clue: "Pequena peça colada em cada dente do aparelho.", explanation: "Acessório metálico, cerâmico ou plástico colado no esmalte para guiar o fio ortodôntico." },
      { word: "ARCO", clue: "Fio metálico flexível que alinha os dentes.", explanation: "Arame ortodôntico que passa pelas fendas dos braquetes exercendo a força de alinhamento." },
      { word: "ALINHADOR", clue: "Aparelho removível de plástico transparente.", explanation: "Placa termoplástica sequencial invisível para mover dentes de forma estética." },
      { word: "MORDIDACRUZADA", clue: "Dentes superiores mordendo por dentro dos inferiores.", explanation: "Desalinhamento transversal onde os dentes superiores ficam na parte interna em relação aos inferiores." },
      { word: "MORDIDAABERTA", clue: "Falta de contato entre dentes ao fechar a boca.", explanation: "Ausência de toque vertical entre os dentes superiores e inferiores em determinada região da arcada." },
      { word: "CLASSEI", clue: "Relação normal entre maxila e mandíbula.", explanation: "Encaixe correto sagital dos molares, onde há apenas mau posicionamento dentário isolado." },
      { word: "CLASSEII", clue: "Dentes de cima muito à frente dos de baixo.", explanation: "Desarmonia óssea ou dentária onde o arco superior sobressai à mandíbula (retrusão mandibular)." },
      { word: "CLASSEIII", clue: "Mandíbula avançada muito à frente da maxila.", explanation: "Anomalia esquelética onde o arco inferior se projeta à frente do arco superior." },
      { word: "CONTENCAO", clue: "Aparelho usado após retirar o aparelho fixo.", explanation: "Dispositivo (móvel ou fixo) para manter os dentes na nova posição estabilizada." },
      { word: "BANDA", clue: "Anel metálico cimentado nos dentes molares.", explanation: "Anel de aço inoxidável adaptado ao redor do molar para ancorar componentes do aparelho." }
    ]
  },
  {
    id: 37,
    title: "Fios e Acessórios Ortodônticos",
    category: "Ortodontia",
    words: [
      { word: "ELASTICO", clue: "Borrachinhas coloridas ou elásticos de tração.", explanation: "Elásticos de látex ou poliuretano usados para prender o arco ou mover dentes intermaxilarmente." },
      { word: "DISJUNTOR", clue: "Aparelho para alargar o céu da boca esquelético.", explanation: "Dispositivo expansor com parafuso (como o Hyrax) para abrir a sutura palatina em jovens." },
      { word: "MASCARAFACIAL", clue: "Aparelho externo para puxar a maxila.", explanation: "Dispositivo ortopédico extraoral usado para tracionar a maxila para a frente em Classe III." },
      { word: "CEFALOMETRIA", clue: "Estudo de medidas radiográficas do crânio.", explanation: "Traçados milimétricos e angulares dos ossos da face para planejar o tratamento." },
      { word: "ANCORAGEMESQUELETICA", clue: "Uso do osso facial como ponto firme de apoio.", explanation: "Técnica de obter apoio fixo absoluto no osso para mover dentes sem efeitos colaterais." },
      { word: "MINIIMPLANTE", clue: "Microparafuso de osso temporário de apoio.", explanation: "Pequeno pino de titânio instalado no osso alveolar para fixação ortodôntica temporária." },
      { word: "MICROPARAFUSO", clue: "Sinônimo clínico de mini-implante ortodôntico.", explanation: "Dispositivo metálico de ancoragem fixado temporariamente na cortical óssea." },
      { word: "CONTENCAOFIXA", clue: "Fio de aço colado por trás dos dentes frontais.", explanation: "Fio de aço trançado colado na face lingual dos dentes anteriores para evitar recidivas." },
      { word: "SEPARADOR", clue: "Elástico azul apertado colocado entre os molares.", explanation: "Anel de borracha inserido entre dentes dias antes para criar espaço para a banda metálica." },
      { word: "MESIALIZACAO", clue: "Movimentação do dente em direção à linha média frontal.", explanation: "Deslocamento ortodôntico do dente para a frente na arcada em direção ao centro do sorriso." }
    ]
  },
  {
    id: 38,
    title: "Tipos de Aparelhos e Problemas",
    category: "Ortodontia",
    words: [
      { word: "MORDIDAPROFUNDA", clue: "Dentes de cima cobrem muito os de baixo verticalmente.", explanation: "Sobremordida exagerada, onde os dentes anteriores superiores recobrem quase todos os inferiores." },
      { word: "SOBREBORDAMENTO", clue: "Distância sagital entre dentes superiores e inferiores.", explanation: "Transpasse horizontal (overjet) dos incisivos superiores em relação aos inferiores." },
      { word: "APINHAMENTO", clue: "Falta de espaço que entorta os dentes.", explanation: "Dentes tortos e apinhados uns sobre os outros por falta de espaço no arco esquelético." },
      { word: "DIASTEMA", clue: "Espaço aberto separado entre dois dentes.", explanation: "Ausência de contato interproximal, muito comum entre os incisivos centrais superiores." },
      { word: "ATRESIA", clue: "Estreitamento esquelético do arco dentário.", explanation: "Arco dentário muito estreito de formato triangular ou ogival." },
      { word: "BRAQUETEMETALICO", clue: "Braquete de aço cinza comum.", explanation: "Peça clássica de aço inoxidável muito resistente e barata para tratamentos." },
      { word: "BRAQUETECERAMICO", clue: "Braquete estético fosco cor do dente.", explanation: "Peça de cerâmica de alumina policristalina com coloração semelhante ao dente." },
      { word: "BRAQUETESAFIRA", clue: "Braquete estético de vidro transparente.", explanation: "Peça de alumina monocristalina pura, totalmente transparente e resistente a manchas." },
      { word: "AUTOLIGAVEL", clue: "Braquete moderno que não precisa de borrachinha.", explanation: "Braquete com canaleta fechada por clipe metálico, reduzindo o atrito do fio." },
      { word: "ARCONITI", clue: "Fio ortodôntico com memória de formato.", explanation: "Arco de níquel-titânio que retorna ao formato ideal sob a temperatura da boca." }
    ]
  },
  {
    id: 39,
    title: "Mecânicas de Movimentação",
    category: "Ortodontia",
    words: [
      { word: "ARCOACO", clue: "Fio rígido de aço para fases finais.", explanation: "Arqueamento rígido de aço inoxidável usado para estabilização, dobras e controle de torque." },
      { word: "ELASTICOCADEIA", clue: "Elástico em corrente contínua para fechar espaços.", explanation: "Corrente de elásticos interligados usada para puxar dentes juntos e fechar diastemas." },
      { word: "ELASTICOINTERMAXILAR", clue: "Elástico esticado entre arcadas superiores e inferiores.", explanation: "Elástico que o paciente usa ancorado em braquetes de cima e de baixo para ajustar a mordida." },
      { word: "DISJUNTORPALATINO", clue: "Aparelho colado no palato para abrir a sutura.", explanation: "Aparelho expansor esquelético fixo de Hasse ou Hyrax com ancoragem dentária." },
      { word: "EXPANSAORAPIDA", clue: "Abertura rápida da maxila com ativação diária.", explanation: "Ativação constante do disjuntor palatino gerando abertura de espaço ósseo no céu da boca." },
      { word: "EXPANSAOMAXILAR", clue: "Alargamento dentoalveolar do arco superior.", explanation: "Expansão lenta das arcadas com fins de obter pequenos espaços e nivelamento." },
      { word: "DISTRACAO", clue: "Abertura óssea cirúrgica para crescer ossos curtos.", explanation: "Distração osteogênica, alongamento cirúrgico de mandíbula ou maxila sob tração controlada." },
      { word: "TRACAO", clue: "Força puxando um dente retido para o arco.", explanation: "Mecânica de tracionamento ortodôntico de dentes inclusos (como caninos presos no osso)." },
      { word: "INTRUSAO", clue: "Força de empurrar o dente para dentro do osso.", explanation: "Movimento ortodôntico no sentido apical para diminuir a exposição da coroa." },
      { word: "EXTRUSAO", clue: "Força de puxar o dente para fora do osso.", explanation: "Movimento no sentido coronário para trazer o dente ou expor margens profundas." }
    ]
  },
  {
    id: 40,
    title: "Posicionamento e Detalhes Ortodônticos",
    category: "Ortodontia",
    words: [
      { word: "GIROVERSAO", clue: "Dente rotacionado em torno do seu próprio eixo.", explanation: "Anomalia de rotação onde o dente está girado em relação à sua posição correta na arcada." },
      { word: "DISTALIZACAO", clue: "Empurrar o dente para trás na arcada.", explanation: "Deslocamento de dentes posteriores em direção distal para obter espaço no arco." },
      { word: "TORQUE", clue: "Torção no fio para ajustar inclinação de raiz.", explanation: "Força de torção do arco retangular que inclina a raiz do dente para dentro ou fora do osso." },
      { word: "ANGULACAO", clue: "Inclinação do dente no sentido de frente para trás.", explanation: "Inclinação mesiodistal do dente regulada pela posição do braquete (ângulo de tip)." },
      { word: "DIAGNOSTICOORTODONTICO", clue: "Planejamento completo da pasta ortodôntica.", explanation: "Análise geral de fotos, radiografias e modelos antes de colar o aparelho." },
      { word: "ANALISECEFALOMETRICA", clue: "Cálculo matemático das linhas faciais e crânio.", explanation: "Processamento numérico de traçados anatômicos em radiografias laterais da face." },
      { word: "BITEBLOCK", clue: "Bloco de mordida acrílico limitador.", explanation: "Dispositivo oclusal de resina para impedir que dentes de cima batam nos braquetes de baixo." },
      { word: "COMPENSACAO", clue: "Movimentos dentários para camuflar defeito ósseo.", explanation: "Tratamento que inclina dentes para disfarçar uma discrepância óssea sem fazer cirurgia." },
      { word: "RECIDIVA", clue: "Dentes entortando de novo após retirar o aparelho.", explanation: "Tendência natural dos dentes de retornar à posição original anômala por falta de contenção." },
      { word: "APINHAMENTODENTAL", clue: "Falta de espaço severo com dentes encavalados.", explanation: "Condição clínica de desalinhamento por falta de perímetro ósseo nas arcadas." }
    ]
  },

  // --- BLOCO 9: RADIOLOGIA E DIAGNÓSTICO (FASES 41 A 45) ---
  {
    id: 41,
    title: "Exames de Imagem Intrabucais",
    category: "Radiologia e Diagnóstico",
    words: [
      { word: "RADIOGRAFIA", clue: "Imagem de sombra óssea obtida por raios X.", explanation: "Exame básico de diagnóstico que atravessa os tecidos gerando imagens em filme ou sensor." },
      { word: "TOMOGRAFIA", clue: "Exame 3D detalhado dos ossos da face.", explanation: "Imagem tridimensional computadorizada para avaliar volume ósseo e planejar implantes." },
      { word: "PANORAMICA", clue: "Radiografia geral plana de toda a boca de uma vez.", explanation: "Exame extrabucal que mostra em uma única imagem todos os dentes, mandíbula e maxila." },
      { word: "PERIAPICAL", clue: "Radiografia pequena que foca na raiz inteira e ápice.", explanation: "Exame intrabucal focado na visualização de detalhes anatômicos e lesões ao redor da raiz." },
      { word: "BITEWING", clue: "Radiografia de mordida para ver cáries entre dentes.", explanation: "Radiografia interproximal ideal para detectar perdas ósseas iniciais e cáries escondidas de contato." },
      { word: "ANAMNESE", clue: "Entrevista clínica com histórico de saúde do paciente.", explanation: "Primeira etapa da consulta onde o profissional faz perguntas sobre doenças, alergias e queixa principal." },
      { word: "PROGNOSTICO", clue: "Estimativa sobre a chance de sucesso do tratamento.", explanation: "Previsão do curso e desfecho da doença baseada nas condições do paciente e evidências científicas." },
      { word: "LESAO", clue: "Qualquer ferida ou alteração patológica na boca.", explanation: "Área de tecido corporal com estrutura ou função alterada por doenças ou traumas." },
      { word: "PATOLOGIA", clue: "Estudo das alterações estruturais causadas por doenças.", explanation: "Especialidade médica e laboratorial que analisa biópsias e diagnostica anomalias celulares." },
      { word: "OCLUSAL", clue: "Radiografia que vê o palato ou assoalho bucal.", explanation: "Técnica intrabucal com filme posicionado no plano de mordida para mapear dentes inclusos de cima." }
    ]
  },
  {
    id: 42,
    title: "Terminologia Radiográfica",
    category: "Radiologia e Diagnóstico",
    words: [
      { word: "CEFALOMETRICA", clue: "Relativo à radiografia lateral de perfil do crânio.", explanation: "Radiografia padronizada de perfil para traçar linhas de medição ortodôntica da cabeça." },
      { word: "RADIOPACO", clue: "Área branca da radiografia (bloqueia o raio X).", explanation: "Região clara correspondente a materiais ou tecidos densos como metal, esmalte ou osso." },
      { word: "RADIOLUCIDO", clue: "Área escura da radiografia (o raio X atravessa).", explanation: "Região escura indicando tecidos moles, espaços vazios, ar ou lesões destrutivas infecciosas." },
      { word: "INTERPROXIMAL", clue: "Espaço de contato localizado entre dentes vizinhos.", explanation: "Região de encontro dos dentes, local crítico para cáries invisíveis ao exame clínico simples." },
      { word: "RECEPTOR", clue: "Placa digital ou filme que capta os raios X.", explanation: "Dispositivo que recebe a radiação residual e a transforma em imagem visível ou digital." },
      { word: "FILME", clue: "Pequena película química analógica flexível.", explanation: "Meio físico analógico tradicional com sais de prata que exige revelação em câmara escura." },
      { word: "SENSOR", clue: "Dispositivo digital rígido que envia imagem ao computador.", explanation: "Sensor eletrônico que capta os raios X e gera imagem instantânea na tela, reduzindo radiação." },
      { word: "PROTETORTIREOIDE", clue: "Gola pesada de chumbo para proteger o pescoço.", explanation: "Gola de chumbo obrigatória para proteger a glândula tireoide da radiação secundária." },
      { word: "POSICIONADOR", clue: "Dispositivo plástico para centralizar o filme no dente.", explanation: "Suporte que o paciente morde para manter o filme paralelo e perpendicular ao feixe de raios X." },
      { word: "COLIMADOR", clue: "Cilindro de chumbo que direciona os raios X.", explanation: "Dispositivo do aparelho que limita o diâmetro do feixe de radiação ao tamanho ideal." }
    ]
  },
  {
    id: 43,
    title: "Processamento e Radiação",
    category: "Radiologia e Diagnóstico",
    words: [
      { word: "CAMARAESCURA", clue: "Caixa preta lacrada para revelar o filme à mão.", explanation: "Caixa portátil com filtros de luz vermelha onde o profissional processa quimicamente a radiografia." },
      { word: "REVELADOR", clue: "Líquido químico que escurece a imagem radiográfica.", explanation: "Solução alcalina que reduz os cristais de halogênio de prata expostos em prata metálica preta." },
      { word: "FIXADOR", clue: "Líquido que remove cristais não expostos do filme.", explanation: "Solução ácida que dissolve os sais de prata não ativados, limpando e preservando a imagem." },
      { word: "ECO", clue: "Reflexão de ondas em exames ultrassônicos.", explanation: "Retorno de ondas acústicas usadas na visualização de tecidos moles ou glândulas salivares." },
      { word: "RADIACAO", clue: "Emissão de energia eletromagnética ionizante.", explanation: "Ondas invisíveis capazes de quebrar ligações celulares, exigindo proteção constante na clínica." },
      { word: "DOSIMETRO", clue: "Distintivo de medição de radiação do profissional.", explanation: "Pequeno sensor preso ao jaleco para medir a quantidade acumulada de radiação recebida." },
      { word: "KVP", clue: "Quilovoltagem de pico que define penetração do raio X.", explanation: "Parâmetro elétrico que controla o contraste e a energia cinética dos elétrons gerados." },
      { word: "MILIAMPERAGEM", clue: "Corrente que define a quantidade total de raios X.", explanation: "Ajuste elétrico do aparelho (mA) que dita o tempo de exposição e a densidade da imagem." },
      { word: "EFEITOESTOCASTICO", clue: "Dano celular probabilístico de radiação crônica.", explanation: "Efeitos biológicos tardios da radiação (como câncer) cujos riscos sobem com a dose acumulada." },
      { word: "EFEITODETERMINISTICO", clue: "Dano celular imediato de altas doses de radiação.", explanation: "Lesão tecidual direta (como queimaduras na pele) que ocorre após cruzar uma dose mínima de exposição." }
    ]
  },
  {
    id: 44,
    title: "Radiologia Avançada de Diagnóstico",
    category: "Radiologia e Diagnóstico",
    words: [
      { word: "TOMOGRAFIACONEBEAM", clue: "Tomografia computadorizada odontológica de feixe cônico.", explanation: "Exame 3D de alta precisão que gera baixa dose de radiação em relação à tomografia médica." },
      { word: "PANORAMICADIGITAL", clue: "Radiografia geral captada direto no computador.", explanation: "Exame que usa sensores lineares rotatórios para processamento imediato da arcada total." },
      { word: "TELERRADIOGRAFIA", clue: "Radiografia de perfil do crânio a distância.", explanation: "Exame lateral feito a distância constante para manter as proporções reais da face e crânio." },
      { word: "CEFALOGRAMA", clue: "Conjunto de pontos de marcação na radiografia lateral.", explanation: "Desenho e plotagem de marcos anatômicos para calcular ângulos de crescimento ósseo facial." },
      { word: "RASTREAMENTO", clue: "Busca sistemática de lesões ocultas na boca.", explanation: "Exame de triagem periódica para detecção precoce de lesões malignas e de cáries." },
      { word: "INTERPRETACAO", clue: "Leitura analítica das imagens radiográficas pelo dentista.", explanation: "Análise diagnóstica visual dos padrões radiopacos e radiolúcidos das estruturas." },
      { word: "CONTRASTE", clue: "Diferença visual entre tons cinzas da imagem.", explanation: "Nível de distinção cromática entre as áreas claras e escuras na radiografia." },
      { word: "ARTEFATO", clue: "Distorção ou defeito visual falso na imagem digital.", explanation: "Linhas ou manchas estranhas criadas na imagem por movimentos do paciente ou metais." },
      { word: "RADIODENSIDADE", clue: "Capacidade dos tecidos de barrar os raios X.", explanation: "Grau de absorção de radiação por um tecido, maior no esmalte e menor na gengiva." },
      { word: "DENSIDADEOSSEA", clue: "Grau de mineralização e trabeculado do osso.", explanation: "Mapeamento da dureza e qualidade do osso trabeculado para ancoragem estável de implantes." }
    ]
  },
  {
    id: 45,
    title: "Patologias e Laudos Radiográficos",
    category: "Radiologia e Diagnóstico",
    words: [
      { word: "RADIOPACIDADE", clue: "Qualidade do tecido denso que brilha na radiografia.", explanation: "Característica de tecidos ou materiais que surgem como pontos ou áreas brancas." },
      { word: "ADENOMA", clue: "Tumor epitelial glandular benigno bucal.", explanation: "Neoplasia benigna de glândulas salivares de aparência nodular endurecida." },
      { word: "CISTO", clue: "Cavidade patológica revestida por tecido epitelial.", explanation: "Saco fechado de líquido ou material pastoso comum no osso mandibular perto de raízes." },
      { word: "AMELOBLASTOMA", clue: "Tumor benigno agressivo destruidor de osso na mandíbula.", explanation: "Neoplasia odontogênica destrutiva com aspecto de bolhas de sabão na radiografia." },
      { word: "OSTEOMELITE", clue: "Infecção bacteriana severa de todo o osso mandibular.", explanation: "Inflamação purulenta do osso e medula óssea decorrente de infecção dentária grave." },
      { word: "RADIODERMITE", clue: "Lesão de pele por queimadura de radiação intensa.", explanation: "Queimadura na mucosa ou pele facial causada por radiação excessiva sem blindagem." },
      { word: "RADIOPROTECAO", clue: "Normas de proteção contra radiação ionizante.", explanation: "Medidas e leis de proteção ao trabalhador e paciente na exposição a raios X." },
      { word: "CHUMBO", clue: "Metal pesado usado nas roupas protetoras.", explanation: "Elemento de alta densidade capaz de absorver a radiação secundária nos exames." },
      { word: "AVENTAL", clue: "Capa pesada protetora contra radiação.", explanation: "Vestimenta de chumbo (avental plumbífero) que recobre o tórax do paciente nos raios X." },
      { word: "ANODO", clue: "Pólo positivo gerador de calor do tubo de raio X.", explanation: "Alvo de tungstênio no cabeçote contra o qual colidem os elétrons para gerar radiação." }
    ]
  },

  // --- BLOCO 10: ESPECIALIDADES AVANÇADAS (FASES 46 A 50) ---
  {
    id: 46,
    title: "Implantodontia e Cirurgia Avançada",
    category: "Especialidades Avançadas",
    words: [
      { word: "IMPLANTODONTIA", clue: "Especialidade de fixar dentes no osso com pinos.", explanation: "Ramo voltado à reabilitação de dentes perdidos por implantes metálicos biocompatíveis." },
      { word: "ESTOMATOLOGIA", clue: "Especialidade médica que trata das lesões da boca.", explanation: "Área focada no diagnóstico e tratamento clínico de doenças sistêmicas na mucosa bucal." },
      { word: "ODONTOPEDIATRIA", clue: "Atendimento odontológico voltado para bebês e crianças.", explanation: "Especialidade focada no desenvolvimento e cuidados bucais desde o nascimento até a adolescência." },
      { word: "HARMONIZACAO", clue: "Conjunto de procedimentos estéticos da face.", explanation: "Aplicação de injetáveis, toxinas e preenchedores para equilibrar dentes e simetria facial." },
      { word: "BUCOMAXILOFACIAL", clue: "Cirurgias de grande porte em ambiente hospitalar.", explanation: "Especialidade cirúrgica que reconstrói fraturas, remove tumores e trata deformidades faciais." },
      { word: "DTM", clue: "Disfunção temporomandibular dolorosa da articulação.", explanation: "Conjunto de distúrbios musculares e articulares que geram dores de cabeça e estalos na ATM." },
      { word: "TRAUMATOLOGIA", clue: "Estudo e tratamento de lesões causadas por impactos.", explanation: "Atendimento de urgência de traumas e fraturas nos dentes e ossos da face." },
      { word: "LASERTERAPIA", clue: "Uso de laser de baixa potência para cicatrização.", explanation: "Aplicação de luz terapêutica para acelerar cicatrização bucal e aliviar dores de aftas." },
      { word: "TOXINA", clue: "Toxina botulínica para rugas ou bruxismo.", explanation: "Proteína purificada para paralisar músculos faciais tensos, aliviando dores de bruxismo." },
      { word: "PREENCHEDOR", clue: "Gel de ácido hialurônico para volume facial.", explanation: "Substância injetável biocompatível para redefinir volume labial e contorno da face." }
    ]
  },
  {
    id: 47,
    title: "Harmonização Orofacial e Estética",
    category: "Especialidades Avançadas",
    words: [
      { word: "ATM", clue: "Sigla de Articulação Temporomandibular.", explanation: "Estrutura bilateral complexa que une a mandíbula ao osso temporal permitindo a mastigação." },
      { word: "BICHECTOMIA", clue: "Cirurgia para remoção de gordura das bochechas.", explanation: "Retirada parcial da bola de Bichat para fins estéticos ou para evitar mordedura interna." },
      { word: "LIPOPAPILA", clue: "Redução de gordura submentoniana (papada).", explanation: "Tratamento de emagrecimento facial para eliminar gordura sob o queixo." },
      { word: "FIOSPDOD", clue: "Fios absorvíveis de sustentação facial.", explanation: "Fios de polidioxanona colocados sob a pele para estimular colágeno e sustentar tecidos caídos." },
      { word: "ACIDODEOCICOLICO", clue: "Ácido injetado para destruir células de gordura na papada.", explanation: "Enzima sintética que dissolve a gordura submentoniana de forma injetável." },
      { word: "ALECTOMIA", clue: "Cirurgia de redução das asas laterais do nariz.", explanation: "Remoção de pele nasal nas narinas para diminuir a largura do nariz ao sorrir." },
      { word: "MENTOPLASTIA", clue: "Cirurgia de modificação e aumento do queixo.", explanation: "Ajuste ósseo ou colocação de prótese para projetar ou reduzir o tamanho do mento." },
      { word: "PEELINGQUIMICO", clue: "Aplicação de ácido para renovação da pele do rosto.", explanation: "Tratamento dermatológico facial que descama a epiderme para tratar manchas e acne." },
      { word: "MICROAGULHAMENTO", clue: "Rolagem de microagulhas para rejuvenescimento.", explanation: "Terapia de indução percutânea de colágeno através de microlesões controladas na pele." },
      { word: "BIOESTIMULADOR", clue: "Injeção de ácido polilático para gerar colágeno.", explanation: "Substância líquida injetada na face que induz o corpo a fabricar colágeno próprio." }
    ]
  },
  {
    id: 48,
    title: "Cirurgia Hospitalar Bucomaxilo",
    category: "Especialidades Avançadas",
    words: [
      { word: "FIXACAOMAXILAR", clue: "Amarra metálica de fraturas de mandíbula.", explanation: "Bloqueio maxilomandibular temporário com fios de aço para imobilizar a mordida fraturada." },
      { word: "FRATURALEFORT", clue: "Classificação cirúrgica de fraturas da maxila alta.", explanation: "Tipos de fraturas maxilares horizontais decorrentes de acidentes automobilísticos ou traumas graves." },
      { word: "OSTEOSSINTESE", clue: "Fixação rígida de ossos quebrados com parafusos.", explanation: "União cirúrgica de segmentos ósseos fraturados usando miniplacas e parafusos de titânio." },
      { word: "PLACATITANIO", clue: "Fina chapa de titânio biocompatível para osso.", explanation: "Placa metálica que permanece integrada ao osso facial após cirurgias reconstrutivas." },
      { word: "TERCEIROMOLAR", clue: "Dente do siso (último dente da arcada).", explanation: "Dente que erupciona por volta dos 18 anos, muito associado a cirurgias por falta de espaço." },
      { word: "IMPLANTEZIGOMATICO", clue: "Implante longo fixado na bochecha (osso zigomático).", explanation: "Pinguinho metálico longo ancorado no osso da maçã do rosto, indicado para perdas maxilares extremas." },
      { word: "SINUSLIFT", clue: "Cirurgia de levantamento do seio maxilar para enxerto.", explanation: "Elevação da membrana do seio maxilar posterior com colocação de osso para implantes." },
      { word: "ENXERTOOSSEO", clue: "Reconstrução de maxilas atróficas sem osso.", explanation: "Depósito de partículas ósseas para aumentar a espessura e altura do osso alveolar para implantes." },
      { word: "MENISCOPEXIA", clue: "Reposicionamento cirúrgico do disco articular preso.", explanation: "Fixação cirúrgica do disco da ATM na sua posição original quando deslocado cronicamente." },
      { word: "CIRURGIAORTOGNATICA", clue: "Cirurgia corretiva de mandíbula muito grande ou pequena.", explanation: "Procedimento cirúrgico-ortodôntico que reposiciona maxila e mandíbula para curar desoclusões graves." }
    ]
  },
  {
    id: 49,
    title: "Prótese e Reabilitação Oral Estética",
    category: "Especialidades Avançadas",
    words: [
      { word: "PROTESESOBREIMPLANTE", clue: "Dente de cerâmica parafusado no implante de titânio.", explanation: "Coroa protética ou prótese fixada diretamente sobre pilares conectados aos implantes." },
      { word: "OVERDENTURE", clue: "Dentadura removível abotoada sobre implantes.", explanation: "Prótese total móvel que possui encaixes (botões) que prendem em pinos de implante." },
      { word: "PROTOCOLO", clue: "Prótese total parafusada fixa sobre implantes.", explanation: "Dentadura fixa de porcelana ou resina sobre 4 a 6 implantes, sem céu da boca de acrílico." },
      { word: "COROAPROVISORIA", clue: "Coroa acrílica de transição rápida no dente.", explanation: "Dente artificial temporário usado para manter estética e função enquanto a cerâmica é feita." },
      { word: "COPING", clue: "Estrutura interna metálica ou de zircônia da coroa.", explanation: "Capa de reforço interno sobre a qual é queimada a cerâmica estética do dente artificial." },
      { word: "DUALCIMENTO", clue: "Cimento resinoso de polimerização química e física.", explanation: "Material colante que endurece tanto por ação de luz quanto por reação química interna." },
      { word: "SILANIZACAO", clue: "Aplicação de silano para unir cerâmica ao cimento.", explanation: "Preparação química da superfície de vidro da prótese para aumentar a força adesiva." },
      { word: "COROAZIRCONIA", clue: "Coroa protética de máxima dureza sem metal.", explanation: "Dente artificial feito de óxido de zircônio, altamente resistente e livre de metal cinza." },
      { word: "DISSILICATODELITIO", clue: "Pastilha cerâmica de altíssima estética para lentes.", explanation: "Porcelana vítrea de silicato de lítio, referência em brilho e fidelidade de cor para facetas." },
      { word: "METALOCERAMICA", clue: "Coroa clássica com metal por dentro e louça por fora.", explanation: "Restabelecimento dentário composto por capa de liga metálica recoberta com cerâmica." }
    ]
  },
  {
    id: 50,
    title: "Odontopediatria e Crescimento",
    category: "Especialidades Avançadas",
    words: [
      { word: "ODONTOPEDIATRA", clue: "Dentista especialista em crianças.", explanation: "Profissional treinado no manejo psicológico e tratamentos de dentes de leite de crianças." },
      { word: "DENTEDECIDUO", clue: "Dente de leite da primeira dentição da criança.", explanation: "Grupo de 20 dentes temporários que preparam o espaço para os dentes permanentes." },
      { word: "DENTEMISTO", clue: "Fase de transição com dentes de leite e de adulto.", explanation: "Período clínico (de 6 a 12 anos) onde coexistem dentes decíduos e permanentes." },
      { word: "SELANTEFOSSULAS", clue: "Prevenção de cáries em molares recém-nascidos.", explanation: "Aplicação protetora em fissuras de molares novos para evitar nichos de germes." },
      { word: "FLUOROSE", clue: "Manchas no esmalte por engolir flúor em excesso.", explanation: "Distúrbio de formação do esmalte dentário gerado pela ingestão crônica excessiva de flúor." },
      { word: "MAMELAO", clue: "Ondulações serrilhadas na borda dos incisivos novos.", explanation: "Serrilhas naturais de esmalte em dentes que acabaram de nascer, que se desgastam na mordida." },
      { word: "ODONTOGENESE", clue: "Processo embriológico de formação dos dentes.", explanation: "Ciclo de desenvolvimento celular que gera esmalte, dentina e polpa na gestação." },
      { word: "ERUPCAODENTARIA", clue: "Processo físico de nascimento e subida do dente.", explanation: "Migração do dente de seu alvéolo intraósseo até romper a gengiva e tocar o arco oposto." },
      { word: "RIZOLISE", clue: "Reabsorção natural da raiz do dente de leite.", explanation: "Processo fisiológico onde o dente permanente destrói a raiz do dente de leite para nascer." },
      { word: "TRAUMATISMOINFANTIL", clue: "Bate-boca e perda dentária em crianças pequenas.", explanation: "Impactos físicos em dentes decíduos que podem afetar o germe do dente permanente embaixo." }
    ]
  }
];
