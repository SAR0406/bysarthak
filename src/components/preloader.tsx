'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Preloader() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const duration = 2400;
    const start = performance.now();

    const easeOutExpo = (t: number) => 1 - Math.pow(2, -10 * t);

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutExpo(t);
      setCount(Math.min(100, Math.round(eased * 100)));

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => setIsLoading(false), 420);
      }
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black"
        >
          <div className="relative flex flex-col items-center gap-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.h1
                className="font-headline text-8xl md:text-9xl font-bold text-white mb-4"
                animate={{
                  textShadow: [
                    '0 0 20px rgba(82, 39, 255, 0.5)',
                    '0 0 40px rgba(82, 39, 255, 0.8)',
                    '0 0 20px rgba(82, 39, 255, 0.5)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                {count}%
              </motion.h1>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: count / 100 }}
                transition={{ duration: 0.1 }}
                className="h-1 w-64 mx-auto bg-primary rounded-full origin-left"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white/60 text-sm tracking-[0.3em] uppercase"
            >
              Loading Experience
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
