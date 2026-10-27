import React from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between">
      <Header />
      <main className="pt-14 pb-16 flex-1 w-full max-w-md mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

