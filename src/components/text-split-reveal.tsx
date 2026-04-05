'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface TextSplitRevealProps {
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
}

export function TextSplitReveal({
  children,
  className = '',
  delay = 0,
  stagger = 0.03
}: TextSplitRevealProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const text = new SplitType(textRef.current, {
      types: 'lines,words,chars',
      tagName: 'span'
    });

    // Wrap lines for overflow hidden
    if (text.lines) {
      text.lines.forEach((line) => {
        const wrapper = document.createElement('div');
        wrapper.style.overflow = 'hidden';
        line.parentNode?.insertBefore(wrapper, line);
        wrapper.appendChild(line);
      });
    }

    // Animate words
    if (text.words) {
      gsap.fromTo(
        text.words,
        {
          y: 100,
          opacity: 0,
          rotateX: -90,
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          stagger: stagger,
          delay: delay,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: textRef.current,
            start: 'top 80%',
            end: 'top 20%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    return () => {
      text.revert();
    };
  }, [children, delay, stagger]);

  return (
    <div ref={textRef} className={className} style={{ perspective: '1000px' }}>
      {children}
    </div>
  );
}
