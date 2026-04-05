'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowDown, Sparkles, Zap, Compass } from 'lucide-react';
import LightPillar from '../LightPillar';
import StarButton from '../StarButton';

const heroLines = [
  'Sarthak Sharma',
  'Frontend Designer & Creative Technologist',
  'Building cinematic, tactile web moments.',
];

export function Hero() {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useSpring(useTransform(mouseX, (v) => v * 0.3), { stiffness: 180, damping: 30 });
  const parallaxY = useSpring(useTransform(mouseY, (v) => v * 0.25), { stiffness: 180, damping: 30 });

  useEffect(() => {
    setMounted(true);

    const handleMove = (event: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = event.clientX - innerWidth / 2;
      const y = event.clientY - innerHeight / 2;
      mouseX.set(x / innerWidth * 100);
      mouseY.set(y / innerHeight * 100);
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [mouseX, mouseY]);

  const metrics = useMemo(
    () => [
      { label: 'Experiments', value: '120+', icon: <Sparkles className="h-5 w-5" /> },
      { label: 'Live Products', value: '14', icon: <Zap className="h-5 w-5" /> },
      { label: 'Studios', value: 'Remote / India', icon: <Compass className="h-5 w-5" /> },
    ],
    []
  );

  const [magnet, setMagnet] = useState({ x: 0, y: 0 });

  if (!mounted) {
    return (
      <section id="home" className="relative flex min-h-screen items-center justify-center">
        <div className="h-24 w-24 rounded-full border border-white/10 animate-pulse" />
      </section>
    );
  }

  return (
    <section id="home" className="relative isolate flex min-h-screen items-center overflow-hidden px-6 pt-28">
      <div className="pointer-events-none absolute inset-0">
        <LightPillar
          interactive
          topColor="#9ef01a"
          bottomColor="#5227ff"
          intensity={0.5}
          rotationSpeed={0.05}
          glowAmount={0.006}
          pillarWidth={3.2}
          pillarHeight={0.46}
          noiseIntensity={0.08}
          pillarRotation={-8}
          mixBlendMode="screen"
        />
        <motion.div
          style={{ x: parallaxX, y: parallaxY }}
          className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-[32%] bg-[radial-gradient(circle_at_30%_20%,rgba(158,240,26,0.18),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(82,39,255,0.2),transparent_32%)] blur-[60px]"
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/60">
            <div className="h-7 w-7 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span>Neo-brutalist / cinematic web direction</span>
          </div>
          <div className="space-y-2">
            {heroLines.map((line, index) => (
              <motion.p
                key={line}
                className="font-headline text-4xl leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 * index, duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
              >
                {line}
              </motion.p>
            ))}
          </div>
          <motion.p
            className="max-w-3xl text-base text-white/70 md:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            I design and code tactile web experiences that feel alive — kinetic typography, playful micro-interactions,
            and cinematic atmospheres crafted with motion, WebGL light, and intentional negative space.
          </motion.p>
          <motion.div
            className="flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            <Link href="#work" data-cursor="link">
              <StarButton ariaLabel="Jump to work">See the work</StarButton>
            </Link>
            <Link href="#about" data-cursor="link">
              <StarButton variant="secondary" ariaLabel="Learn about Sarthak">
                About the craft
              </StarButton>
            </Link>
            <Link href="/another-version" data-cursor="link">
              <div className="star-button star-button-secondary">Alt experience</div>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
        >
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="group flex items-center justify-between rounded-2xl border border-white/5 bg-black/10 px-5 py-4 transition duration-300 hover:border-white/20"
              data-cursor="link"
            >
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.16em] text-white/60">{metric.label}</div>
                <div className="text-2xl font-semibold text-white">{metric.value}</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-primary transition duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                {metric.icon}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.button
          className="group relative inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/80 backdrop-blur-md"
          data-cursor="link"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setMagnet({
              x: (event.clientX - rect.left - rect.width / 2) / 4,
              y: (event.clientY - rect.top - rect.height / 2) / 4,
            });
          }}
          onMouseLeave={() => setMagnet({ x: 0, y: 0 })}
          style={{ transform: `translate(${magnet.x}px, ${magnet.y}px)` }}
        >
          <span className="relative z-10">Scroll Down</span>
          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-primary/20">
            <motion.div
              className="absolute inset-0 grid place-items-center text-sm text-white"
              animate={{ y: ['0%', '-100%'] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            >
              <ArrowDown className="h-4 w-4" />
              <ArrowDown className="h-4 w-4" />
            </motion.div>
          </div>
          <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 blur-md transition duration-300 group-hover:opacity-100" aria-hidden />
        </motion.button>
      </div>
    </section>
  );
}
