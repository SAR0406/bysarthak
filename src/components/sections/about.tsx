
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Handshake, BrainCircuit, Zap } from 'lucide-react';
import PixelCard from '../PixelCard';
import ScrollFloat from '../ScrollFloat';
import { InfiniteMarquee } from '../infinite-marquee';
import { ScrollReveal } from '../scroll-reveal';
import { TextSplitReveal } from '../text-split-reveal';

const aboutSections = [
  {
    icon: <Rocket className="h-6 w-6 text-primary" />,
    title: "I'm currently working on",
    content: "Python + OpenCV projects for real-time camera intelligence (person detection, interaction, automation). Beginner-to-intermediate AI/JARVIS-style assistant systems integrating vision, voice, and logic. Small automation tools, scripts, and experiments while balancing Class 10 academics."
  },
  {
    icon: <Handshake className="h-6 w-6 text-primary" />,
    title: "I'm looking to collaborate on",
    content: "Computer Vision projects (OpenCV, MediaPipe, YOLO basics). Beginner-friendly AI, robotics, and automation ideas. Open-source tools that help students learn coding faster and smarter."
  },
  {
    icon: <BrainCircuit className="h-6 w-6 text-primary" />,
    title: "I'm currently learning",
    content: "Python (advanced concepts, clean code, structure). Backend basics (Node.js versions, APIs, automation tools). Core CS thinking: algorithms, logic, and system design."
  }
];

const skills = [
  'React', 'Next.js', 'TypeScript', 'Python', 'OpenCV', 'Node.js',
  'Firebase', 'Tailwind CSS', 'Three.js', 'GSAP', 'Computer Vision', 'AI/ML'
];

export function About() {
  return (
    <section id="about" className="container mx-auto py-24 relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <InfiniteMarquee items={skills} speed={36} direction="left" />
      </div>

      <div className="relative z-10 section-shell p-6 md:p-8 lg:p-12 space-y-10">
        <div className="grid lg:grid-cols-[1.05fr_1.1fr] gap-8 lg:gap-10 items-start">
          <ScrollReveal className="relative" delay={0.15}>
            <div className="relative flex justify-center lg:block">
              <div className="absolute -inset-6 rounded-[28px] bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent blur-2xl" aria-hidden />
              <PixelCard variant="pink" className="rounded-[28px] overflow-hidden h-full max-w-[300px] w-full">
                <Image
                  src="https://i.ibb.co/wrMzQqgD/IMG-20251229-190558-670-2.jpg"
                  alt="Sarthak"
                  fill
                  priority
                  className="absolute inset-0 w-full h-full object-cover"
                  data-cursor-variant="project"
                  data-cursor-label="Move"
                />
              </PixelCard>
              <div className="absolute -bottom-6 left-6 bg-white/10 backdrop-blur-xl border border-white/15 px-4 py-2 rounded-full text-xs uppercase tracking-[0.3em]">
                Frontend / Motion / AI
              </div>
            </div>
          </ScrollReveal>

          <div className="space-y-6">
            <ScrollFloat className="font-headline text-4xl md:text-5xl font-bold text-white">
              About the Studio
            </ScrollFloat>

            <TextSplitReveal
              className="text-white/80 text-lg leading-relaxed"
              delay={0.25}
            >
              I craft atmospheric digital stories—interfaces with personality, choreography, and intent. Every screen is a stage:
              glassy layers, brutalist edges, fluid type, and motion that reacts to you.
            </TextSplitReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aboutSections.map((item, index) => (
                <ScrollReveal key={index} delay={0.12 * index} direction="up">
                  <Card className="bg-card/60 backdrop-blur-md border-white/10 hover:border-primary/50 transition-all duration-300 h-full mask-shine">
                    <CardHeader className="flex flex-row items-center gap-4">
                      {item.icon}
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{item.content}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-4">
              {[
                { icon: <Zap className="h-5 w-5" />, title: 'Micro-interactions', copy: 'Spring physics, cursor spotlights, tactile haptics for every hover.' },
                { icon: <BrainCircuit className="h-5 w-5" />, title: 'Systems Thinking', copy: 'Atomic components, adaptive grids, content-aware breakpoints.' },
                { icon: <Handshake className="h-5 w-5" />, title: 'Co-Creation', copy: 'I storyboard with you—moodboards, prototypes, and shipping with intent.' },
              ].map((item, idx) => (
                <ScrollReveal key={item.title} delay={0.15 * idx} direction="up">
                  <Card className="bg-gradient-to-br from-primary/10 via-card/40 to-secondary/10 border border-white/10 h-full">
                    <CardHeader className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white/10 grid place-items-center text-primary">
                        {item.icon}
                      </div>
                      <CardTitle>{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-white/80">{item.copy}</CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>

        <div id="skills" className="relative z-10">
          <ScrollFloat className="text-center font-headline text-3xl md:text-4xl font-bold mb-8 text-white">
            What we can riff on together
          </ScrollFloat>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Motion-first hero concepts with cinematic reveals',
              'Horizontal bento case studies and immersive scrolls',
              'Interactive WebGL canvases, particles, and parallax worlds',
              'Full-stack delivery: Next.js, TypeScript, Firebase ops'
            ].map((topic, index) => (
              <ScrollReveal key={index} delay={0.08 * index} direction="up">
                <Card className="bg-card/40 backdrop-blur-sm text-center p-6 border-white/10 hover:border-primary/50 transition-all duration-300 hover:translate-y-[-6px] mask-shine">
                  <p className="text-white/90">{topic}</p>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
