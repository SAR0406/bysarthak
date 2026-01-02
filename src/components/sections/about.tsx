import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { SkillProgress } from '../skill-progress';
import { skills } from '@/lib/data';

const profileImage = PlaceHolderImages.find(p => p.id === 'profile');

export function About() {
  return (
    <section id="about" className="container mx-auto py-16">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="flex justify-center">
          <Card className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] p-2 rounded-full overflow-hidden relative group">
            <Image
              src={profileImage?.imageUrl || ''}
              alt="Sarthak"
              fill
              className="object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={profileImage?.imageHint}
            />
          </Card>
        </div>
        <div className="space-y-6">
          <h2 className="font-headline text-3xl md:text-4xl font-bold">About Me</h2>
          <p className="text-lg text-muted-foreground">
            I'm a passionate and results-driven developer with a knack for building beautiful, functional, and scalable web applications. My journey into code began with a simple "Hello, World!" and has since evolved into a full-fledged obsession with crafting seamless digital experiences.
          </p>
          <p className="text-lg text-muted-foreground">
            When I'm not coding, you can find me exploring new technologies, contributing to open-source projects, or brewing the perfect cup of coffee. I believe in lifelong learning and the power of collaboration to create amazing things.
          </p>
        </div>
      </div>
      <div id="skills" className="mt-24">
         <h3 className="text-center font-headline text-2xl md:text-3xl font-bold mb-12">My Tech Stack</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 max-w-4xl mx-auto">
            {skills.map(skill => (
                <SkillProgress key={skill.name} name={skill.name} level={skill.level} />
            ))}
         </div>
      </div>
    </section>
  );
}
