'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Hand, Camera, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/feed', icon: Home },
    { label: 'Ações', href: '/acoes', icon: Hand },
    { label: 'Câmera', href: '/postar', icon: Camera, isCenterButton: true },
    { label: 'Mensagens', href: '/mensagens', icon: MessageCircle },
    { label: 'Perfil', href: '/perfil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200/80 z-40 safe-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto h-full grid grid-cols-5 items-center px-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.isCenterButton) {
            return (
              <div key={item.label} className="flex flex-col items-center justify-center -mt-5">
                <Link
                  href={item.href}
                  className="w-12 h-12 rounded-full bg-[#8cc63f] hover:bg-[#7cb335] active:scale-95 text-gray-900 flex items-center justify-center shadow-md transition-transform border-2 border-white"
                  aria-label="Postar foto ou zeladoria"
                >
                  <Icon className="w-6 h-6 stroke-[2.2] text-gray-900" />
                </Link>
                <span className="text-[10px] font-semibold text-gray-700 mt-0.5">
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
                isActive ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-700'
              )}
            >
              <Icon className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
