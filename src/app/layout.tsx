import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner';

export const metadata: Metadata = {
  title: 'ConectaBr — A sua rua decide',
  description:
    'Inteligência cívica por CEP, Diário Oficial traduzido por IA e mobilização comunitária para transformar o seu bairro.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ConectaBr',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#E11D48',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-white font-sans antialiased text-zinc-950 selection:bg-crimson-100 selection:text-crimson-900">
        <Providers>
          {children}
          <InstallPromptBanner />
        </Providers>
      </body>
    </html>
  );
}
