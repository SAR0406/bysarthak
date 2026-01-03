import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Handshake, BrainCircuit, Zap } from 'lucide-react';
import PixelCard from '../PixelCard';
import ScrollFloat from '../ScrollFloat';

const profileImageUrl = "https://i.ibb.co/wrMzQqgD/IMG-20251229-190558-670-2.jpg";

const aboutSections = [
  {
    icon: <Rocket className="h-6 w-6 text-primary" />,
    title: "I’m currently working on",
    content: "Python + OpenCV projects for real-time camera intelligence (person detection, interaction, automation). Beginner-to-intermediate AI/JARVIS-style assistant systems integrating vision, voice, and logic. Small automation tools, scripts, and experiments while balancing Class 10 academics."
  },
  {
    icon: <Handshake className="h-6 w-6 text-primary" />,
    title: "I’m looking to collaborate on",
    content: "Computer Vision projects (OpenCV, MediaPipe, YOLO basics). Beginner-friendly AI, robotics, and automation ideas. Open-source tools that help students learn coding faster and smarter."
  },
  {
    icon: <BrainCircuit className="h-6 w-6 text-primary" />,
    title: "I’m currently learning",
    content: "Python (advanced concepts, clean code, structure). Computer Vision & AI fundamentals. Backend basics (Node.js versions, APIs, automation tools). Core CS thinking: algorithms, logic, and system design."
  }
];

export function About() {
  return (
    <section id="about" className="container mx-auto py-16">
      <div className="grid md:grid-cols-3 gap-12 items-start">
        <div className="flex justify-center md:col-span-1">
          <PixelCard variant="pink" className='rounded-full'>
             <Image
              src={profileImageUrl}
              alt="Sarthak"
              fill
              className="object-cover rounded-full absolute inset-0 z-0"
            />
          </PixelCard>
        </div>
        <div className="md:col-span-2 space-y-8">
          <ScrollFloat className="font-headline text-3xl md:text-4xl font-bold text-white">💫 About Me</ScrollFloat>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aboutSections.map((item, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center gap-4">
                  {item.icon}
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.content}</p>
                </CardContent>
              </Card>
            ))}
             <Card className="bg-card/50 backdrop-blur-sm md:col-span-2">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Zap className="h-6 w-6 text-primary" />
                    <CardTitle className="text-lg">Fun Fact</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">I’m building Iron Man–level ideas with student-level resources — limitations don’t stop innovation.</p>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
       <div id="skills" className="mt-24">
         <ScrollFloat className="text-center font-headline text-2xl md:text-3xl font-bold mb-12 text-white">Ask Me About</ScrollFloat>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="bg-card/50 backdrop-blur-sm text-center p-6">
                <p>Python projects for beginners → intermediate</p>
            </Card>
            <Card className="bg-card/50 backdrop-blur-sm text-center p-6">
                <p>Camera-based detection systems</p>
            </Card>
             <Card className="bg-card/50 backdrop-blur-sm text-center p-6">
                <p>Study-tech balance as a Class 10 student</p>
            </Card>
             <Card className="bg-card/50 backdrop-blur-sm text-center p-6">
                <p>How to think like an engineer, not just a coder</p>
            </Card>
         </div>
      </div>
    </section>
  );
}
