'use client';

import React, { useCallback, useRef, useState } from 'react';
import { LiveTicker } from '@/components/landing/LiveTicker';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProcessesSection } from '@/components/landing/ProcessesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { CitiesRankingSection } from '@/components/landing/CitiesRankingSection';
import { FinalCtaBanner } from '@/components/landing/FinalCtaBanner';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { PetitionModal } from '@/components/landing/PetitionModal';
import type { ProcessItem } from '@/components/landing/shared';

export default function HomePage() {
  const cepInputRef = useRef<HTMLInputElement | null>(null);
  const [petitionOpen, setPetitionOpen] = useState(false);
  const [userProcesses, setUserProcesses] = useState<ProcessItem[]>([]);

  const handleFocusCep = useCallback(() => {
    const input = cepInputRef.current;
    if (!input) return;
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => input.focus({ preventScroll: true }), 400);
  }, []);

  const openPetition = useCallback(() => setPetitionOpen(true), []);
  const closePetition = useCallback(() => setPetitionOpen(false), []);

  const handleCreate = useCallback((item: ProcessItem) => {
    setUserProcesses((prev) => [item, ...prev]);
  }, []);

  const handleViewList = useCallback(() => {
    setPetitionOpen(false);
    setTimeout(() => {
      document.getElementById('processos')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <header className="sticky top-0 z-50">
        <LiveTicker />
        <LandingNavbar onFocusCep={handleFocusCep} onOpenPetition={openPetition} />
      </header>

      <main>
        <HeroSection cepInputRef={cepInputRef} onOpenPetition={openPetition} />
        <ProcessesSection userProcesses={userProcesses} />
        <HowItWorksSection />
        <CitiesRankingSection onFocusCep={handleFocusCep} />
        <FinalCtaBanner onFocusCep={handleFocusCep} onOpenPetition={openPetition} />
      </main>

      <LandingFooter />

      {petitionOpen && (
        <PetitionModal onClose={closePetition} onCreate={handleCreate} onViewList={handleViewList} />
      )}
    </div>
  );
}
