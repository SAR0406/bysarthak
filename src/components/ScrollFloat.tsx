'use client';
import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
  children: React.ReactNode;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
  className?: string;
}

const ScrollFloat: React.FC<ScrollFloatProps> = ({
  children,
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof children !== 'string') return;

    const originalText = children;
    container.innerHTML = ''; 
    
    // Use Intl.Segmenter or Array.from for proper emoji/grapheme splitting
    const chars = Array.from(originalText).map(char => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.className = 'inline-block';
      container.appendChild(span);
      return span;
    });

    const ctx = gsap.context(() => {
      gsap.fromTo(
        chars,
        { yPercent: 120, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: animationDuration,
          ease: ease,
          stagger: {
            each: stagger,
            from: 'start',
          },
          scrollTrigger: {
            trigger: container,
            start: scrollStart,
            end: scrollEnd,
            scrub: 1.5,
          },
        }
      );
    }, container);

    return () => {
        ctx.revert();
        if(container) {
            container.innerHTML = originalText;
        }
    }
  }, [children, animationDuration, ease, scrollStart, scrollEnd, stagger]);

  return <div ref={containerRef} className={className}>{children}</div>;
};

export default ScrollFloat;
