'use client';

import React, { useRef } from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { BeforeAfterSection } from '@/components/landing/BeforeAfterSection';
import { PowerLevelsSection } from '@/components/landing/PowerLevelsSection';
import { SecurityShieldSection } from '@/components/landing/SecurityShieldSection';
import { CitiesRankingSection } from '@/components/landing/CitiesRankingSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function HomePage() {
  const cepInputRef = useRef<HTMLInputElement | null>(null);

  const handleFocusCep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      cepInputRef.current?.focus();
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <LandingNavbar onFocusCep={handleFocusCep} />
      <main>
        <HeroSection cepInputRef={cepInputRef} />
        <BeforeAfterSection />
        <PowerLevelsSection />
        <SecurityShieldSection />
        <CitiesRankingSection onFocusCep={handleFocusCep} />
      </main>
      <LandingFooter />
    </div>
  );
}
