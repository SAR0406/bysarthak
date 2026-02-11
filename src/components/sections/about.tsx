import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Handshake, BrainCircuit, Zap } from 'lucide-react';
import PixelCard from '../PixelCard';
import ScrollFloat from '../ScrollFloat';

const aboutSections = [
  {
    icon: <Rocket className="h-6 w-6 text-primary" />,
    title: "I’m currently building",
    content:
      "Python and OpenCV tools for real-time camera intelligence, from person detection to interaction automation. I also prototype beginner-friendly assistant systems that combine vision, voice, and logic while balancing school life.",
  },
  {
    icon: <Handshake className="h-6 w-6 text-primary" />,
    title: "I collaborate on",
    content:
      "Computer-vision projects using OpenCV, MediaPipe, and YOLO basics. I enjoy building practical open-source tools that help students learn coding faster, with clear workflows and focused documentation.",
  },
  {
    icon: <BrainCircuit className="h-6 w-6 text-primary" />,
    title: "I’m learning next",
    content:
      "Advanced Python architecture, backend foundations with Node.js APIs, and stronger CS fundamentals in algorithms, logic, and systems thinking to build reliable products with intent.",
  },
];

export function About() {
  return (
    <section id="about" className="container mx-auto section-pad">
      <div className="grid items-start gap-12 md:grid-cols-3">
        <div className="flex justify-center md:col-span-1">
          <PixelCard variant="pink" className="rounded-full">
            <img
              src="https://i.ibb.co/wrMzQqgD/IMG-20251229-190558-670-2.jpg"
              alt="Sarthak"
              className="absolute inset-0 h-full w-full rounded-full object-cover"
            />
          </PixelCard>
        </div>
        <div className="space-y-8 md:col-span-2">
          <p className="caption-sm">About</p>
          <ScrollFloat className="heading-lg max-line-headline text-white">About Me</ScrollFloat>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {aboutSections.map((item, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center gap-4">
                  {item.icon}
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="body-sm max-line-body">{item.content}</p>
                </CardContent>
              </Card>
            ))}
            <Card className="bg-card/50 backdrop-blur-sm md:col-span-2">
              <CardHeader className="flex flex-row items-center gap-4">
                <Zap className="h-6 w-6 text-primary" />
                <CardTitle className="text-lg">Perspective</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="body-sm max-line-body">
                  I build ambitious ideas with limited resources and a strong execution mindset.
                  Constraints sharpen creativity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div id="skills" className="mt-24">
        <p className="caption-sm mb-4 text-center">Capabilities</p>
        <ScrollFloat className="heading-md mb-12 text-center text-white">Ask Me About</ScrollFloat>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/50 p-6 text-center backdrop-blur-sm">
            <p className="body-sm mx-auto max-line-body">Python projects from beginner to intermediate level</p>
          </Card>
          <Card className="bg-card/50 p-6 text-center backdrop-blur-sm">
            <p className="body-sm mx-auto max-line-body">Camera-based detection systems for practical tasks</p>
          </Card>
          <Card className="bg-card/50 p-6 text-center backdrop-blur-sm">
            <p className="body-sm mx-auto max-line-body">Balancing deep technical growth with Class 10 academics</p>
          </Card>
          <Card className="bg-card/50 p-6 text-center backdrop-blur-sm">
            <p className="body-sm mx-auto max-line-body">Thinking like an engineer, not only like a coder</p>
          </Card>
        </div>
      </div>
    </section>
  );
}
