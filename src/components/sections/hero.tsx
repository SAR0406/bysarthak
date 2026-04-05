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
import { motion } from 'framer-motion';

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

  const staticLogos = (
    <div className="flex items-center justify-center gap-8 flex-wrap">
      {techLogos.map((logo, index) => (
        <div key={index} title={logo.title} className="text-4xl text-white/60 transition-colors hover:text-primary">
          {logo.node}
        </div>
      ))}
    </div>
  );

  return (
    <section id="home" className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        <div className="flex flex-col items-center gap-6">
          <AnimatedText
            text="Hi, I'm Sarthak 👋"
            className="font-headline text-5xl md:text-7xl lg:text-9xl font-bold tracking-tighter text-white drop-shadow-2xl"
          />
          <div className="w-full max-w-4xl text-xl md:text-2xl text-white/90 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <RotatingText
              texts={['Creative Coder', 'Explorer of Modern Web Experiences', 'Digital Artist', 'Innovation Enthusiast']}
              staggerFrom={"last"}
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -25, opacity: 0 }}
              staggerDuration={0.025}
              splitLevelClassName="pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={3000}
            />
          </div>
          <div className="flex items-center justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '1s' }}>
            <Link href="#work" scroll={false}>
              <MagneticButton className="star-button">
                Explore World
              </MagneticButton>
            </Link>
            {anotherVersionButton}
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-white/60 text-sm uppercase tracking-wider">Scroll</span>
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center p-1">
            <motion.div
              className="w-1.5 h-1.5 bg-white/60 rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        <div className="w-full max-w-4xl animate-fade-in-up mt-12" style={{ animationDelay: '1.2s' }}>
            {isMobile ? staticLogos : (
              <LogoLoop
                  logos={techLogos}
                  speed={60}
                  direction="left"
                  logoHeight={50}
                  gap={40}
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