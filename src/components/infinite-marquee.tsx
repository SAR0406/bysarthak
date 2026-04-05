'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface InfiniteMarqueeProps {
  items: string[];
  speed?: number;
  direction?: 'left' | 'right';
  className?: string;
}

export function InfiniteMarquee({
  items,
  speed = 50,
  direction = 'left',
  className = ''
}: InfiniteMarqueeProps) {
  const marqueeRef = useRef<HTMLDivElement>(null);

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div
        ref={marqueeRef}
        className="inline-block"
        animate={{
          x: direction === 'left' ? ['0%', '-33.333%'] : ['-33.333%', '0%'],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {duplicatedItems.map((item, index) => (
          <span
            key={index}
            className="inline-block px-6 text-2xl md:text-4xl font-headline font-bold text-white/20"
          >
            {item} •
          </span>
        ))}
      </motion.div>
    </div>
  );
}
