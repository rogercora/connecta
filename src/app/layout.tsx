import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'ConectaBr — A sua rua decide',
  description:
    'Inteligência cívica por CEP, Diário Oficial traduzido por IA e mobilização comunitária para transformar o seu bairro.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-white font-sans antialiased text-zinc-950 selection:bg-crimson-100 selection:text-crimson-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
