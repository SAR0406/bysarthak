import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedText } from "@/components/animated-text";
import LightPillar from "../light-pillar";

export function Hero() {
  return (
    <section id="home" className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0">
         <LightPillar topColor="#4B0082" bottomColor="#8F00FF" />
      </div>
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
     
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        <AnimatedText
          text="Sarthak"
          className="font-headline text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter"
        />
        <p className="max-w-2xl text-lg md:text-xl text-foreground/80 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          Creative Coder & Explorer of Modern Web Experiences
        </p>
        <div className="animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <Button asChild size="lg">
            <Link href="#work">Explore My World</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}