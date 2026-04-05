'use client';

import { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface PreloaderProps {
  onComplete: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let rafId: number;
    const step = () => {
      setProgress((prev) => {
        const next = prev + (100 - prev) * 0.12;
        if (next >= 99.8) {
          return 100;
        }
        return next;
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (progress >= 100 && !done) {
      setDone(true);
      const timeout = setTimeout(onComplete, 450);
      return () => clearTimeout(timeout);
    }
  }, [done, onComplete, progress]);

  const progressLabel = useMemo(() => `${Math.min(100, Math.round(progress))}%`, [progress]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[1200] bg-[#05060a] text-white flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] } }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(82,39,255,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(156,255,0,0.12),transparent_40%)]" aria-hidden />
          <div className="relative flex flex-col items-center gap-6 px-6 text-center">
            <motion.div
              className="text-5xl md:text-7xl font-headline tracking-tight"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            >
              Sarthak / Portfolio
            </motion.div>
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4 } }}
            >
              <span className="text-sm tracking-[0.2em] uppercase text-white/50">Loading Experience</span>
              <div className="h-px w-16 bg-gradient-to-r from-white/20 via-white to-white/20" />
              <span className="text-xl font-semibold">{progressLabel}</span>
            </motion.div>
            <div className="w-64 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.4 }}
              />
            </div>
            <div className="mt-4 text-xs uppercase tracking-[0.24em] text-white/60">
              Zero to wow — crafting the stage
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
