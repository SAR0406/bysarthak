import { Button } from "@/components/ui/button";
import { AnimatedText } from "../animated-text";
import Link from "next/link";
import RotatingText from '../RotatingText';


export function Hero() {
  return (
    <section id="home" className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden">
     
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        <AnimatedText
          text="Hi, I’m Sarthak 👋"
          className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-white"
        />
        <div className="w-full max-w-4xl text-lg md:text-xl animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <RotatingText
            texts={['Creative Coder', 'Web Explorer', 'React Developer']}
            mainClassName="px-2 sm:px-2 md:px-3 bg-cyan-300 text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
            staggerFrom={"last"}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
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
