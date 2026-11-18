import { NextResponse } from 'next/server';
import zlib from 'zlib';
import { requireAdminUser } from '@/lib/auth/serverAuth';
import { buildSummarizerPrompt, DiarioOficialInput, PautaIASummarized } from '@/prompts/summarizer';

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_PDF_HOST_SUFFIXES = [
  '.sp.gov.br',
  '.gov.br',
  '.leg.br',
  'queridodiario.ok.org.br',
];

function isAllowedOfficialUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;

    const host = parsed.hostname.toLowerCase();
    // Bloqueia endereços numéricos/IPs e hosts locais explicitamente
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') || host === 'localhost') {
      return null;
    }

    const isAllowed = ALLOWED_PDF_HOST_SUFFIXES.some((suffix) =>
      suffix.startsWith('.') ? host.endsWith(suffix) : host === suffix || host.endsWith(`.${suffix}`)
    );

    return isAllowed ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Extrator nativo de texto de streams FlateDecode de arquivos PDF em Base64.
 * Funciona no Node.js/Vercel sem dependências binárias externas.
 */
function extractTextFromPdfBase64(base64Data: string): string {
  try {
    const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.byteLength > MAX_PDF_BYTES) return '';

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
      } catch {
        // Ignora streams que não usam compressão flate padrão
      }
      idx = streamEnd + 9;
    }

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
    const auth = await requireAdminUser();
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      texto_bruto,
      pdf_base64,
      pdf_url,
      pdf_nome,
      municipio = 'São José dos Campos',
      estado = 'SP',
      bairro_sugerido,
      fonte_nome = 'Diário Oficial Municipal',
      customPrompt,
    } = body ?? {};

    let finalPdfBase64: string | undefined =
      typeof pdf_base64 === 'string' && pdf_base64.length > 0 ? pdf_base64 : undefined;

    if (finalPdfBase64) {
      const approxBytes = Math.ceil((finalPdfBase64.length * 3) / 4);
      if (approxBytes > MAX_PDF_BYTES) {
        return NextResponse.json(
          { error: 'Arquivo PDF excede o limite máximo permitido (10 MB).' },
          { status: 413 }
        );
      }
    }

    // Download remoto de PDF protegido contra SSRF (somente HTTPS em domínios oficiais permitidos)
    if (!finalPdfBase64 && typeof pdf_url === 'string' && pdf_url.trim()) {
      const validatedUrl = isAllowedOfficialUrl(pdf_url);
      if (!validatedUrl) {
        return NextResponse.json(
          { error: 'URL do PDF rejeitada: informe apenas links HTTPS de portais oficiais (.gov.br, .leg.br ou Querido Diário).' },
          { status: 400 }
        );
      }

      try {
        const downloadRes = await fetch(validatedUrl.toString(), {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(15000),
          redirect: 'follow',
        });

        // Verifica o destino final pós-redirect para evitar bypass via open redirect
        if (downloadRes.url && !isAllowedOfficialUrl(downloadRes.url)) {
          return NextResponse.json(
            { error: 'Redirecionamento para domínio não autorizado bloqueado.' },
            { status: 400 }
          );
        }

        if (downloadRes.ok) {
          const contentLength = Number(downloadRes.headers.get('content-length') || '0');
          if (contentLength > MAX_PDF_BYTES) {
            return NextResponse.json(
              { error: 'O PDF remoto excede o tamanho máximo de 10 MB.' },
              { status: 413 }
            );
          }

          const ab = await downloadRes.arrayBuffer();
          if (ab.byteLength <= MAX_PDF_BYTES) {
            finalPdfBase64 = Buffer.from(ab).toString('base64');
          }
        }
      } catch (err) {
        console.warn('Não foi possível baixar PDF da URL remota:', err);
      }
    }

    const textoBrutoStr = typeof texto_bruto === 'string' ? texto_bruto.trim() : '';

    if (!textoBrutoStr && !finalPdfBase64) {
      return NextResponse.json(
        { error: 'Por favor, envie o texto da publicação, anexe um arquivo PDF ou informe o link oficial.' },
        { status: 400 }
      );
    }

    let municipioEfetivo = String(municipio || 'São José dos Campos');
    let fonteEfetiva = String(fonte_nome || 'Diário Oficial Municipal');
    let textoEfetivo = textoBrutoStr.slice(0, 40000);
    let textoExtraidoPdf = '';

    if (finalPdfBase64) {
      textoExtraidoPdf = extractTextFromPdfBase64(finalPdfBase64);

      if (textoExtraidoPdf) {
        const lowerPdf = textoExtraidoPdf.toLowerCase();
        const nomeLower = String(pdf_nome || '').toLowerCase();

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
          textoEfetivo = textoExtraidoPdf.slice(0, 25000);
        }
      }
    }

    if (!textoEfetivo) {
      textoEfetivo = `[Documento PDF Anexado: ${String(pdf_nome || 'diario_oficial.pdf')}]`;
    }

    const input: DiarioOficialInput = {
      texto_bruto: textoEfetivo,
      municipio: municipioEfetivo,
      estado: String(estado || 'SP'),
      data_publicacao: new Date().toLocaleDateString('pt-BR'),
      fonte_nome: fonteEfetiva,
    };

    const effectivePrompt =
      typeof customPrompt === 'string' && customPrompt.trim()
        ? `${customPrompt.trim().slice(0, 4000)}\n\nMUNICÍPIO ALVO: ${municipioEfetivo} - ${estado}\nBAIRRO OU REGIÃO PRINCIPAL: ${bairro_sugerido || 'Geral'}\n\nTEXTO/DOCUMENTO:\n${textoEfetivo}`
        : buildSummarizerPrompt(input);

    // Chave Gemini lida exclusivamente do ambiente do servidor (nunca do cliente/localStorage)
    const apiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    const geminiErrors: string[] = [];

    const extractGeminiJsonText = (geminiData: any): string | null => {
      const parts = geminiData?.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts)) return null;
      const answerParts = parts.filter((p: any) => !p?.thought && typeof p?.text === 'string');
      const raw = (answerParts.length > 0 ? answerParts : parts)
        .map((p: any) => p?.text || '')
        .join('\n')
        .trim();
      return raw || null;
    };

    const parseGeminiJsonPayload = (rawText: string): any => {
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');
        const start =
          firstBrace === -1
            ? firstBracket
            : firstBracket === -1
            ? firstBrace
            : Math.min(firstBrace, firstBracket);
        const lastBrace = cleaned.lastIndexOf('}');
        const lastBracket = cleaned.lastIndexOf(']');
        const end = Math.max(lastBrace, lastBracket);
        if (start !== -1 && end > start) {
          return JSON.parse(cleaned.slice(start, end + 1));
        }
        throw new Error('JSON não encontrado na resposta');
      }
    };

    const discoverAvailableFlashModel = async (alreadyTried: Set<string>): Promise<string[]> => {
      try {
        const listRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          headers: { 'x-goog-api-key': apiKey },
          signal: AbortSignal.timeout(8000),
        });
        if (!listRes.ok) return [];
        const listData = await listRes.json();
        const models = Array.isArray(listData?.models) ? listData.models : [];
        return models
          .filter(
            (m: any) =>
              typeof m?.name === 'string' &&
              m.name.includes('flash') &&
              Array.isArray(m.supportedGenerationMethods) &&
              m.supportedGenerationMethods.includes('generateContent')
          )
          .map((m: any) => m.name.replace(/^models\//, ''))
          .filter((name: string) => !alreadyTried.has(name))
          .slice(0, 3);
      } catch {
        return [];
      }
    };

    if (apiKey) {
      const candidateModels = Array.from(
        new Set(
          [
            (process.env.GEMINI_MODEL || '').trim(),
            'gemini-3.8-flash',
            'gemini-3.5-flash-lite',
            'gemini-flash-latest',
          ].filter(Boolean)
        )
      );

      const parts: any[] = [{ text: effectivePrompt }];

      if (finalPdfBase64) {
        const cleanBase64 = finalPdfBase64.replace(/^data:application\/pdf;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanBase64,
          },
        });
      }

      const tryModel = async (modelName: string) => {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

          const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [{ role: 'user', parts }],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            }),
            signal: AbortSignal.timeout(30000),
          });

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const rawText = extractGeminiJsonText(geminiData);

            if (rawText) {
              try {
                const parsed = parseGeminiJsonPayload(rawText);
                const rawList = Array.isArray(parsed)
                  ? parsed
                  : Array.isArray(parsed.pautas)
                  ? parsed.pautas
                  : [parsed];

                const pautasGemini: PautaIASummarized[] = rawList.map((item: any, idx: number) => ({
                  id_temp: `pauta_${Date.now()}_${idx}`,
                  titulo: item.titulo || 'ALERTA CIDADÃO: Ato Oficial',
                  resumo_ia: item.resumo_ia || item.resumo || '',
                  impacto_bairro: item.impacto_bairro || item.impacto || '',
                  vereador_proponente: item.vereador_proponente || item.autor || `Prefeitura de ${municipioEfetivo}`,
                  bairro_alvo: item.bairro_alvo || bairro_sugerido || 'Centro',
                  cidade_alvo: item.cidade_alvo || municipioEfetivo,
                  estado_alvo: item.estado_alvo || String(estado || 'SP'),
                  relevancia_score: item.relevancia_score || 85,
                  tags: Array.isArray(item.tags) ? item.tags : ['legislação'],
                  categoria: item.categoria || 'geral',
                }));

                if (pautasGemini.length > 0) {
                  return NextResponse.json({
                    success: true,
                    source: finalPdfBase64 ? `${modelName} (pdf-multimodal)` : modelName,
                    is_real_ai: true,
                    total_pautas: pautasGemini.length,
                    pautas: pautasGemini,
                    pauta: pautasGemini[0],
                  });
                }
              } catch (err) {
                geminiErrors.push(`${modelName}: JSON inválido (${rawText.slice(0, 120)})`);
                console.warn('Erro ao interpretar JSON do Gemini:', err);
              }
            } else {
              geminiErrors.push(`${modelName}: resposta sem texto`);
            }
          } else {
            const errText = await geminiRes.text();
            const detail = `${modelName} HTTP ${geminiRes.status}: ${errText.slice(0, 180)}`;
            geminiErrors.push(detail);
            console.warn('Gemini API call failed:', detail);
            if (geminiRes.status === 400 && errText.toLowerCase().includes('api key not valid')) {
              return 'INVALID_KEY' as const;
            }
          }
        } catch (geminiError: any) {
          const detail = `${modelName}: ${geminiError?.message || 'Erro de conexão'}`;
          geminiErrors.push(detail);
          console.warn('Erro ao conectar ao Gemini:', detail);
        }
        return null;
      };

      const tried = new Set<string>();
      let keyInvalid = false;

      for (const modelName of candidateModels) {
        tried.add(modelName);
        const result = await tryModel(modelName);
        if (result === 'INVALID_KEY') {
          keyInvalid = true;
          break;
        }
        if (result) return result;
      }

      if (!keyInvalid) {
        const discovered = await discoverAvailableFlashModel(tried);
        for (const modelName of discovered) {
          const result = await tryModel(modelName);
          if (result && result !== 'INVALID_KEY') return result;
        }
      }
    }

    const geminiErrorDetail = geminiErrors.length > 0 ? geminiErrors.join(' | ') : null;

    const extrairMultiplasPautas = (texto: string): PautaIASummarized[] => {
      const lower = texto.toLowerCase();
      const pautas: PautaIASummarized[] = [];

      const contratoMatch =
        texto.match(/CONTRATO\s+N[º°\\]*\s*(\d+\/\d+)[^]*?VALOR:\s*(R\$\s*[\d.,]+)/i) ||
        texto.match(/CONTRATO\s+N[º°\\]*\s*(\d+\/\d+)/i);
      const pregaoMatch = texto.match(/PREG[ÃA]O\s+ELETR[ÔO]NICO\s+N[º°\\]*\s*(\d+\/\d+)/i);
      if (contratoMatch && contratoMatch[1]) {
        const numContrato = contratoMatch[1];
        const valor = contratoMatch[2] || '';
        pautas.push({
          id_temp: `pauta_${Date.now()}_1`,
          titulo: `ALERTA DE TRANSPARÊNCIA: Homologação de Contrato nº ${numContrato}`,
          resumo_ia: `A Prefeitura de ${municipioEfetivo} publicou homologação de contrato público${pregaoMatch ? ` decorrente de Pregão Eletrônico nº ${pregaoMatch[1]}` : ''}${valor ? ` no valor total de ${valor}` : ''}.`,
          impacto_bairro: `Fiscalização dos gastos públicos municipais e aplicação da Lei Geral de Licitações.`,
          vereador_proponente: `Secretaria de Gestão Administrativa e Finanças - ${municipioEfetivo}`,
          bairro_alvo: 'Centro',
          cidade_alvo: municipioEfetivo,
          estado_alvo: String(estado || 'SP'),
          relevancia_score: 92,
          tags: ['gastos-publicos', 'licitações', 'transparência'],
          categoria: 'gastos',
        });
      }

      const portariaMatch =
        texto.match(/Portaria\s+n[º°\\]*\s*([^\s,]+)[^]*?resolve:\s*([^\n\r.]+)/i) ||
        texto.match(/Portaria\s+n[º°\\]*\s*([^\s,]+)/i);
      if (portariaMatch && portariaMatch[1]) {
        pautas.push({
          id_temp: `pauta_${Date.now()}_2`,
          titulo: `ATO DO EXECUTIVO: Portaria nº ${portariaMatch[1]}`,
          resumo_ia: `Determinação administrativa oficial da Secretaria de Governança estabelecendo diretrizes para os órgãos públicos de ${municipioEfetivo}.`,
          impacto_bairro: `Regulamentação e diretrizes dos serviços públicos municipais prestados à população.`,
          vereador_proponente: `Secretaria de Governança - ${municipioEfetivo}`,
          bairro_alvo: 'Geral / Toda a Cidade',
          cidade_alvo: municipioEfetivo,
          estado_alvo: String(estado || 'SP'),
          relevancia_score: 75,
          tags: ['governança', 'atos-oficiais', 'gestão'],
          categoria: 'governanca',
        });
      }

      if (lower.includes('ambiental') || lower.includes('manancial') || lower.includes('resíduos') || lower.includes('saneamento')) {
        pautas.push({
          id_temp: `pauta_${Date.now()}_3`,
          titulo: `MEIO AMBIENTE: Diretrizes Ambientais e Recursos Hídricos`,
          resumo_ia: `Publicação de normas e cooperação com a Agência Ambiental para preservação de bacias e áreas de mananciais em ${municipioEfetivo}.`,
          impacto_bairro: `Proteção das áreas verdes e mananciais hídricos na região da Zona Norte e distritos.`,
          vereador_proponente: `Consórcio Público Agência Ambiental do Vale do Paraíba`,
          bairro_alvo: 'Santana',
          cidade_alvo: municipioEfetivo,
          estado_alvo: String(estado || 'SP'),
          relevancia_score: 80,
          tags: ['meio-ambiente', 'sustentabilidade', 'saneamento'],
          categoria: 'obras',
        });
      }

      if (lower.includes('obra') || lower.includes('asfalto') || lower.includes('drenagem') || lower.includes('recape')) {
        pautas.push({
          id_temp: `pauta_${Date.now()}_4`,
          titulo: `ALERTA DE OBRAS: Drenagem e Pavimentação Asfáltica`,
          resumo_ia: `Abertura de edital de obras públicas para recapeamento asfáltico, contenção pluvial e intervenções viárias no município.`,
          impacto_bairro: `Intervenções na malha viária e melhorias de drenagem para prevenção de alagamentos.`,
          vereador_proponente: `Secretaria de Obras e Serviços Municipais - ${municipioEfetivo}`,
          bairro_alvo: bairro_sugerido || 'Bosque dos Eucaliptos',
          cidade_alvo: municipioEfetivo,
          estado_alvo: String(estado || 'SP'),
          relevancia_score: 88,
          tags: ['obras', 'infraestrutura', 'asfalto'],
          categoria: 'obras',
        });
      }

      if (lower.includes('transporte') || lower.includes('ônibus') || lower.includes('tarifa') || lower.includes('itinerário')) {
        pautas.push({
          id_temp: `pauta_${Date.now()}_5`,
          titulo: `TRANSPORTE PÚBLICO: Mobilidade e Linhas de Ônibus`,
          resumo_ia: `Ato oficial regulamentando horários, atendimento e diretrizes para os usuários do transporte público municipal.`,
          impacto_bairro: `Alterações de rotas e atendimento das linhas alimentadoras de bairros.`,
          vereador_proponente: `Secretaria de Mobilidade Urbana - ${municipioEfetivo}`,
          bairro_alvo: 'Urbanova',
          cidade_alvo: municipioEfetivo,
          estado_alvo: String(estado || 'SP'),
          relevancia_score: 84,
          tags: ['transporte', 'mobilidade'],
          categoria: 'transporte',
        });
      }

      if (pautas.length === 0) {
        const linhas = texto.split('\n').filter((l) => l.trim().length > 15);
        const primeiraLinha = linhas[0] || texto.slice(0, 150);
        pautas.push({
          id_temp: `pauta_${Date.now()}_0`,
          titulo: `ALERTA CIDADÃO: Legislação e Serviços`,
          resumo_ia: `Publicação oficial no Diário Municipal de ${municipioEfetivo}: ${primeiraLinha.slice(0, 120)}`,
          impacto_bairro: `Mudanças nas diretrizes municipais com impacto direto na população de ${municipioEfetivo}.`,
          vereador_proponente: `Prefeitura Municipal de ${municipioEfetivo}`,
          bairro_alvo: bairro_sugerido || 'Centro',
          cidade_alvo: municipioEfetivo,
          estado_alvo: String(estado || 'SP'),
          relevancia_score: 80,
          tags: ['legislação', 'serviços'],
          categoria: 'geral',
        });
      }

      return pautas;
    };

    const pautasHeuristicas = extrairMultiplasPautas(textoEfetivo);

    return NextResponse.json({
      success: true,
      source: 'heuristic-engine-fallback',
      is_real_ai: false,
      total_pautas: pautasHeuristicas.length,
      pautas: pautasHeuristicas,
      pauta: pautasHeuristicas[0],
      gemini_error: geminiErrorDetail,
      note: apiKey
        ? `Chave configurada no servidor, mas a chamada ao Gemini falhou (${geminiErrorDetail || 'erro desconhecido'}).`
        : 'Processado com o Extrator Local Inteligente. Para habilitar o Google Gemini Flash, configure GEMINI_API_KEY nas variáveis de ambiente do servidor.',
    });
  } catch (error: any) {
    console.error('Erro em POST /api/ia/summarize:', error?.message);
    return NextResponse.json({ error: 'Erro interno ao processar publicação.' }, { status: 500 });
  }
}
