// ============================================================
// Connecta — Prompt System para LLM (Claude / Gemini)
// Ingestão e Sumarização Neutra de Diários Oficiais
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
}

export const SYSTEM_SUMMARIZER_PROMPT = `
Você é o motor de inteligência cívica da plataforma "Conecta".
Sua missão é transformar textos burocráticos, jurídicos e herméticos de Diários Oficiais e Atas de Câmaras Municipais brasileiras em resumos ultra-claros, objetivos, imparciais e acessíveis para o cidadão comum.

DIRETRIZES FUNDAMENTAIS:
1. NEUTRALIDADE TOTAL: Nunca use tom partidário, opinativo, bajulador ou acusatório. Apenas fatos, números e consequências práticas.
2. LINGUAGEM DIRETA: Evite jargões ("outorga onerosa", "emenda aditiva", "exordial"). Traduza para o cotidiano ("custo extra de construção", "mudança na proposta original").
3. IMPACTO CONCRETO: Explique o que muda no dia a dia do bairro (ex: "Mais barulho à noite", "Aumento no IPTU", "Nova linha de ônibus", "Risco de alagamento diminuído").
4. EXTRAÇÃO PRECISA: Identifique sempre que possível o autor da proposta (Vereador, Prefeito ou Comissão) e o bairro/região afetado.
5. RESPOSTA EM JSON PURO: Responda estritamente com o objeto JSON válido, sem cercaduras markdown extras se solicitado modo raw.
`.trim();

export function buildSummarizerPrompt(input: DiarioOficialInput): string {
  return `
${SYSTEM_SUMMARIZER_PROMPT}

ENTRADA DE DIÁRIO OFICIAL:
- Município: ${input.municipio} - ${input.estado}
- Data de Publicação: ${input.data_publicacao}
- Fonte: ${input.fonte_nome || 'Diário Oficial Municipal'}

--- TEXTO BRUTO DO DIÁRIO OFICIAL ---
${input.texto_bruto}
--- FIM DO TEXTO BRUTO ---

Gere um JSON com o seguinte schema TypeScript exato:
{
  "titulo": "ALERTA DE IA: Pauta na Câmara",
  "resumo_ia": "Frase sintética e impactante explicando o que foi votado ou proposto (máx 150 caracteres).",
  "impacto_bairro": "Explicação objetiva de como a vida no bairro será afetada positiva ou negativamente (máx 120 caracteres).",
  "vereador_proponente": "Nome completo do vereador ou autor proponente (ou 'Poder Executivo' / 'Mesa Diretora')",
  "bairro_alvo": "Nome do bairro mais afetado ou 'Geral / Toda a Cidade'",
  "cidade_alvo": "${input.municipio}",
  "estado_alvo": "${input.estado}",
  "relevancia_score": 85, // número de 0 a 100 indicando urgência/impacto popular
  "tags": ["zoneamento", "obras", "mobilidade"]
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
5. Certificação digital do quórum de cidadãos auditados pela plataforma Connecta.
`.trim();
}

