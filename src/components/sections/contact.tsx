
import { Github, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SimpleContactForm } from '@/components/simple-contact-form';

export function Contact() {
  return (
    <section id="contact" className="container mx-auto py-24">
      <div className="text-center mb-12">
        <h3 className="text-xl font-semibold">Connect with me</h3>
        <p className="text-muted-foreground mt-2">Find me on social media</p>
        <div className="flex justify-center gap-6 mt-6">
          <Link
            href="https://github.com/SAR0406"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full transition-transform hover:scale-110">
              <Github className="w-8 h-8" />
            </Button>
          </Link>
          <Link href="#">
            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full transition-transform hover:scale-110">
              <Linkedin className="w-8 h-8" />
            </Button>
          </Link>
          <Link href="#">
            <Button variant="outline" size="icon" className="w-16 h-16 rounded-full transition-transform hover:scale-110">
              <Twitter className="w-8 h-8" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-center">
        <h2 className="font-headline text-3xl md:text-4xl font-bold">Get In Touch</h2>
      </div>

      <SimpleContactForm />
    </section>
  );
}
