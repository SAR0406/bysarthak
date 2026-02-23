
import { Github, Linkedin, Twitter, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Contact() {
  return (
    <section id="contact" className="container mx-auto py-24">
      <div className="text-center mb-12">
        <h2 className="font-headline text-3xl md:text-4xl font-bold">Get In Touch</h2>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Have a question or want to work together? Send me a message. I'd love to hear from you.
        </p>
        <Button asChild size="lg" className="mt-6">
            <Link href="/admin">
                <MessageSquare className="mr-2 h-5 w-5" /> Start a Conversation
            </Link>
        </Button>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-semibold">Connect with me</h3>
        <p className="text-muted-foreground mt-2">Find me on social media</p>
        <div className="flex justify-center gap-6 mt-6">
          <Link
            href="https://github.com/SAR0406"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Sarthak's Github Profile"
          >
            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full transition-transform hover:scale-110">
              <Github className="w-8 h-8" />
            </Button>
          </Link>
          <Link href="https://www.linkedin.com/in/sarthak-sharma-51a892243/" aria-label="Sarthak's LinkedIn Profile">
            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full transition-transform hover:scale-110">
              <Linkedin className="w-8 h-8" />
            </Button>
          </Link>
          <Link href="https://x.com/Sarthak44201143" aria-label="Sarthak's Twitter Profile">
            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full transition-transform hover:scale-110">
              <Twitter className="w-8 h-8" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
