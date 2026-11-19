import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { requireAdminUser } from '@/lib/auth/serverAuth';
import { SYSTEM_SUMMARIZER_PROMPT } from '@/prompts/summarizer';

const ALLOWED_SJC_HOST = 'diariodomunicipio.sjc.sp.gov.br';
const MAX_PDF_BYTES = 12 * 1024 * 1024;

function isSafeSjcPdfUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && u.hostname.toLowerCase() === ALLOWED_SJC_HOST;
  } catch {
    return false;
  }
}

function extractReadableLinesFromPdfBuffer(buf: Buffer): string {
  const latin = buf.toString('latin1');
  const matches = latin.match(/\(([A-Za-zÀ-ÿ0-9\s.,;:/\-R$%º°ª()]{8,220})\)/g) || [];
  const cleaned = matches
    .map((m) => m.slice(1, -1).replace(/\s+/g, ' ').trim())
    .filter((line) => /[aeiouáéíóúãõâêîôû]/i.test(line));
  return cleaned.slice(0, 120).join('\n');
}

interface ExtractedMateria {
  titulo: string;
  resumo_ia: string;
  impacto_bairro: string;
  vereador_proponente: string;
  bairro_alvo: string;
  categoria?: string;
}

async function extrairPautasReaisComGemini(
  pdfBuffer: Buffer,
  edicaoNumero: string | number,
  dataEdicao: string
): Promise<{ pautas: ExtractedMateria[]; modeloUsado: string }> {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return { pautas: [], modeloUsado: 'sem_chave_gemini' };
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

  const userPrompt = [
    `Analise o PDF oficial anexo (Diário Oficial de São José dos Campos - Edição nº ${edicaoNumero}, data ${dataEdicao}).`,
    `Extraia até 4 matérias de impacto direto para os moradores (obras, mobilidade, saúde, educação, contratos públicos relevantes, audiências, alterações de zoneamento). Ignore atos rotineiros de RH (férias, licenças, substituições simples).`,
    `Retorne exclusivamente JSON válido no formato:`,
    `{`,
    `  "pautas": [`,
    `    {`,
    `      "titulo": "título curto e objetivo",`,
    `      "resumo_ia": "resumo em linguagem cidadã clara (2 a 3 frases)",`,
    `      "impacto_bairro": "como isso afeta moradores, serviços ou orçamento local",`,
    `      "vereador_proponente": "Secretaria ou Vereador/Órgão responsável",`,
    `      "bairro_alvo": "bairro específico citado ou Toda a Cidade",`,
    `      "categoria": "mobilidade | saude | educacao | obras | orcamento | meio_ambiente | geral"`,
    `    }`,
    `  ]`,
    `}`,
  ].join('\n');

  const pdfBase64 = pdfBuffer.toString('base64');

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_SUMMARIZER_PROMPT }] },
            contents: [
              {
                role: 'user',
                parts: [
                  { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
                  { text: userPrompt },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(35000),
        }
      );

      if (!response.ok) continue;
      const json = await response.json();
      const parts = json?.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find((p: any) => !p?.thought && typeof p?.text === 'string')?.text || '';
      if (!textPart) continue;

      const cleaned = textPart.replace(/```json|```/gi, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      const jsonSlice =
        firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;
      const parsed = JSON.parse(jsonSlice);
      const list = Array.isArray(parsed?.pautas) ? parsed.pautas : [];

      const sanitized: ExtractedMateria[] = list
        .filter((item: any) => item && typeof item.titulo === 'string' && typeof item.resumo_ia === 'string')
        .slice(0, 4)
        .map((item: any) => ({
          titulo: String(item.titulo).trim().slice(0, 260),
          resumo_ia: String(item.resumo_ia).trim().slice(0, 1800),
          impacto_bairro: String(item.impacto_bairro || 'Acompanhamento cívico municipal.').trim().slice(0, 900),
          vereador_proponente: String(item.vereador_proponente || 'Prefeitura / Câmara de SJC').trim().slice(0, 180),
          bairro_alvo: String(item.bairro_alvo || 'Centro').trim().slice(0, 100),
          categoria: String(item.categoria || 'geral').trim().slice(0, 50),
        }));

      if (sanitized.length > 0) {
        return { pautas: sanitized, modeloUsado: model };
      }
    } catch {
      // Tenta próximo modelo Flash disponível
    }
  }

  return { pautas: [], modeloUsado: 'fallback_heuristico' };
}

