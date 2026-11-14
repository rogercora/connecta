import React from 'react';
import Link from 'next/link';
import { Radio, Database, Shield, ExternalLink } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-zinc-800/80 bg-[#09090B] py-14 text-sm text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2.5 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                <Radio className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight">
                Connecta
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-zinc-400 sm:text-sm">
              Plataforma independente de inteligência cívica e participação geolocalizada por CEP. Sem partidos, sem verba pública e sem bots.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-[#121215] px-3 py-1.5 text-xs text-zinc-300">
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              <span>Dados Abertos & Querido Diário</span>
            </div>
          </div>

          {/* Plataforma */}
          <div className="md:col-span-2">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Plataforma
            </h4>
            <ul className="mt-3 space-y-2.5 text-xs sm:text-sm">
              <li>
                <a href="#como-funciona" className="hover:text-white transition-colors">
                  Como Funciona
                </a>
              </li>
              <li>
                <a href="#seguranca" className="hover:text-white transition-colors">
                  Por que é Seguro
                </a>
              </li>
              <li>
                <a href="#cidades" className="hover:text-white transition-colors">
                  Ranking de Cidades
                </a>
              </li>
              <li>
                <Link href="/feed" className="hover:text-white transition-colors">
                  Feed Público (SJC)
                </Link>
              </li>
            </ul>
          </div>

          {/* Transparência & LGPD */}
          <div className="md:col-span-3">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Transparência & LGPD
            </h4>
            <ul className="mt-3 space-y-2.5 text-xs sm:text-sm">
              <li>
                <a
                  href="https://queridodiario.ok.org.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>Manifesto Dados Abertos</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <Link href="/cadastro" className="hover:text-white transition-colors">
                  Política de Privacidade (LGPD)
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Termos de Uso & Moderação
                </Link>
              </li>
            </ul>
          </div>

          {/* Comunidade */}
          <div className="md:col-span-2">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Redes & Acesso
            </h4>
            <ul className="mt-3 space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/cadastro" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  Verificar meu CEP
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Entrar na conta
                </Link>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  X (Twitter)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-zinc-800/80 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Connecta Cidadania. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Identidade protegida conforme Lei nº 13.709/2018 (LGPD).</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

