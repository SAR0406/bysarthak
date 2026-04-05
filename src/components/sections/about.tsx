
'use client';

import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useMemo, useRef } from 'react';
import { Badge } from '../ui/badge';
import { Sparkles, Wand2, Waves, Radar } from 'lucide-react';

const marqueeWords = ['React', 'WebGL', 'GSAP', 'Three.js', 'UI/UX', 'Motion Design', 'Creative Coding'];

export function About() {
  const textRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(textRef, { once: true, margin: '-10% 0px' });

  const story = useMemo(
    () =>
      'I’m a frontend developer who treats every interface like a stage — pairing bold typography with playful physics, glassmorphic sheen, and neon-tinged light to build experiences that feel alive.',
    []
  );

  const storyWords = story.split(' ');

  return (
    <section id="about" className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6">
      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/[0.03] via-transparent to-white/[0.04] blur-3xl" aria-hidden />
      <div className="relative flex flex-col gap-8">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-primary">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wand2 className="h-4 w-4" />
          </div>
          <span>About the craft</span>
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div ref={textRef} className="space-y-6">
            <h2 className="font-headline text-3xl leading-tight text-white md:text-4xl">Storytelling with pixels</h2>
            <div className="flex flex-wrap gap-2">
              {['Neo-brutalism', 'Glassmorphism', 'WebGL Light', 'Framer Motion'].map((pill) => (
                <Badge key={pill} variant="outline" className="border-white/15 bg-white/5 text-white/70">
                  {pill}
                </Badge>
              ))}
            </div>
            <p className="text-white/70 leading-relaxed">
              {storyWords.map((word, index) => (
                <motion.span
                  key={`${word}-${index}`}
                  className="inline-block"
                  initial={{ y: 18, opacity: 0 }}
                  animate={inView ? { y: 0, opacity: 1 } : {}}
                  transition={{ delay: index * 0.015, duration: 0.4, ease: 'easeOut' }}
                >
                  {word}
                  {index !== storyWords.length - 1 && '\u00a0'}
                </motion.span>
              ))}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: 'Hybrid Design-Dev', text: 'Design systems, prototyping, and production-grade code.' },
                { title: 'Motion-first', text: 'Scroll choreographies, text splitting, micro-interactions.' },
                { title: 'WebGL curious', text: 'Shader-driven light, parallax, and reactive fields.' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-[0_10px_60px_rgba(0,0,0,0.25)]"
                >
                  <div className="text-sm uppercase tracking-[0.16em] text-white/50">{item.title}</div>
                  <div className="mt-2 text-white/80">{item.text}</div>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-primary/10 via-black/20 to-black/40 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            viewport={{ once: true }}
            data-cursor="link"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(158,240,26,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(82,39,255,0.18),transparent_35%)]" />
            <div className="absolute inset-4 rounded-[26px] border border-white/10" />
            <Image
              src="https://i.ibb.co/wrMzQqgD/IMG-20251229-190558-670-2.jpg"
              alt="Sarthak portrait"
              fill
              className="object-cover rounded-[24px] saturate-110 mix-blend-screen"
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm uppercase tracking-[0.16em] text-white/70 backdrop-blur-lg">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Crafting kinetic stories
              </span>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Waves className="h-4 w-4" />
                Flow state
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="marquee-mask pointer-events-none absolute inset-0 bg-gradient-to-r from-[#04060a] via-transparent to-[#04060a]" aria-hidden />
        <div className="flex items-center gap-6 text-lg font-semibold uppercase tracking-[0.28em] text-white/60">
          {[0, 1].map((track) => (
            <div key={track} className="flex min-w-full items-center gap-6 animate-marquee whitespace-nowrap">
              {marqueeWords.map((word) => (
                <span key={`${track}-${word}`} className="flex items-center gap-3">
                  {word}
                  <Radar className="h-4 w-4 text-primary" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
