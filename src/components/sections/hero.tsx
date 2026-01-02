import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedText } from "../animated-text";
import CurvedLoop from "../CurvedLoop";


export function Hero() {
  return (
    <section id="home" className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden">
     
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        <AnimatedText
          text="Hi, I’m Sarthak 👋"
          className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white"
        />
        <div className="w-full max-w-4xl text-lg md:text-xl text-white animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <CurvedLoop 
              marqueeText="Creative Coder ✦ Explorer of Modern Web Experiences ✦"
              speed={1}
              curveAmount={50}
              interactive={true}
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
