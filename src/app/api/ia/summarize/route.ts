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
      pdf_url,
      pdf_nome,
      municipio = 'São José dos Campos',
      estado = 'SP',
      bairro_sugerido,
      fonte_nome = 'Diário Oficial Municipal',
      apiKey: userApiKey,
      customPrompt,
    } = body;

    let finalPdfBase64 = pdf_base64;

    // Se veio uma URL de PDF (como as edições da API oficial de SJC), baixa o buffer do PDF
    if (!finalPdfBase64 && pdf_url) {
      try {
        const downloadRes = await fetch(pdf_url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        if (downloadRes.ok) {
          const ab = await downloadRes.arrayBuffer();
          finalPdfBase64 = Buffer.from(ab).toString('base64');
        }
      } catch (err) {
        console.warn('Não foi possível baixar PDF da URL remota:', err);
      }
    }

    // Se não veio texto nem PDF
    if (!texto_bruto?.trim() && !finalPdfBase64) {
      return NextResponse.json(
        { error: 'Por favor, envie o texto da publicação, anexe um arquivo PDF ou informe o link da edição.' },
        { status: 400 }
      );
    }

    let municipioEfetivo = municipio;
    let fonteEfetiva = fonte_nome;
    let textoEfetivo = texto_bruto?.trim() || '';
    let textoExtraidoPdf = '';

    // Extração de texto do PDF caso tenha sido enviado arquivo
    if (finalPdfBase64) {
      textoExtraidoPdf = extractTextFromPdfBase64(finalPdfBase64);

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
          textoEfetivo = textoExtraidoPdf.slice(0, 25000);
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

        // Se temos o arquivo PDF em base64, adiciona como parte multimodal nativa do Gemini
        if (finalPdfBase64) {
          const cleanBase64 = finalPdfBase64.replace(/^data:application\/pdf;base64,/, '');
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
            let pautasGemini: PautaIASummarized[] = [];
            try {
              const parsed = JSON.parse(rawText);
              const rawList = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed.pautas)
                ? parsed.pautas
                : [parsed];

              pautasGemini = rawList.map((item: any, idx: number) => ({
                id_temp: `pauta_${Date.now()}_${idx}`,
                titulo: item.titulo || 'ALERTA CIDADÃO: Ato Oficial',
                resumo_ia: item.resumo_ia || item.resumo || '',
                impacto_bairro: item.impacto_bairro || item.impacto || '',
                vereador_proponente: item.vereador_proponente || item.autor || `Prefeitura de ${municipioEfetivo}`,
                bairro_alvo: item.bairro_alvo || bairro_sugerido || 'Centro',
                cidade_alvo: item.cidade_alvo || municipioEfetivo,
                estado_alvo: item.estado_alvo || estado,
                relevancia_score: item.relevancia_score || 85,
                tags: Array.isArray(item.tags) ? item.tags : ['legislação'],
                categoria: item.categoria || 'geral',
              }));
            } catch (err) {
              console.warn('Erro ao interpretar JSON do Gemini:', err);
            }

            if (pautasGemini.length > 0) {
              return NextResponse.json({
                success: true,
                source: finalPdfBase64 ? 'gemini-1.5-flash (pdf-multimodal)' : 'gemini-1.5-flash',
                is_real_ai: true,
                total_pautas: pautasGemini.length,
                pautas: pautasGemini,
                pauta: pautasGemini[0],
                prompt_used: effectivePrompt,
              });
            }
          }
        } else {
          const errText = await geminiRes.text();
          console.warn('Gemini API call failed, falling back to heuristic engine:', errText);
        }
      } catch (geminiError: any) {
        console.warn('Erro ao conectar ao Gemini, usando motor heurístico local:', geminiError.message);
      }
    }

    // Motor Heurístico Resiliente Multi-Pautas (para quando não há chave configurada ou modo offline)
    const extrairMultiplasPautas = (texto: string): PautaIASummarized[] => {
      const lower = texto.toLowerCase();
      const pautas: PautaIASummarized[] = [];

      // 1. Contratos Públicos e Gastos
      const contratoMatch = texto.match(/CONTRATO\s+N[º°\\]*\s*(\d+\/\d+)[^]*?VALOR:\s*(R\$\s*[\d.,]+)/i) ||
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
          estado_alvo: estado,
          relevancia_score: 92,
          tags: ['gastos-publicos', 'licitações', 'transparência'],
          categoria: 'gastos',
        });
      }

      // 2. Portarias do Executivo / Governança
      const portariaMatch = texto.match(/Portaria\s+n[º°\\]*\s*([^\s,]+)[^]*?resolve:\s*([^\n\r.]+)/i) ||
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
          estado_alvo: estado,
          relevancia_score: 75,
          tags: ['governança', 'atos-oficiais', 'gestão'],
          categoria: 'governanca',
        });
      }

      // 3. Meio Ambiente / Saneamento / Recursos Hídricos
      if (lower.includes('ambiental') || lower.includes('manancial') || lower.includes('resíduos') || lower.includes('saneamento')) {
        pautas.push({
          id_temp: `pauta_${Date.now()}_3`,
          titulo: `MEIO AMBIENTE: Diretrizes Ambientais e Recursos Hídricos`,
          resumo_ia: `Publicação de normas e cooperação com a Agência Ambiental para preservação de bacias e áreas de mananciais em ${municipioEfetivo}.`,
          impacto_bairro: `Proteção das áreas verdes e mananciais hídricos na região da Zona Norte e distritos.`,
          vereador_proponente: `Consórcio Público Agência Ambiental do Vale do Paraíba`,
          bairro_alvo: 'Santana',
          cidade_alvo: municipioEfetivo,
          estado_alvo: estado,
          relevancia_score: 80,
          tags: ['meio-ambiente', 'sustentabilidade', 'saneamento'],
          categoria: 'obras',
        });
      }

      // 4. Obras Viárias, Drenagem ou Pavimentação
      if (lower.includes('obra') || lower.includes('asfalto') || lower.includes('drenagem') || lower.includes('recape')) {
        pautas.push({
          id_temp: `pauta_${Date.now()}_4`,
          titulo: `ALERTA DE OBRAS: Drenagem e Pavimentação Asfáltica`,
          resumo_ia: `Abertura de edital de obras públicas para recapeamento asfáltico, contenção pluvial e intervenções viárias no município.`,
          impacto_bairro: `Intervenções na malha viária e melhorias de drenagem para prevenção de alagamentos.`,
          vereador_proponente: `Secretaria de Obras e Serviços Municipais - ${municipioEfetivo}`,
          bairro_alvo: bairro_sugerido || 'Bosque dos Eucaliptos',
          cidade_alvo: municipioEfetivo,
          estado_alvo: estado,
          relevancia_score: 88,
          tags: ['obras', 'infraestrutura', 'asfalto'],
          categoria: 'obras',
        });
      }

      // 5. Transporte ou Mobilidade
      if (lower.includes('transporte') || lower.includes('ônibus') || lower.includes('tarifa') || lower.includes('itinerário')) {
        pautas.push({
          id_temp: `pauta_${Date.now()}_5`,
          titulo: `TRANSPORTE PÚBLICO: Mobilidade e Linhas de Ônibus`,
          resumo_ia: `Ato oficial regulamentando horários, atendimento e diretrizes para os usuários do transporte público municipal.`,
          impacto_bairro: `Alterações de rotas e atendimento das linhas alimentadoras de bairros.`,
          vereador_proponente: `Secretaria de Mobilidade Urbana - ${municipioEfetivo}`,
          bairro_alvo: 'Urbanova',
          cidade_alvo: municipioEfetivo,
          estado_alvo: estado,
          relevancia_score: 84,
          tags: ['transporte', 'mobilidade'],
          categoria: 'transporte',
        });
      }

      // Se nenhum dos blocos acima bateu, gera 1 pauta geral padrão
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
          estado_alvo: estado,
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
      prompt_used: effectivePrompt,
      note: apiKey
        ? 'Chave configurada, mas respondeu com motor de contingência.'
        : 'Processado com o Extrator Local Inteligente. Para habilitar o modelo Google Gemini 1.5 Flash completo, informe sua chave GEMINI_API_KEY na Aba 4.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
