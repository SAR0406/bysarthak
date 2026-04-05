'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [variant, setVariant] = useState<'default' | 'link' | 'project'>('default');

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 22, stiffness: 800 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 24);
      cursorY.set(e.clientY - 24);
    };

    const handleIntent = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const labelled = target.closest<HTMLElement>('[data-cursor-label]');
      const project = target.closest<HTMLElement>('[data-cursor-variant="project"], .project-card');
      const clickable = target.closest('a, button, [role="button"], .hoverable');

      const nextLabel = labelled?.getAttribute('data-cursor-label') || (project ? 'View' : null);
      const nextVariant = (labelled?.getAttribute('data-cursor-variant') as 'project' | 'link' | null) || (project ? 'project' : clickable ? 'link' : 'default');

      setLabel(nextLabel);
      setVariant(nextVariant);
      setIsHovering(Boolean(project || clickable || labelled));
    };

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mousemove', handleIntent, true);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mousemove', handleIntent, true);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      <motion.div
        ref={cursorRef}
        className="custom-cursor pointer-events-none fixed top-0 left-0 z-[9999] mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
      >
        <motion.div
          className="relative flex items-center justify-center"
          animate={{
            width: variant === 'project' ? 120 : isHovering ? 80 : 38,
            height: variant === 'project' ? 120 : isHovering ? 80 : 38,
            scale: isHovering ? 1 : 0.85,
          }}
          transition={{ type: 'spring', damping: 18, stiffness: 320 }}
        >
          <div className="absolute inset-0 rounded-full bg-white/90 mix-blend-difference" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_hsla(var(--primary)/0.4),_transparent_65%)] blur-md" />
          <motion.div
            className="absolute inset-0 rounded-full border border-white/30"
            animate={{ scale: isHovering ? 1.15 : 0.9, opacity: isHovering ? 0.85 : 0.35 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          />
          {(label || variant === 'link') && (
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] text-black"
            >
              {label || (variant === 'project' ? 'View' : 'Go')}
            </motion.span>
          )}
        </motion.div>
      </motion.div>
      <style jsx global>{`
        @media (pointer: fine) {
          * {
            cursor: none !important;
          }
        }
      `}</style>
    </>
  );
}
