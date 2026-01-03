'use client';

import { Button } from "@/components/ui/button";
import { AnimatedText } from "../animated-text";
import Link from "next/link";
import RotatingText from '../RotatingText';
import LogoLoop from "../LogoLoop";
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiFirebase, SiNodedotjs } from 'react-icons/si';

const techLogos = [
  { node: <SiReact />, title: "React" },
  { node: <SiNextdotjs />, title: "Next.js" },
  { node: <SiTypescript />, title: "TypeScript" },
  { node: <SiTailwindcss />, title: "Tailwind CSS" },
  { node: <SiFirebase />, title: "Firebase" },
  { node: <SiNodedotjs />, title: "Node.js" },
];

export function Hero() {
  return (
    <section id="home" className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden">
     
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        <div className="flex flex-col items-center gap-6">
          <AnimatedText
            text="Hi, I’m Sarthak 👋"
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white"
          />
          <div className="w-full max-w-4xl text-lg md:text-xl text-white animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <RotatingText
              texts={[
                'I build intelligent systems that see, think, and automate.',
                'Turning ambitious ideas into working AI systems.'
              ]}
              staggerFrom={"last"}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-120%", opacity: 0 }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={3000}
            />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '1s' }}>
             <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-primary/50">
              <Link href="#work">Explore My World</Link>
            </Button>
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
