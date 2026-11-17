'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Hand, Camera, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feed', href: '/feed', icon: Home },
    { label: 'Ações', href: '/acoes', icon: Hand },
    { label: 'Cobrar', href: '/postar', icon: Camera, isCenterButton: true },
    { label: 'Chat', href: '/mensagens', icon: MessageCircle },
    { label: 'Perfil', href: '/perfil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-zinc-200 z-40 safe-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto h-full grid grid-cols-5 items-center px-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.isCenterButton) {
            return (
              <div key={item.label} className="flex flex-col items-center justify-center -mt-6">
                <Link
                  href={item.href}
                  className="w-14 h-14 rounded-full bg-crimson-600 hover:bg-crimson-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-crimson-600/40 transition-transform border-4 border-white cursor-pointer"
                  aria-label="Cobrar zeladoria ou postar"
                >
                  <Icon className="w-6 h-6 stroke-[2.4] text-white" />
                </Link>
                <span className="text-[11px] font-black text-crimson-700 mt-0.5 tracking-tight">
                  {item.label}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 transition-colors',
                isActive
                  ? 'text-crimson-600 font-extrabold'
                  : 'text-zinc-400 hover:text-zinc-700'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'stroke-[2.4]' : 'stroke-[1.8]')} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
