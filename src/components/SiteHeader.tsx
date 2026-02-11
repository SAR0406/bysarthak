'use client';

import { useEffect, useState } from 'react';
import PillNav from '@/components/PillNav';
import { navLinks } from '@/lib/data';
import { cn } from '@/lib/utils';

const logoUrl = `💫`;

export default function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 z-[1000] w-full py-2 transition-all duration-200 ease-out',
        isScrolled
          ? 'bg-background/72 backdrop-blur-xl border-b border-border/45 shadow-[0_8px_30px_-24px_hsl(var(--foreground)/0.65)]'
          : 'bg-background/20 backdrop-blur-sm border-b border-transparent'
      )}
    >
      <PillNav
        logo={logoUrl}
        items={navLinks}
        baseColor="hsl(var(--card))"
        pillColor="hsl(var(--primary))"
        hoveredPillTextColor="hsl(var(--accent-foreground))"
        pillTextColor="hsl(var(--primary-foreground))"
      />
    </header>
  );
}
