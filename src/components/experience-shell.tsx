'use client';

import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { Repo } from '@/types';
import { Hero } from './sections/hero';
import { About } from './sections/about';
import { Work } from './sections/work';
import { Gallery } from './sections/gallery';
import { Contact } from './sections/contact';
import { Preloader } from './preloader';
import { CustomCursor } from './custom-cursor';

interface ExperienceShellProps {
  repos: Repo[];
}

export function ExperienceShell({ repos }: ExperienceShellProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const lenis = new Lenis({
      smoothWheel: true,
      lerp: 0.08,
      duration: 1.2,
      smoothTouch: true,
      touchMultiplier: 1.2,
    });

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-[#04060a] text-slate-50">
      <CustomCursor />
      <Preloader onComplete={() => setReady(true)} />
      <div className="fixed inset-0 pointer-events-none opacity-25 mix-blend-soft-light grain-overlay" aria-hidden />
      <div className={`relative transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0 translate-y-6'}`}>
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-[120px]" aria-hidden />
        <div className="absolute right-[-10%] top-1/3 h-80 w-80 rounded-full bg-secondary/20 blur-[140px]" aria-hidden />
        <div className="flex flex-col gap-28 md:gap-36">
          <Hero />
          <About />
          <Work repos={repos} />
          <Gallery />
          <Contact />
        </div>
      </div>
    </div>
  );
}
