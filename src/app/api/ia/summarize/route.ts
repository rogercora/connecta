import { NextResponse } from 'next/server';
import zlib from 'zlib';
import { buildSummarizerPrompt, DiarioOficialInput, PautaIASummarized, SYSTEM_SUMMARIZER_PROMPT } from '@/prompts/summarizer';

/**
 * Extrator nativo de texto de streams FlateDecode de arquivos PDF em Base64.
 * Funciona de forma 100% segura no Node.js/Vercel sem dependências binárias externas.
 */
function extractTextFromPdfBase64(base64Data: string): string {
  try {
    const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    let combined = '';
    let idx = 0;

    while (idx < buffer.length) {
      const streamStart = buffer.indexOf('stream', idx);
      if (streamStart === -1) break;
      let dataStart = streamStart + 6;
      if (buffer[dataStart] === 0x0d && buffer[dataStart + 1] === 0x0a) dataStart += 2;
      else if (buffer[dataStart] === 0x0a || buffer[dataStart] === 0x0d) dataStart += 1;

      const streamEnd = buffer.indexOf('endstream', dataStart);
      if (streamEnd === -1) break;

      const chunk = buffer.subarray(dataStart, streamEnd);
      try {
        const decompressed = zlib.inflateSync(chunk);
        const str = decompressed.toString('latin1');
        const tjMatches = str.match(/\(([^)]*)\)\s*Tj/g);
        if (tjMatches) {
          tjMatches.forEach((m) => {
            const inner = m.replace(/^\(/, '').replace(/\)\s*Tj$/, '');
            combined += inner + ' ';
          });
        }
        const tjArrayMatches = str.match(/\[([^\]]*)\]\s*TJ/g);
        if (tjArrayMatches) {
          tjArrayMatches.forEach((m) => {
            const inners = m.match(/\(([^)]*)\)/g);
            if (inners) {
              inners.forEach((item) => {
                combined += item.slice(1, -1);
              });
              combined += ' ';
            }
          });
        }
      } catch (e) {
        // Ignora streams que não usam compressão flate padrão
      }
      idx = streamEnd + 9;
    }

    // Decodifica escapes octais comuns em PDFs (\272 -> º, \347 -> ç, etc.)
    const decoded = combined.replace(/\\([0-7]{1,3})/g, (_, oct) =>
      String.fromCharCode(parseInt(oct, 8))
    );
    return decoded.replace(/\s+/g, ' ').trim();
  } catch (err) {
    console.warn('Falha na extração de texto do PDF:', err);
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      texto_bruto,
      pdf_base64,
      pdf_nome,
      municipio = 'São José dos Campos',
      estado = 'SP',
      bairro_sugerido,
      fonte_nome = 'Diário Oficial Municipal',
      apiKey: userApiKey,
      customPrompt,
    } = body;

    // Se não veio texto nem PDF
    if (!texto_bruto?.trim() && !pdf_base64) {
      return NextResponse.json(
        { error: 'Por favor, envie o texto da publicação ou anexe um arquivo PDF.' },
        { status: 400 }
      );
    }

    let municipioEfetivo = municipio;
    let fonteEfetiva = fonte_nome;
    let textoEfetivo = texto_bruto?.trim() || '';
    let textoExtraidoPdf = '';

    // Extração de texto do PDF caso tenha sido enviado arquivo
    if (pdf_base64) {
      textoExtraidoPdf = extractTextFromPdfBase64(pdf_base64);

      if (textoExtraidoPdf) {
        const lowerPdf = textoExtraidoPdf.toLowerCase();
        const nomeLower = (pdf_nome || '').toLowerCase();

        // Auto-detecção precisa da cidade de origem pelo conteúdo ou nome do arquivo
        if (
          lowerPdf.includes('são josé dos campos') ||
          lowerPdf.includes('sao jose dos campos') ||
          nomeLower.includes('sjc') ||
          nomeLower.startsWith('dm_')
        ) {
          municipioEfetivo = 'São José dos Campos';
          fonteEfetiva = 'Diário do Município de São José dos Campos';
        } else if (lowerPdf.includes('jacareí') || lowerPdf.includes('jacarei') || nomeLower.includes('jacarei')) {
          municipioEfetivo = 'Jacareí';
          fonteEfetiva = 'Boletim Oficial de Jacareí';
        } else if (lowerPdf.includes('caçapava') || lowerPdf.includes('cacapava') || nomeLower.includes('cacapava')) {
          municipioEfetivo = 'Caçapava';
          fonteEfetiva = 'Diário Oficial de Caçapava';
        } else if (lowerPdf.includes('taubaté') || lowerPdf.includes('taubate') || nomeLower.includes('taubate')) {
          municipioEfetivo = 'Taubaté';
          fonteEfetiva = 'Diário Oficial de Taubaté';
        }

        if (!textoEfetivo) {
          // Usa os trechos mais relevantes do PDF para análise
          textoEfetivo = textoExtraidoPdf.slice(0, 18000);
        }
      }
    }

    if (!textoEfetivo) {
      textoEfetivo = `[Documento PDF Anexado: ${pdf_nome || 'diario_oficial.pdf'}]`;
    }

    const input: DiarioOficialInput = {
      texto_bruto: textoEfetivo,
      municipio: municipioEfetivo,
      estado,
      data_publicacao: new Date().toLocaleDateString('pt-BR'),
      fonte_nome: fonteEfetiva,
    };

    const effectivePrompt = customPrompt
      ? `${customPrompt}\n\nMUNICÍPIO ALVO: ${municipioEfetivo} - ${estado}\nBAIRRO OU REGIÃO PRINCIPAL: ${bairro_sugerido || 'Geral'}\n\nTEXTO/DOCUMENTO:\n${textoEfetivo}`
      : buildSummarizerPrompt(input);

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    // Se temos uma chave de API do Gemini, faz a chamada real (inclusive multimodal com PDF)
    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const parts: any[] = [{ text: effectivePrompt }];

        // Se veio arquivo PDF em base64, adiciona como parte multimodal nativa do Gemini
        if (pdf_base64) {
          const cleanBase64 = pdf_base64.replace(/^data:application\/pdf;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: cleanBase64,
            },
          });
        }

        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts,
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

          if (rawText) {
            const parsed = JSON.parse(rawText) as PautaIASummarized;
            return NextResponse.json({
              success: true,
              source: pdf_base64 ? 'gemini-1.5-flash (pdf-multimodal)' : 'gemini-1.5-flash',
              is_real_ai: true,
              pauta: {
                ...parsed,
                bairro_alvo: bairro_sugerido || parsed.bairro_alvo || 'Centro',
                cidade_alvo: parsed.cidade_alvo || municipioEfetivo,
                estado_alvo: parsed.estado_alvo || estado,
              },
              prompt_used: effectivePrompt,
            });
          }
        } else {
          const errText = await geminiRes.text();
          console.warn('Gemini API call failed, falling back to heuristic engine:', errText);
        }
      } catch (geminiError: any) {
        console.warn('Erro ao conectar ao Gemini, usando motor heurístico local:', geminiError.message);
      }
    }

    // Motor Heurístico Resiliente (para quando não há chave configurada ou modo offline)
    const extrairInfo = (texto: string): PautaIASummarized => {
      const lower = texto.toLowerCase();

      // Bairro
      let bairro = bairro_sugerido || 'Centro';
      if (!bairro_sugerido) {
        if (lower.includes('urbanova')) bairro = 'Urbanova';
        else if (lower.includes('santana')) bairro = 'Santana';
        else if (lower.includes('vila emma') || lower.includes('vl emma') || lower.includes('vila ema')) bairro = 'Vila Ema';
        else if (lower.includes('satélite') || lower.includes('satelite')) bairro = 'Jardim Satélite';
        else if (lower.includes('bosque')) bairro = 'Bosque dos Eucaliptos';
        else if (lower.includes('aquárius') || lower.includes('aquarius')) bairro = 'Jardim Aquárius';
        else if (lower.includes('meia lua') || lower.includes('parque meia lua')) bairro = 'Parque Meia Lua';
        else if (lower.includes('esperança')) bairro = 'Jardim Esperança';
        else if (lower.includes('centro')) bairro = 'Centro';
      }

      // Proponente
      let proponente = `Prefeitura Municipal de ${municipioEfetivo}`;
      const autorMatch = texto.match(/(?:vereador|ver\.|autor|proponente|prefeito)\s+([A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõ]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõ]+){1,3})/i);
      if (autorMatch && autorMatch[1]) {
        proponente = `Vereador ${autorMatch[1].trim()}`;
      } else if (lower.includes('câmara') || lower.includes('camara') || lower.includes('legislativo')) {
        proponente = `Câmara Municipal de ${municipioEfetivo}`;
      } else if (lower.includes('secretaria de governança') || lower.includes('secretaria de governanca')) {
        proponente = `Secretaria de Governança - ${municipioEfetivo}`;
      } else if (lower.includes('secretaria de gestão administrativa') || lower.includes('gestão administrativa e finanças')) {
        proponente = `Secretaria de Gestão Administrativa e Finanças - ${municipioEfetivo}`;
      }

      // Detecção de Contratos e Gastos Públicos
      const contratoMatch = texto.match(/CONTRATO\s+N[º°\\]*\s*(\d+\/\d+)[^]*?VALOR:\s*(R\$\s*[\d.,]+)/i);
      const pregaoMatch = texto.match(/PREG[ÃA]O\s+ELETR[ÔO]NICO\s+N[º°\\]*\s*(\d+\/\d+)/i);
      const portariaMatch = texto.match(/Portaria\s+n[º°\\]*\s*([^\s,]+)/i);

      // Tags e Temas
      const tags: string[] = [];
      let titulo = `ALERTA CIDADÃO: Legislação e Serviços`;
      let resumo = '';
      let impacto = `Mudanças nas diretrizes municipais com impacto direto na população de ${municipioEfetivo}.`;

      if (contratoMatch && contratoMatch[1]) {
        const numContrato = contratoMatch[1];
        const valor = contratoMatch[2] || '';
        tags.push('gastos-publicos', 'transparência', 'licitações');
        titulo = `ALERTA DE TRANSPARÊNCIA: Contrato Municipal nº ${numContrato}`;
        resumo = `A Prefeitura de ${municipioEfetivo} publicou homologação de contrato público${pregaoMatch ? ` decorrente de Pregão Eletrônico nº ${pregaoMatch[1]}` : ''}${valor ? ` no valor total de ${valor}` : ''}.`;
        impacto = `Fiscalização pública da aplicação dos recursos municipais e contratação de serviços no município de ${municipioEfetivo}.`;
      } else if (portariaMatch && portariaMatch[1]) {
        tags.push('governança', 'atos-oficiais');
        titulo = `ATO OFICIAL: Portaria nº ${portariaMatch[1]}`;
        resumo = `Publicada portaria oficial da ${proponente} com determinações administrativas aplicáveis à estrutura pública municipal.`;
        impacto = `Regulamentação de rotinas e diretrizes dos órgãos públicos de ${municipioEfetivo}.`;
      } else if (lower.includes('obra') || lower.includes('asfalto') || lower.includes('paviment') || lower.includes('recape')) {
        tags.push('obras', 'infraestrutura');
        titulo = `ALERTA DE OBRAS: Pavimentação e Infraestrutura`;
        resumo = `Publicada licitação ou termo de execução de obras e recapeamento viário no município.`;
        impacto = `Intervenções viárias e melhorias de pavimentação previstas para a região do ${bairro}.`;
      } else if (lower.includes('tarifa') || lower.includes('ônibus') || lower.includes('onibus') || lower.includes('transporte') || lower.includes('passe')) {
        tags.push('transporte', 'mobilidade');
        titulo = `ALERTA DE MOBILIDADE: Transporte Coletivo`;
        resumo = `Medida oficial referente a tarifas, itinerários ou linhas do transporte coletivo municipal.`;
        impacto = `Alteração nos valores de tarifas ou itinerários de linhas que atendem os moradores do ${bairro}.`;
      } else if (lower.includes('zoneamento') || lower.includes('comercial') || lower.includes('residencial') || lower.includes('loteamento')) {
        tags.push('zoneamento', 'urbanismo');
        titulo = `ALERTA DE URBANISMO: Zoneamento e Uso do Solo`;
        resumo = `Diretrizes municipais sobre ocupação do solo, loteamentos ou regras para atividades comerciais.`;
        impacto = `Regras de construção e impacto no fluxo de trânsito e vizinhança no ${bairro}.`;
      } else if (lower.includes('iptu') || lower.includes('imposto') || lower.includes('taxa') || lower.includes('tribut')) {
        tags.push('tributos', 'finanças');
        titulo = `ALERTA FISCAL: Tributos Municipais`;
        resumo = `Normativa sobre tributação municipal, prazos ou recolhimento de taxas.`;
        impacto = `Ajuste nos valores de tributos e taxas municipais aplicadas aos imóveis de ${municipioEfetivo}.`;
      } else {
        tags.push('legislação', 'serviços');
        const linhas = texto.split('\n').filter((l) => l.trim().length > 15);
        const primeiraLinha = linhas[0] || texto.slice(0, 150);
        resumo = `Publicação oficial no Diário Municipal de ${municipioEfetivo}: ${primeiraLinha.slice(0, 120)}`;
      }

      return {
        titulo,
        resumo_ia: resumo,
        impacto_bairro: impacto,
        vereador_proponente: proponente,
        bairro_alvo: bairro,
        cidade_alvo: municipioEfetivo,
        estado_alvo: estado,
        relevancia_score: 85,
        tags,
      };
    };

    const pautaHeuristica = extrairInfo(textoEfetivo);

    return NextResponse.json({
      success: true,
      source: 'heuristic-engine-fallback',
      is_real_ai: false,
      pauta: pautaHeuristica,
      prompt_used: effectivePrompt,
      note: apiKey
        ? 'Chave configurada, mas respondeu com motor de contingência.'
        : 'Processado com o Extrator Local Inteligente. Para habilitar o modelo Google Gemini 1.5 Flash completo, informe sua chave GEMINI_API_KEY na Aba 4.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
