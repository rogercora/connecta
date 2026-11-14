import React from 'react';
import { FileText, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export const BeforeAfterSection: React.FC = () => {
  return (
    <section
      id="como-funciona"
      className="border-t border-zinc-800/70 bg-[#09090B] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Antes vs. Depois
          </span>
          <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Do juridiquês ilegível para o que realmente afeta sua rotina
          </h2>
          <p className="mt-3 text-base text-zinc-400">
            Prefeituras e Câmaras publicam decisões em PDFs gigantes e técnicos de propósito. Nossa IA lê cada página, filtra por bairro e traduz na hora.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Lado Esquerdo: O Caos Atual */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#121215]/70 p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    O Caos Atual
                  </p>
                  <p className="text-sm font-semibold text-zinc-300">
                    Diário Oficial • PDF de 84 páginas
                  </p>
                </div>
              </div>
              <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-500">
                18 min de leitura
              </span>
            </div>

            <div className="space-y-3 rounded-xl border border-zinc-800/80 bg-[#09090B] p-4 font-mono text-xs leading-relaxed text-zinc-500 sm:p-5 sm:text-[13px]">
              <p className="font-semibold text-zinc-400">
                DECRETO Nº 19.482, DE 14 DE OUTUBRO DE 2026.
              </p>
              <p>
                CONSIDERANDO o Decreto nº 19.482 e o disposto no art. 24, inciso II, da Lei Federal nº 9.503/97, bem como o remanejamento de dotações orçamentárias constantes do Anexo III da Lei Orçamentária Anual vigente;
              </p>
              <p>
                DECRETA: Art. 1º Fica instituída a readequação geométrica de fluxo unidirecional e implantação de faixa exclusiva cicloviária no trecho compreendido entre os lotes 1200 e 2400 da Av. Andrômeda, ficando sujeitos às penalidades do CTB após decurso de prazo educativo...
              </p>
              <p className="select-none blur-[2px]">
                Art. 2º As despesas decorrentes da execução deste Decreto correrão à conta de dotações próprias consignadas no orçamento vigente, suplementadas se necessário...
              </p>
            </div>
          </div>

          {/* Lado Direito: No Connecta */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#121215] p-6 shadow-[0_0_50px_-15px_rgba(16,185,129,0.2)] sm:p-8">
            <div className="mb-5 flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    No Connecta
                  </p>
                  <p className="text-sm font-semibold text-white">
                    Alerta Traduzido pela IA • Jardim Satélite
                  </p>
                </div>
              </div>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                Lido em 3s
              </span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-[#09090B]/90 p-5">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                Impacto no Bairro
              </div>

              <h3 className="font-display text-lg font-bold text-white sm:text-xl">
                O que muda no seu bolso e no seu trajeto
              </h3>

              <ul className="mt-4 space-y-3.5 text-sm text-zinc-300">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <span>
                    <strong className="text-white">Trânsito alterado:</strong> trecho da Av. Andrômeda (nº 1200 ao 2400) vira mão única já nesta segunda-feira às 06h, com nova ciclofaixa lateral.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <span>
                    <strong className="text-white">Multas e prazo:</strong> os primeiros 15 dias serão apenas educativos — sem multa no bolso até o dia 30.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <span>
                    <strong className="text-white">Quanto vai custar:</strong> R$ 2,4 milhões remanejados para pintura, tachões e semáforos de ciclistas.
                  </span>
                </li>
              </ul>

              <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3.5 text-xs text-zinc-400">
                <span>Fonte: Decreto nº 19.482 (verificado)</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                  Pronto para votar <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

