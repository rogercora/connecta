import React from 'react';
import Link from 'next/link';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { ConectaBrLogo } from './LandingNavbar';

const COLUMNS = [
  {
    title: 'Mobilização',
    links: [
      { label: 'Causas no Bairro', href: '#processos' },
      { label: 'Como Funciona', href: '#como-funciona' },
      { label: 'Cidades em Expansão', href: '#cidades' },
      { label: 'Feed Oficial de SJC', href: '/feed' },
    ],
  },
  {
    title: 'Transparência & Dados',
    links: [
      { label: 'Dados Abertos (Querido Diário)', href: 'https://queridodiario.ok.org.br/', external: true },
      { label: 'Privacidade e LGPD', href: '/cadastro' },
      { label: 'Termos de Participação', href: '/login' },
    ],
  },
  {
    title: 'Cidadão',
    links: [
      { label: 'Criar Conta Verificada', href: '/cadastro' },
      { label: 'Acessar Conta', href: '/login' },
      { label: 'Comunidade no Instagram', href: 'https://instagram.com', external: true },
    ],
  },
];

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <ConectaBrLogo inverted />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
              Plataforma de inteligência cívica e poder comunitário por CEP. Sem vínculo partidário, sem verba pública e 100% voltada ao fortalecimento da sua rua perante a Câmara e Prefeitura.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="md:col-span-2 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {col.title}
              </h3>
              <ul className="mt-3.5 space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-white"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : link.href.startsWith('#') ? (
                      <a href={link.href} className="text-zinc-400 transition-colors hover:text-white">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-zinc-400 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-zinc-900 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ConectaBr. A sua rua decide.</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-crimson-500" />
            Dados pessoais protegidos conforme a Lei Geral de Proteção de Dados (LGPD).
          </p>
        </div>
      </div>
    </footer>
  );
};