async function executarRotinaCron(origem: 'vercel_cron' | 'manual_admin') {
  const timestampInicio = new Date().toISOString();
  const logs: string[] = [];
  logs.push(`[${timestampInicio}] Iniciando coleta real do Diário Oficial de São José dos Campos.`);

  const supabaseAdmin = getSupabaseAdmin();
  let edicoesReais: any[] = [];

  try {
    const response = await fetch(`https://${ALLOWED_SJC_HOST}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const html = await response.text();
      const match = html.match(/let DADOS_ULTIMAS_EDICOES = (\{.*?\});/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        edicoesReais = (parsed.itens || []).slice(0, 5);
        logs.push(`Encontradas ${edicoesReais.length} edições no portal oficial da Prefeitura.`);
      }
    } else {
      logs.push(`Portal SJC respondeu HTTP ${response.status}.`);
    }
  } catch (err: any) {
    logs.push(`Falha ao acessar o portal oficial de SJC: ${err.message}.`);
  }

  if (edicoesReais.length === 0) {
    return {
      success: false,
      origem,
      timestamp: timestampInicio,
      edicao_numero: null,
      data_edicao: null,
      ja_processada: false,
      novas_pautas_publicadas: 0,
      pautas: [],
      logs: [...logs, 'Nenhuma edição real localizada no portal no momento.'],
    };
  }

  const edicaoMaisRecente = edicoesReais[0];
  const edicaoNum = String(edicaoMaisRecente.numero || edicaoMaisRecente.id);
  const fonteDiarioNome = `Diário Oficial de SJC - Ed. ${edicaoNum}`;
  const pdfUrl =
    edicaoMaisRecente.download_url ||
    `https://${ALLOWED_SJC_HOST}/portal/edicoes/download/${edicaoMaisRecente.id}`;

  let jaProcessada = false;
  try {
    const { data: existentes } = await supabaseAdmin
      .from('pautas_ia')
      .select('id, fonte_diario')
      .or(`edicao_diario.eq.${edicaoNum},fonte_diario.ilike.%Ed. ${edicaoNum}%`)
      .limit(1);

    if (existentes && existentes.length > 0) {
      jaProcessada = true;
      logs.push(`Edição nº ${edicaoNum} já processada anteriormente.`);
    }
  } catch (err: any) {
    logs.push(`Aviso ao checar deduplicação: ${err.message}`);
  }

  const pautasInseridas: any[] = [];

  if (!jaProcessada) {
    if (!isSafeSjcPdfUrl(pdfUrl)) {
      logs.push(`URL de PDF bloqueada pela política SSRF: ${pdfUrl}`);
    } else {
      try {
        const pdfRes = await fetch(pdfUrl, {
          headers: { 'User-Agent': 'ConectaBrBot/1.0 (+https://connectabrasil.vercel.app)' },
          redirect: 'follow',
          signal: AbortSignal.timeout(20000),
        });

        if (!pdfRes.ok || !isSafeSjcPdfUrl(pdfRes.url)) {
          logs.push(`Não foi possível baixar o PDF oficial (HTTP ${pdfRes.status}).`);
        } else {
          const arrayBuf = await pdfRes.arrayBuffer();
          if (arrayBuf.byteLength > MAX_PDF_BYTES) {
            logs.push(`PDF da edição excede 12 MB (${arrayBuf.byteLength} bytes).`);
          } else {
            const pdfBuffer = Buffer.from(arrayBuf);
            logs.push(`PDF oficial baixado (${Math.round(pdfBuffer.byteLength / 1024)} KB). Extraindo com IA...`);

            const { pautas: extraidas, modeloUsado } = await extrairPautasReaisComGemini(
              pdfBuffer,
              edicaoNum,
              String(edicaoMaisRecente.data || '')
            );
            logs.push(`Motor de extração: ${modeloUsado} (${extraidas.length} pautas relevantes).`);

            let materiasFinais = extraidas;
            if (materiasFinais.length === 0) {
              const snippet = extractReadableLinesFromPdfBuffer(pdfBuffer).slice(0, 600);
              if (snippet.length > 40) {
                materiasFinais = [
                  {
                    titulo: `Revisar Edição nº ${edicaoNum} do Diário Oficial de SJC`,
                    resumo_ia: `Texto extraído automaticamente para curadoria: ${snippet}`,
                    impacto_bairro: 'Verificação manual recomendada antes de abrir para votos.',
                    vereador_proponente: 'Diário Oficial de São José dos Campos',
                    bairro_alvo: 'Centro',
                    categoria: 'geral',
                  },
                ];
              }
            }

            for (const mat of materiasFinais) {
              const basePayload = {
                titulo: mat.titulo,
                resumo_ia: mat.resumo_ia,
                impacto_bairro: mat.impacto_bairro,
                vereador_proponente: mat.vereador_proponente,
                bairro_alvo: mat.bairro_alvo,
                cidade_alvo: 'São José dos Campos',
                estado_alvo: 'SP',
                cep_alvo: '12246-021',
                link_pdf_original: pdfUrl,
                fonte_diario: fonteDiarioNome,
                categoria: mat.categoria || 'geral',
                edicao_diario: edicaoNum,
                status: 'pendente_revisao',
                data_votacao: new Date(Date.now() + 86400000 * 3).toISOString(),
                votos_concordar: 0,
                votos_discordar: 0,
              };

              let insertRes = await supabaseAdmin
                .from('pautas_ia')
                .insert([basePayload])
                .select()
                .single();

              // Fallback se coluna edicao_diario ou status 'pendente_revisao' ainda dependerem da migration Sprint 2
              if (insertRes.error) {
                const fallbackPayload = {
                  titulo: mat.titulo,
                  resumo_ia: mat.resumo_ia,
                  impacto_bairro: mat.impacto_bairro,
                  vereador_proponente: mat.vereador_proponente,
                  bairro_alvo: mat.bairro_alvo,
                  cidade_alvo: 'São José dos Campos',
                  estado_alvo: 'SP',
                  cep_alvo: '12246-021',
                  link_pdf_original: pdfUrl,
                  fonte_diario: fonteDiarioNome,
                  status: 'ativa',
                  data_votacao: basePayload.data_votacao,
                  votos_concordar: 0,
                  votos_discordar: 0,
                };
                insertRes = await supabaseAdmin
                  .from('pautas_ia')
                  .insert([fallbackPayload])
                  .select()
                  .single();
              }

              if (!insertRes.error && insertRes.data) {
                pautasInseridas.push(insertRes.data);
              } else if (insertRes.error) {
                logs.push(`Erro ao salvar matéria "${mat.titulo}": ${insertRes.error.message}`);
              }
            }
          }
        }
      } catch (dlErr: any) {
        logs.push(`Erro ao baixar/processar PDF: ${dlErr.message}`);
      }
    }
  }

  return {
    success: true,
    origem,
    timestamp: new Date().toISOString(),
    edicao_numero: edicaoMaisRecente.numero,
    data_edicao: edicaoMaisRecente.data,
    ja_processada: jaProcessada,
    novas_pautas_publicadas: pautasInseridas.length,
    pautas: pautasInseridas,
    logs,
  };
}

function hasValidCronSecret(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: Request) {
  if (!hasValidCronSecret(req)) {
    return NextResponse.json(
      { error: 'Não autorizado. Endpoint exclusivo do Vercel Cron.' },
      { status: 401 }
    );
  }

  try {
    const resultado = await executarRotinaCron('vercel_cron');
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno no Cron' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  let authorized = hasValidCronSecret(req);
  if (!authorized) {
    const adminAuth = await requireAdminUser();
    if (!adminAuth.ok) return adminAuth.response;
    authorized = true;
  }

  try {
    const resultado = await executarRotinaCron('manual_admin');
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao executar rotina manual do Cron' },
      { status: 500 }
    );
  }
}
