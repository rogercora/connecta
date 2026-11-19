export interface GerarMinutaInput {
  tituloPauta: string;
  resumoPauta: string;
  impactoBairro: string;
  vereadorAlvo: string;
  bairro: string;
  cidade: string;
  estado: string;
  totalDiscordancias: number;
  quorumMeta: number;
  motivosReais: string[];
}

export interface MinutaGeradaResult {
  tituloPeticao: string;
  resumoExecutivo: string;
  minutaTexto: string;
  argumentosSintetizados: string[];
  geradoPorIA: boolean;
  modeloIA?: string;
}

function limparMotivos(motivos: string[]): string[] {
  const seen = new Set<string>();
  const validos: string[] = [];
  for (const m of motivos) {
    const clean = String(m || '').replace(/\s+/g, ' ').trim();
    if (clean.length < 5) continue;
    const key = clean.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      validos.push(clean.slice(0, 320));
    }
    if (validos.length >= 25) break;
  }
  return validos;
}

function buildFallbackMinuta(input: GerarMinutaInput, motivosLimpos: string[]): MinutaGeradaResult {
  const argumentos =
    motivosLimpos.length > 0
      ? motivosLimpos.slice(0, 5)
      : [
          `Impacto urbano e orçamentário adverso relatado pelos moradores do bairro ${input.bairro}.`,
          'Necessidade de revisão legislativa, audiência pública e transparência prévia com a comunidade local.',
        ];

  const tituloPeticao = `Solicitação Popular de Revisão: ${input.tituloPauta}`.slice(0, 200);
  const resumoExecutivo =
    `Petição cívica formalizada por ${input.totalDiscordancias} cidadãos verificados (${input.cidade}/${input.estado}, foco em ${input.bairro}) requerendo a revisão ou suspensão do ato "${input.tituloPauta}".`;

  const listaConsiderandos = argumentos
    .map((arg, idx) => `   ${idx + 1}. ${arg}`)
    .join('\n');

  const minutaTexto = [
    `EXCELENTÍSSIMO(A) SENHOR(A) PRESIDENTE DA CÂMARA MUNICIPAL DE ${input.cidade.toUpperCase()} - ${input.estado.toUpperCase()}`,
    `C/C: Gabinete de ${input.vereadorAlvo || 'Vereança Proponente'}`,
    '',
    `ASSUNTO: Direito de Petição (Art. 5º, XXXIV, "a" da CF/88) — Revisão Popular de "${input.tituloPauta}"`,
    '',
    `Os cidadãos abaixo assinados, residentes e cadastrados na plataforma ConectaBr no município de ${input.cidade}/${input.estado} (região de ${input.bairro}), vêm, respeitosamente, com fundamento no Art. 5º, inciso XXXIV, alínea "a" da Constituição Federal de 1988, apresentar a presente PETIÇÃO CÍVICA DE REVISÃO:`,
    '',
    `I. DO OBJETO`,
    `${input.resumoPauta}`,
    '',
    `II. DO IMPACTO LOCAL RELATADO`,
    `${input.impactoBairro}`,
    '',
    `III. FUNDAMENTOS E MANIFESTAÇÕES DOS MORADORES (${input.totalDiscordancias} discordâncias registradas — quórum mínimo da cidade: ${input.quorumMeta})`,
    listaConsiderandos,
    '',
    `IV. DO REQUERIMENTO`,
    `Diante do exposto, requer-se ao Poder Legislativo Municipal e ao gabinete competente a suspensão/revisão do referido ato, a realização de audiência ou diálogo transparente com os moradores atingidos e a resposta formal a este protocolo digital.`,
    '',
    `${input.cidade}/${input.estado}, ${new Date().toLocaleDateString('pt-BR')}.`,
    `Protocolo Cívico Consolidado — ConectaBr`,
  ].join('\n');

  return {
    tituloPeticao,
    resumoExecutivo,
    minutaTexto,
    argumentosSintetizados: argumentos,
    geradoPorIA: false,
  };
}

export async function gerarMinutaPeticaoComIA(input: GerarMinutaInput): Promise<MinutaGeradaResult> {
  const motivosLimpos = limparMotivos(input.motivosReais);
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return buildFallbackMinuta(input, motivosLimpos);
  }

  const candidateModels = Array.from(
    new Set(
      [
        (process.env.GEMINI_MODEL || '').trim(),
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest',
      ].filter(Boolean)
    )
  );

  const prompt = [
    `Você é um redator jurídico cívico brasileiro auxiliando moradores de ${input.cidade}/${input.estado} (bairro ${input.bairro}).`,
    `Gere uma minuta formal de Petição Pública amparada no Art. 5º, XXXIV, "a" da Constituição Federal de 1988 (NÃO cite 5% do eleitorado nem Iniciativa Popular de Lei do Art. 29, XIII).`,
    ``,
    `DADOS DO PROJETO CONTESTADO:`,
    `- Título original: ${input.tituloPauta}`,
    `- Resumo: ${input.resumoPauta}`,
    `- Impacto local: ${input.impactoBairro}`,
    `- Autoridade/Proponente: ${input.vereadorAlvo}`,
    `- Total de discordâncias registradas: ${input.totalDiscordancias} (Quórum municipal: ${input.quorumMeta})`,
    ``,
    `MOTIVOS REAIS ENVIADOS PELOS MORADORES:`,
    motivosLimpos.length > 0
      ? motivosLimpos.map((m, i) => `- (${i + 1}) ${m}`).join('\n')
      : `- Moradores registraram oposição formal pelos impactos urbanos/orçamentários na região de ${input.bairro}.`,
    ``,
    `RETORNE EXCLUSIVAMENTE um JSON válido com as chaves exatas:`,
    `{`,
    `  "titulo_peticao": "título objetivo e formal (máx 140 chars)",`,
    `  "resumo_executivo": "parágrafo curto de 2 frases explicando a causa aos cidadãos",`,
    `  "argumentos_sintetizados": ["argumento 1 claro", "argumento 2 claro", "argumento 3 claro"],`,
    `  "minuta_texto": "texto completo da petição oficial em português formal com cabeçalho à Câmara Municipal de ${input.cidade}, fundamentos baseados nos motivos dos moradores e requerimento final objetivo"`,
    `}`,
  ].join('\n');

  for (const model of candidateModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (!res.ok) continue;
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find((p: any) => !p?.thought && typeof p?.text === 'string')?.text || '';
      if (!textPart) continue;

      const cleaned = textPart.replace(/```json|```/gi, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      const jsonStr = firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;
      const parsed = JSON.parse(jsonStr);

      if (typeof parsed?.minuta_texto === 'string' && parsed.minuta_texto.trim().length > 80) {
        const args = Array.isArray(parsed.argumentos_sintetizados)
          ? parsed.argumentos_sintetizados.map((a: any) => String(a).trim()).filter(Boolean).slice(0, 6)
          : motivosLimpos.slice(0, 4);

        return {
          tituloPeticao: String(parsed.titulo_peticao || `Revisão: ${input.tituloPauta}`).slice(0, 200),
          resumoExecutivo: String(parsed.resumo_executivo || input.impactoBairro).slice(0, 400),
          minutaTexto: parsed.minuta_texto.trim(),
          argumentosSintetizados: args.length > 0 ? args : ['Revisão de interesse comunitário.'],
          geradoPorIA: true,
          modeloIA: model,
        };
      }
    } catch {
      // tenta próximo modelo
    }
  }

  return buildFallbackMinuta(input, motivosLimpos);
}

