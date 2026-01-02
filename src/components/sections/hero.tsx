import Link from "next/link";
import { Button } from "@/components/ui/button";
import TextType from "@/components/TextType";

export function Hero() {
  return (
    <section id="home" className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden">
     
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        <TextType
          as="h1"
          text="Hi, I’m Sarthak 👋"
          typingSpeed={100}
          loop={false}
          showCursor={false}
          className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white"
        />
        <div className="max-w-2xl text-lg md:text-xl text-white animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <TextType 
            text={["Creative Coder", "Explorer of Modern Web Experiences"]}
            typingSpeed={75}
            pauseDuration={1500}
            showCursor={true}
            cursorCharacter="|"
            initialDelay={1000}
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
