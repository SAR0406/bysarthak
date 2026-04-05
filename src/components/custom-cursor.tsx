'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

type CursorMode = 'default' | 'link' | 'project';

export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const smoothX = useSpring(x, { stiffness: 350, damping: 40, mass: 0.6 });
  const smoothY = useSpring(y, { stiffness: 350, damping: 40, mass: 0.6 });

  const [mode, setMode] = useState<CursorMode>('default');

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      x.set(event.clientX - 12);
      y.set(event.clientY - 12);
    };

    const handlePointer = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const intent = target?.closest<HTMLElement>('[data-cursor]');
      const nextMode = (intent?.dataset.cursor as CursorMode) || 'default';
      setMode(nextMode);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseover', handlePointer);
    document.addEventListener('focusin', handlePointer);

    document.body.classList.add('custom-cursor-active');

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseover', handlePointer);
      document.removeEventListener('focusin', handlePointer);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [x, y]);

  const isProject = mode === 'project';
  const isLink = mode === 'link';

  return (
    <motion.div
      className="pointer-events-none fixed z-[1500] h-10 w-10 rounded-full border border-white/40 mix-blend-difference backdrop-blur-md bg-white/5 shadow-[0_0_60px_rgba(255,255,255,0.18)]"
      style={{ translateX: smoothX, translateY: smoothY }}
      animate={{
        scale: isProject ? 3.4 : isLink ? 1.5 : 1,
        opacity: 1,
        borderWidth: isProject ? 2 : 1,
      }}
      transition={{ type: 'spring', stiffness: 180, damping: 20 }}
      aria-hidden
    >
      {isProject && (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold tracking-[0.2em] text-white">
          VIEW
        </div>
      )}
    </motion.div>
  );
}
