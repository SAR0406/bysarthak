
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
      {/* Skills Marquee Background */}
      <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 opacity-10 pointer-events-none">
        <InfiniteMarquee items={skills} speed={40} direction="left" />
      </div>

      <div className="grid md:grid-cols-3 gap-12 items-start relative z-10">
        <ScrollReveal className="flex justify-center md:col-span-1" delay={0.2}>
          <PixelCard variant="pink" className="rounded-full">
            <Image
              src="https://i.ibb.co/wrMzQqgD/IMG-20251229-190558-670-2.jpg"
              alt="Sarthak"
              fill
              priority
              className="absolute inset-0 w-full h-full object-cover rounded-full"
            />
          </PixelCard>
        </ScrollReveal>

        <div className="md:col-span-2 space-y-8">
          <ScrollFloat className="font-headline text-4xl md:text-5xl font-bold text-white">
            💫 About Me
          </ScrollFloat>

          <TextSplitReveal
            className="text-white/80 text-lg leading-relaxed"
            delay={0.3}
          >
            Building the future, one line of code at a time. I combine creativity with technical expertise to craft exceptional digital experiences that push boundaries and inspire innovation.
          </TextSplitReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {aboutSections.map((item, index) => (
              <ScrollReveal key={index} delay={0.1 * index} direction="up">
                <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] h-full">
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
            <ScrollReveal delay={0.4} direction="up" className="md:col-span-2">
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-sm border-primary/30">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Zap className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">Fun Fact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/90 leading-relaxed">I'm building Iron Man–level ideas with student-level resources — limitations don't stop innovation.</p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </div>

      <div id="skills" className="mt-32 relative z-10">
        <ScrollFloat className="text-center font-headline text-3xl md:text-4xl font-bold mb-12 text-white">
          Ask Me About
        </ScrollFloat>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            'Python projects for beginners → intermediate',
            'Camera-based detection systems',
            'Study-tech balance as a Class 10 student',
            'How to think like an engineer, not just a coder'
          ].map((topic, index) => (
            <ScrollReveal key={index} delay={0.1 * index} direction="up">
              <Card className="bg-card/30 backdrop-blur-sm text-center p-6 border-white/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:bg-card/50">
                <p className="text-white/90">{topic}</p>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
