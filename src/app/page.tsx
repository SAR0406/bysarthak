import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Work } from "@/components/sections/work";
import { Contact } from "@/components/sections/contact";
import { Gallery } from "@/components/sections/gallery";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 md:gap-24">
      <Hero />
      <About />
      <Work />
      <Gallery />
      <Contact />
    </div>
  );
}
