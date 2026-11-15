// ============================================================
// ConectaBr — Prompt System para LLM (Claude / Gemini)
// Ingestão e Sumarização Neutra de Diários Oficiais (Multi-Pautas)
// ============================================================

export interface DiarioOficialInput {
  texto_bruto: string;
  municipio: string;
  estado: string;
  data_publicacao: string;
  fonte_nome?: string;
  link_documento?: string;
}

export interface PautaIASummarized {
  id_temp?: string;
  titulo: string;
  resumo_ia: string;
  impacto_bairro: string;
  vereador_proponente: string;
  cep_alvo?: string;
  bairro_alvo: string;
  cidade_alvo: string;
  estado_alvo: string;
  relevancia_score: number; // 0-100 (impacto na vida do cidadão comum)
  tags: string[];
  categoria?: 'gastos' | 'obras' | 'transporte' | 'zoneamento' | 'saude' | 'governanca' | 'geral';
}

export const SYSTEM_SUMMARIZER_PROMPT = `
Você é o motor de inteligência cívica da plataforma "ConectaBr".
Sua missão é analisar Diários Oficiais e Atas Municipais brasileiros e extrair exclusivamente matérias com impacto prático na vida dos cidadãos ou no orçamento público municipal.

DIRETRIZES FUNDAMENTAIS:
1. FILTRO DE RELEVÂNCIA CÍVICA (MUITO IMPORTANTE):
   - IGNORE SUMARIAMENTE ATOS DE ROTINA INTERNA / RH:
     * Concessão de férias ou licenças médicas de servidores;
     * Atribuição de gratificações internas e progressões funcionais;
     * Substituições pontuais de cargos e atos protocolares de expediente.
   - EXTRAIA MATÉRIAS DE IMPACTO PÚBLICO E COMUNITÁRIO:
     * Contratos públicos e compras de alto valor (valores em R$, empresas vencedoras, pregões);
     * Licitações de obras viárias, drenagem, contenção de encostas e pavimentação asfáltica;
     * Transporte coletivo, mudanças de itinerários, novas linhas e tarifas;
     * Decretos de zoneamento, uso do solo, ocupação urbana e regras para comércio local;
     * Saúde pública (reformas em UBSs, mutirões, vacinação e abastecimento de remédios);
     * Projetos de Lei e decretos que afetam diretamente o cotidiano dos moradores.

2. SEGMENTAÇÃO EM MÚLTIPLAS PAUTAS:
   - Um Diário Oficial contém diversos atos distintos na mesma data.
   - Extraia de 1 a 5 matérias distintas de maior relevância cívica encontradas na edição.
   - Separe cada matéria em um item independente na lista de pautas.

3. NEUTRALIDADE E LINGUAGEM DIRETA:
   - Sem tom opinativo, bajulador ou partidário.
   - Traduza termos jurídicos para linguagem clara que qualquer morador compreenda.
   - Sempre destaque valores em R$, bairros afetados e prazos quando informados no texto.

4. FORMATO OBRIGATÓRIO:
   - Retorne SEMPRE um JSON válido contendo a propriedade "pautas" com a lista de matérias extraídas.
`.trim();

export function buildSummarizerPrompt(input: DiarioOficialInput): string {
  return `
${SYSTEM_SUMMARIZER_PROMPT}

DADOS DA EDIÇÃO:
- Município: ${input.municipio} - ${input.estado}
- Data de Publicação: ${input.data_publicacao}
- Fonte: ${input.fonte_nome || 'Diário Oficial Municipal'}

--- TEXTO DO DIÁRIO OFICIAL ---
${input.texto_bruto}
--- FIM DO TEXTO ---

Responda ESTRITAMENTE com um objeto JSON no formato abaixo (extraia até 5 matérias relevantes):
{
  "pautas": [
    {
      "titulo": "ALERTA DE TRANSPARÊNCIA: Homologação de Contrato nº 533/2026",
      "resumo_ia": "Contratação pública no valor de R$ 6.270.472,79 decorrente de Pregão Eletrônico pela Secretaria de Governança.",
      "impacto_bairro": "Fiscalização da destinação de recursos públicos municipais.",
      "vereador_proponente": "Secretaria de Governança - Prefeitura de ${input.municipio}",
      "bairro_alvo": "Centro",
      "cidade_alvo": "${input.municipio}",
      "estado_alvo": "${input.estado}",
      "relevancia_score": 90,
      "tags": ["gastos-publicos", "licitacoes", "transparencia"],
      "categoria": "gastos"
    }
  ]
}
`.trim();
}

export interface PeticaoInput {
  pauta_titulo: string;
  pauta_resumo: string;
  total_votos: number;
  tipo_consenso: 'concordar' | 'discordar';
  bairro: string;
  cidade: string;
  estado: string;
  motivos_discordancia?: string[];
}

export function buildPeticaoPrompt(input: PeticaoInput): string {
  const acao = input.tipo_consenso === 'discordar' ? 'REJEIÇÃO / REVISÃO' : 'APROVAÇÃO / APOIO';
  
  return `
Você é um consultor legislativo e cívico especializado em Direito Público e peticionamento popular.
Gere a minuta formal de um "Abaixo-Assinado Digital Comunitário" fundamentado no Art. 5º, XXXIV da Constituição Federal (direito de petição).

DADOS DA MANIFESTAÇÃO:
- Pauta: ${input.pauta_titulo}
- Resumo Cidadão: ${input.pauta_resumo}
- Bairro / Região: ${input.bairro}, ${input.cidade} - ${input.estado}
- Posicionamento Comunitário: ${acao} com ${input.total_votos} cidadãos auditados por CEP
- Principais preocupações apontadas pelos moradores:
${input.motivos_discordancia?.map((m) => `  * ${m}`).join('\n') || '  * Impactos urbanísticos adversos.'}

A minuta deve conter:
1. Endereçamento à Mesa Diretora da Câmara Municipal de ${input.cidade} e Gabinete do Vereador Proponente.
2. Dos Fatos e da Mobilização Popular no Bairro ${input.bairro}.
3. Da Fundamentação da Manifestação dos Moradores.
4. Dos Pedidos (audiência pública, suspensão da tramitação ou emenda modificativa).
5. Certificação digital do quórum de cidadãos auditados pela plataforma ConectaBr.
`.trim();
}

