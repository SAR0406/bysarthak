
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatedText } from "../animated-text";
import RotatingText from '../RotatingText';
import LogoLoop from "../LogoLoop";
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiFirebase, SiNodedotjs } from 'react-icons/si';
import StarButton from "../StarButton";
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

  useEffect(() => {
    // This check ensures window is defined, for SSR compatibility
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      // Initial check
      checkMobile();

      // Listener for window resize
      window.addEventListener('resize', checkMobile);

      // Cleanup
      return () => {
        window.removeEventListener('resize', checkMobile);
      };
    }
  }, []);

  const handleOpenInNewTab = () => {
    window.open('/another-version', '_blank');
  };

  const anotherVersionButton = isMobile ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <StarButton ariaLabel="Check another version of me">
          Check another version
        </StarButton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mobile Experience Notice</AlertDialogTitle>
          <AlertDialogDescription>
            This portfolio version is designed for a desktop experience. For the best view, please open it in a browser on a larger screen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleOpenInNewTab}>
            Open Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    <Link href="/another-version" passHref>
      <StarButton ariaLabel="Check another version of me">
        Check another version
      </StarButton>
    </Link>
  );

  return (
    <section id="home" className="relative h-screen w-full flex items-center justify-center text-center">
     
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        <div className="flex flex-col items-center gap-6">
          <AnimatedText
            text="Hi, I’m Sarthak 👋"
            className="font-headline text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white"
          />
          <div className="w-full max-w-4xl text-lg md:text-xl text-white animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <RotatingText
              texts={['Creative Coder', 'Explorer of Modern Web Experiences']}
              staggerFrom={"last"}
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -25, opacity: 0 }}
              staggerDuration={0.025}
              splitLevelClassName="pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </div>
          <div className="flex items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '1s' }}>
            <Link href="#work" passHref>
                <StarButton ariaLabel="Explore My World, scroll to work section">
                  Explore My World
                </StarButton>
            </Link>
            {anotherVersionButton}
          </div>
        </div>
        <div className="w-full max-w-4xl animate-fade-in-up mt-12" style={{ animationDelay: '1.2s' }}>
            <LogoLoop
                logos={techLogos}
                speed={60}
                direction="left"
                logoHeight={60}
                gap={40}
                hoverSpeed={0}
                scaleOnHover={false}
                fadeOut
                className="text-white/80"
             />
        </div>
      </div>
    </section>
  );
}
