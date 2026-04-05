'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatedText } from "../animated-text";
import RotatingText from '../RotatingText';
import LogoLoop from "../LogoLoop";
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiFirebase, SiNodedotjs } from 'react-icons/si';
import StarButton from "../StarButton";
import { MagneticButton } from "../magnetic-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, useMotionValue, useTransform } from 'framer-motion';

const techLogos = [
  { node: <SiReact />, title: "React" },
  { node: <SiNextdotjs />, title: "Next.js" },
  { node: <SiTypescript />, title: "TypeScript" },
  { node: <SiTailwindcss />, title: "Tailwind CSS" },
  { node: <SiFirebase />, title: "Firebase" },
  { node: <SiNodedotjs />, title: "Node.js" },
];

export function Hero() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const orbX = useTransform(mouseX, [0, 1], ['-6%', '6%']);
  const orbY = useTransform(mouseY, [0, 1], ['-10%', '10%']);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOpenInNewTab = () => {
    window.open('/another-version', '_blank');
  };

  if (!mounted) {
    return (
      <section id="home" className="relative h-screen w-full flex items-center justify-center text-center">
        <div className="relative z-10 flex flex-col items-center gap-8 px-4 opacity-0">
          Loading...
        </div>
      </section>
    );
  }

  const anotherVersionButton = isMobile ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className="star-button star-button-secondary">
          Version 2
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-background/95 backdrop-blur-2xl border-primary/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Mobile Experience Notice</AlertDialogTitle>
          <AlertDialogDescription className="text-white/60">
            This portfolio version is optimized for desktop interaction. For the best experience, please view it on a larger screen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleOpenInNewTab} className="bg-primary text-white hover:bg-primary/90">
            Open Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    <Link href="/another-version">
      <StarButton variant="secondary" ariaLabel="Check another version of the portfolio">
        Version 2
      </StarButton>
    </Link>
  );

  return (
    <section
      id="home"
      className="relative min-h-screen w-full overflow-hidden pt-28 pb-20"
      onMouseMove={(e) => {
        const { innerWidth, innerHeight } = window;
        mouseX.set(e.clientX / innerWidth);
        mouseY.set(e.clientY / innerHeight);
      }}
    >
      <div className="absolute inset-0 grid-overlay opacity-40" />
      <motion.div
        className="absolute -left-32 top-12 h-[38rem] w-[38rem] rounded-full blur-3xl"
        style={{
          x: orbX,
          y: orbY,
          background:
            'radial-gradient(circle at 30% 30%, hsla(var(--secondary) / 0.25), transparent 60%), radial-gradient(circle at 70% 70%, hsla(var(--primary) / 0.22), transparent 55%)',
        }}
        aria-hidden
      />
      <motion.div
        className="absolute bottom-[-10%] right-[-8%] h-[32rem] w-[32rem] rounded-full blur-3xl opacity-80"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            'radial-gradient(circle at 40% 40%, hsla(var(--accent) / 0.35), transparent 60%), radial-gradient(circle at 60% 60%, hsla(var(--primary) / 0.16), transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 container mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-6 max-w-6xl">
          <motion.div
            className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">High-End</span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Web / Motion / 3D</span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Neo-Brutal. Cinematic.</span>
          </motion.div>

          <motion.div
            className="space-y-3 md:space-y-4 hero-text-shadow"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 120, damping: 20 }}
          >
            <AnimatedText
              text="Sarthak Sharma"
              className="font-headline text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gradient"
            />
            <motion.h1
              className="font-headline text-3xl md:text-5xl lg:text-6xl font-bold leading-tight"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, type: 'spring', stiffness: 140, damping: 22 }}
            >
              Designing <span className="text-gradient">kinetic frontends</span> that feel tactile, cinematic, and alive.
            </motion.h1>
            <div className="w-full max-w-4xl text-lg md:text-xl text-white/80">
              <RotatingText
                texts={[
                  'Front-end director crafting WebGL, GSAP, Framer Motion experiences',
                  'Adaptive layouts, fluid type, and fearless neo-brutalist edges',
                  'Interactive stories with smooth-scroll, parallax, and micro-interactions'
                ]}
                staggerFrom={"last"}
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -25, opacity: 0 }}
                staggerDuration={0.03}
                splitLevelClassName="pb-0.5 sm:pb-1 md:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2800}
              />
            </div>
          </motion.div>

          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <Link href="#work" scroll={false} data-cursor-variant="project" data-cursor-label="Scroll">
              <MagneticButton className="star-button">
                Enter Portfolio
              </MagneticButton>
            </Link>
            {anotherVersionButton}
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_0_6px_rgba(161,255,125,0.12)] animate-pulse" />
              Accepting immersive web collabs for 2025.
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {[
            { label: 'Interactive Systems', detail: 'Parallax, smooth-scroll, WebGL particles, physics-inspired micro-interactions.' },
            { label: 'Design Languages', detail: 'Neo-brutal bento grids, glass/frost surfaces, adaptive type scales, cinematic palettes.' },
            { label: 'Delivery', detail: 'Performance-minded Next.js, TypeScript rigor, accessibility-first motion choreography.' },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              className="section-shell p-6 mask-shine"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + idx * 0.08, type: 'spring', stiffness: 140, damping: 18 }}
              data-cursor-variant="project"
              data-cursor-label="Inspect"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-white/50 mb-3">{item.label}</p>
              <p className="text-white/90 leading-relaxed">{item.detail}</p>
            </motion.div>
          ))}
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="flex items-center gap-4"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex items-center gap-3 text-white/60 uppercase tracking-[0.25em] text-xs">
            <span className="w-10 h-[1px] bg-white/40" />
            Scroll to reveal
          </div>
          <div className="relative h-12 w-12 rounded-full border border-white/20 flex items-center justify-center">
            <motion.div
              className="h-2 w-2 rounded-full bg-white/70"
              animate={{ y: [0, 8, 0], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        <div className="w-full max-w-5xl">
          {isMobile ? (
            <div className="flex items-center justify-center gap-6 flex-wrap text-white/60">
              {techLogos.map((logo, idx) => (
                <div key={idx} className="text-3xl">{logo.node}</div>
              ))}
            </div>
          ) : (
            <LogoLoop
              logos={techLogos}
              speed={50}
              direction="left"
              logoHeight={46}
              gap={48}
              hoverSpeed={0}
              scaleOnHover={false}
              fadeOut
              className="text-white/60"
            />
          )}
        </div>
      </div>
    </section>
  );
}
