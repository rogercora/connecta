import React from 'react';
import { ShieldCheck, Smartphone, ScanText, Activity, Lock } from 'lucide-react';

const layers = [
  {
    icon: Smartphone,
    title: 'Validação por SMS',
    description:
      'Vínculo único por linha móvel ativa para barrar cadastros automáticos em massa logo na entrada.',
  },
  {
    icon: ScanText,
    title: 'Comprovante de Residência via OCR',
    description:
      'Leitura automática que confirma o CEP do seu bairro sem expor seu endereço completo nem documento no feed.',
  },
  {
    icon: Activity,
    title: 'IA Comportamental Anti-Bot',
    description:
      'Monitoramento contínuo de anomalias para bloquear fazendas de cliques, ataques coordenados e contas descartáveis.',
  },
];

export const SecurityShieldSection: React.FC = () => {
  return (
    <section
      id="seguranca"
      className="border-t border-zinc-800/70 bg-[#09090B] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-[#121215] to-[#09090B] p-6 sm:p-10 lg:p-14">
          {/* Top ambient highlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]"
          />

          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                <span>Escudo Anti-Bot & Privacidade</span>
              </div>

              <h2 className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                1 CPF = 1 Voz.
              </h2>

              <p className="mt-4 text-base leading-relaxed text-zinc-300">
                Aqui não existe fazenda de bots nem perfil fake manipulando votação do seu bairro.
              </p>

              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Abaixos-assinados e enquetes só têm peso diante de vereadores, prefeituras e imprensa quando cada voto pertence a um morador real daquela região.
              </p>

              <div className="mt-6 inline-flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-[#09090B] px-4 py-3 text-xs text-zinc-400">
                <Lock className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  Protegido por hash criptográfico (LGPD). Seu CPF nunca é exibido publicamente.
                </span>
              </div>
            </div>

            <div className="grid gap-4 lg:col-span-7">
              {layers.map((layer, index) => {
                const Icon = layer.icon;
                return (
                  <div
                    key={layer.title}
                    className="flex items-start gap-4 rounded-2xl border border-zinc-800/90 bg-[#09090B]/80 p-5 transition-colors hover:border-emerald-500/30"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90">
                          Camada 0{index + 1}
                        </span>
                      </div>
                      <h3 className="font-display mt-0.5 text-base font-bold text-white sm:text-lg">
                        {layer.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                        {layer.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

