import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedText } from "@/components/animated-text";
import TextType from "@/components/text-type";

export function Hero() {
  return (
    <section id="home" className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden">
     
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        <AnimatedText
          text="Sarthak"
          className="font-headline text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter"
        />
        <div className="max-w-2xl text-lg md:text-xl text-foreground/80 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <TextType 
            text={["Creative Coder", "Explorer of Modern Web Experiences"]}
            typingSpeed={75}
            pauseDuration={1500}
            showCursor={true}
            cursorCharacter="|"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <Button asChild size="lg">
            <Link href="#work">Explore My World</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
