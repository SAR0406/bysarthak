import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Hero } from "@/components/sections/hero";
import { WorkSkeleton } from '@/components/sections/work-skeleton';

const About = dynamic(() => import('@/components/sections/about').then(mod => mod.About));
const Work = dynamic(() => import('@/components/sections/work').then(mod => mod.Work));
const Gallery = dynamic(() => import('@/components/sections/gallery').then(mod => mod.Gallery));
const Contact = dynamic(() => import('@/components/sections/contact').then(mod => mod.Contact));

export default function Home() {
  return (
    <div className="flex flex-col gap-16 md:gap-24">
      <Hero />
      <About />
      <Suspense fallback={<WorkSkeleton />}>
        <Work />
      </Suspense>
      <Gallery />
      <Contact />
    </div>
  );
}