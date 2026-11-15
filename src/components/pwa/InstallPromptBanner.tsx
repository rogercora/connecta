'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Check } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Verifica se já está rodando como app instalado (standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // 2. Verifica se o usuário dispensou recentemente (últimos 3 dias)
    const dismissedAt = localStorage.getItem('conectabr_pwa_dismissed');
    if (dismissedAt) {
      const diffDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (diffDays < 3) return;
    }

    // 3. Detecta iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // No iOS, se não for standalone, exibe após 3 segundos de navegação
    if (isIosDevice) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // 4. No Android/Chrome, escuta o evento nativo beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('conectabr_pwa_dismissed', Date.now().toString());
  };

  if (!showBanner || installed) return null;

  return (
    <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-fadeIn">
      <div className="bg-zinc-950 text-white rounded-2xl p-3.5 shadow-2xl border border-zinc-800 flex flex-col space-y-3">
        {/* Banner Top */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5 border border-zinc-700 shrink-0">
              <Image
                src="/icons/icon-192.png"
                alt="ConectaBr App"
                fill
                className="object-contain p-1"
              />
            </div>
            <div>
              <h4 className="text-xs font-black text-white leading-tight">
                Instalar o ConectaBr
              </h4>
              <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                Abra em tela cheia direto do seu celular, sem precisar da loja.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dispensar"
            className="text-zinc-500 hover:text-zinc-300 p-1 -mr-1 -mt-1 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Guia interativo para iOS (Safari) */}
        {showIOSGuide && isIOS ? (
          <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] space-y-2 text-zinc-300">
            <p className="font-bold text-white text-xs">Como instalar no iPhone:</p>
            <ol className="space-y-1.5 pl-4 list-decimal">
              <li className="leading-snug">
                Toque no botão <strong>Compartilhar</strong> (ícone <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" />) na barra inferior do Safari.
              </li>
              <li className="leading-snug">
                Role para baixo e toque em <strong>&ldquo;Adicionar à Tela de Início&rdquo;</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-zinc-400" />).
              </li>
              <li className="leading-snug">
                Confirme em <strong>Adicionar</strong> no canto superior direito.
              </li>
            </ol>
            <button
              onClick={handleDismiss}
              className="w-full mt-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Entendido!
            </button>
          </div>
        ) : (
          /* Botões de Ação para Android / Desktop */
          <div className="flex items-center space-x-2 pt-0.5">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 bg-crimson-600 hover:bg-crimson-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-crimson-btn transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Instalar no Celular</span>
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Depois
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

