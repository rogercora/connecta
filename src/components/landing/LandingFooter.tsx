import React from 'react';
import Link from 'next/link';
import { ExternalLink, ShieldCheck, HeartHandshake } from 'lucide-react';

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
    <footer className="border-t border-earth-800 bg-earth-900 text-cream-200">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <span className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-terracotta-500 text-white shadow-xs">
                <HeartHandshake className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-extrabold tracking-tight text-white">
                Connecta <span className="text-terracotta-400">Brasil</span>
              </span>
            </span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-300">
              Plataforma cívica e comunitária independente. Sem vínculo partidário, sem verba pública e 100% voltada ao fortalecimento dos bairros e cidadãos reais.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="md:col-span-2 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cream-400">
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
                        className="inline-flex items-center gap-1 text-cream-300 transition-colors hover:text-white"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : link.href.startsWith('#') ? (
                      <a href={link.href} className="text-cream-300 transition-colors hover:text-white">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-cream-300 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-earth-800 pt-6 text-xs text-cream-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Connecta Brasil. Construído com a vizinhança.</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-sage-400" />
            Dados pessoais protegidos conforme a Lei Geral de Proteção de Dados (LGPD).
          </p>
        </div>
      </div>
    </footer>
  );
};
