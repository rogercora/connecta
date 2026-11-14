import React from 'react';
import Link from 'next/link';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { ConnectaLogo } from './LandingNavbar';

const COLUMNS = [
  {
    title: 'Participar',
    links: [
      { label: 'Processos ativos', href: '#processos' },
      { label: 'Como funciona', href: '#como-funciona' },
      { label: 'Cidades', href: '#cidades' },
      { label: 'Pautas de SJC', href: '/feed' },
    ],
  },
  {
    title: 'Transparência',
    links: [
      { label: 'Dados abertos (Querido Diário)', href: 'https://queridodiario.ok.org.br/', external: true },
      { label: 'Privacidade e LGPD', href: '/cadastro' },
      { label: 'Termos de uso', href: '/login' },
    ],
  },
  {
    title: 'Conta',
    links: [
      { label: 'Criar conta verificada', href: '/cadastro' },
      { label: 'Entrar', href: '/login' },
      { label: 'Instagram', href: 'https://instagram.com', external: true },
    ],
  },
];

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200 bg-[#F4F5F7]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <ConnectaLogo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-600">
              Plataforma independente de democracia participativa por CEP. Sem partido, sem verba pública, sem robôs.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="md:col-span-2 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">{col.title}</h3>
              <ul className="mt-3 space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-zinc-600 hover:text-sky-700"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : link.href.startsWith('#') ? (
                      <a href={link.href} className="text-zinc-600 hover:text-sky-700">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-zinc-600 hover:text-sky-700">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Connecta Brasil.</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Dados pessoais protegidos conforme a Lei nº 13.709/2018 (LGPD).
          </p>
        </div>
      </div>
    </footer>
  );
};
