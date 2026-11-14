import { NextResponse } from 'next/server';
import { buildSummarizerPrompt, DiarioOficialInput, PautaIASummarized, SYSTEM_SUMMARIZER_PROMPT } from '@/prompts/summarizer';

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

    const textoEfetivo = texto_bruto?.trim() || `[Documento PDF Anexado: ${pdf_nome || 'diario_oficial.pdf'}]`;

    const input: DiarioOficialInput = {
      texto_bruto: textoEfetivo,
      municipio,
      estado,
      data_publicacao: new Date().toLocaleDateString('pt-BR'),
      fonte_nome: fonte_nome || `Diário Oficial de ${municipio}`,
    };

    const effectivePrompt = customPrompt
      ? `${customPrompt}\n\nMUNICÍPIO ALVO: ${municipio} - ${estado}\nBAIRRO OU REGIÃO PRINCIPAL: ${bairro_sugerido || 'Geral'}\n\nTEXTO/DOCUMENTO:\n${textoEfetivo}`
      : buildSummarizerPrompt(input);

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    // Se temos uma chave de API do Gemini, faz a chamada real (inclusive multimodal com PDF)
    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const parts: any[] = [{ text: effectivePrompt }];

        // Se veio arquivo PDF em base64, adiciona como parte multimodal nativa do Gemini
        if (pdf_base64) {
          // Remove prefixo data:application/pdf;base64, se houver
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
              pauta: {
                ...parsed,
                bairro_alvo: bairro_sugerido || parsed.bairro_alvo || 'Centro',
                cidade_alvo: parsed.cidade_alvo || municipio,
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
        else if (lower.includes('vila emma') || lower.includes('vl emma')) bairro = 'Vila Ema';
        else if (lower.includes('satélite') || lower.includes('satelite')) bairro = 'Jardim Satélite';
        else if (lower.includes('bosque')) bairro = 'Bosque dos Eucaliptos';
        else if (lower.includes('aquárius') || lower.includes('aquarius')) bairro = 'Jardim Aquárius';
        else if (lower.includes('meia lua') || lower.includes('parque meia lua')) bairro = 'Parque Meia Lua';
        else if (lower.includes('esperança')) bairro = 'Jardim Esperança';
        else if (lower.includes('centro')) bairro = 'Centro';
      }

      // Proponente
      let proponente = `Prefeitura Municipal de ${municipio}`;
      const autorMatch = texto.match(/(?:vereador|ver\.|autor|proponente|prefeito)\s+([A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõ]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõ]+){1,3})/i);
      if (autorMatch && autorMatch[1]) {
        proponente = `Vereador ${autorMatch[1].trim()}`;
      } else if (lower.includes('câmara') || lower.includes('camara') || lower.includes('legislativo')) {
        proponente = `Câmara Municipal de ${municipio}`;
      }

      // Tags e Temas
      const tags: string[] = [];
      let tema = 'Legislação e Serviços';
      let impacto = `Mudanças nas diretrizes municipais com impacto direto na população de ${municipio}.`;

      if (lower.includes('obra') || lower.includes('asfalto') || lower.includes('paviment') || lower.includes('recape')) {
        tags.push('obras', 'infraestrutura');
        tema = 'Obras e Infraestrutura Viária';
        impacto = `Intervenções viárias e melhorias de pavimentação previstas para a região do ${bairro}.`;
      } else if (lower.includes('tarifa') || lower.includes('ônibus') || lower.includes('onibus') || lower.includes('transporte') || lower.includes('passe')) {
        tags.push('transporte', 'mobilidade');
        tema = 'Transporte e Mobilidade Urbana';
        impacto = `Alteração nos valores de tarifas ou itinerários de linhas que atendem os moradores do ${bairro}.`;
      } else if (lower.includes('zoneamento') || lower.includes('comercial') || lower.includes('residencial') || lower.includes('loteamento')) {
        tags.push('zoneamento', 'urbanismo');
        tema = 'Zoneamento e Uso do Solo';
        impacto = `Regras de construção e impacto no fluxo de trânsito e vizinhança no ${bairro}.`;
      } else if (lower.includes('iptu') || lower.includes('imposto') || lower.includes('taxa') || lower.includes('tribut')) {
        tags.push('tributos', 'finanças');
        tema = 'Tributação Municipal';
        impacto = 'Ajuste nos valores de tributos e taxas municipais aplicadas aos imóveis do município.';
      } else if (lower.includes('saúde') || lower.includes('saude') || lower.includes('ubs') || lower.includes('posto')) {
        tags.push('saúde', 'serviços');
        tema = 'Saúde e Atendimento Público';
        impacto = `Ampliação ou remanejamento de atendimentos nas unidades de saúde do ${bairro}.`;
      } else {
        tags.push('legislação', 'serviços');
      }

      // Sintetiza resumo simples
      const linhas = texto.split('\n').filter((l) => l.trim().length > 15);
      const primeiraLinha = linhas[0] || texto.slice(0, 150);
      const resumoCurto = primeiraLinha.length > 130 ? `${primeiraLinha.slice(0, 127)}...` : primeiraLinha;

      return {
        titulo: `ALERTA DE IA: ${tema}`,
        resumo_ia: `Ato oficial publicado: ${resumoCurto.replace(/^(artigo|art\.|parágrafo|decreto|edital)\s+/i, '')}`,
        impacto_bairro: impacto,
        vereador_proponente: proponente,
        bairro_alvo: bairro,
        cidade_alvo: municipio,
        estado_alvo: estado,
        relevancia_score: 85,
        tags,
      };
    };

    const pautaHeuristica = extrairInfo(textoEfetivo);

    return NextResponse.json({
      success: true,
      source: 'heuristic-engine-fallback',
      pauta: pautaHeuristica,
      prompt_used: effectivePrompt,
      note: apiKey
        ? 'Chave configurada, mas respondeu com motor de contingência.'
        : 'Processado com motor heurístico local. Para usar o modelo Gemini Flash completo em produção, informe sua GEMINI_API_KEY no painel de configurações.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
