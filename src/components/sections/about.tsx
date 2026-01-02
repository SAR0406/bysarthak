'use client';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { SkillProgress } from '../skill-progress';
import { skills } from '@/lib/data';
import PixelCard from '../PixelCard';
import ScrollFloat from '../ScrollFloat';

const profileImageUrl = "https://i.ibb.co/wrMzQqgD/IMG-20251229-190558-670-2.jpg";

export function About() {
  return (
    <section id="about" className="container mx-auto py-16">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="flex justify-center">
          <PixelCard variant="pink" className='rounded-full'>
             <Image
              src={profileImageUrl}
              alt="Sarthak"
              fill
              className="object-cover rounded-full absolute inset-0 z-0"
            />
          </PixelCard>
        </div>
        <div className="space-y-6">
          <ScrollFloat className="font-headline text-3xl md:text-4xl font-bold text-white">About Me</ScrollFloat>
          <ScrollFloat className="text-lg text-white">
            I'm a passionate and results-driven developer with a knack for building beautiful, functional, and scalable web applications. My journey into code began with a simple "Hello, World!" and has since evolved into a full-fledged obsession with crafting seamless digital experiences.
          </ScrollFloat>
           <ScrollFloat className="text-lg text-white">
            When I'm not coding, you can find me exploring new technologies, contributing to open-source projects, or brewing the perfect cup of coffee. I believe in lifelong learning and the power of collaboration to create amazing things.
          </ScrollFloat>
        </div>
      </div>
      <div id="skills" className="mt-24">
         <ScrollFloat className="text-center font-headline text-2xl md:text-3xl font-bold mb-12 text-white">My Tech Stack</ScrollFloat>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 max-w-4xl mx-auto">
            {skills.map(skill => (
                <SkillProgress key={skill.name} name={skill.name} level={skill.level} />
            ))}
         </div>
      </div>
    </section>
  );
}
