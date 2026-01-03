'use client';
import React, { useRef, useLayoutEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

interface ScrollFloatProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}

const ScrollFloat: React.FC<ScrollFloatProps> = ({
  children,
  className = '',
  stagger = 0.03,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const text = typeof children === 'string' ? children : '';

  // Use Intl.Segmenter for proper emoji/grapheme splitting
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const graphemes = Array.from(segmenter.segment(text)).map(g => g.segment);

  return (
    <div ref={ref} className={cn('flex flex-wrap', className)}>
      {graphemes.map((grapheme, index) => (
        <span
          key={index}
          className={cn(
            'inline-block transition-all duration-700 ease-out',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
          style={{ transitionDelay: `${index * stagger}s` }}
        >
          {grapheme === ' ' ? '\u00A0' : grapheme}
        </span>
      ))}
    </div>
  );
};

export default ScrollFloat;
