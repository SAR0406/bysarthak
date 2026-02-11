import { Github, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ContactForm } from '@/components/contact-form';

export function Contact() {
  return (
    <section id="contact" className="container mx-auto section-pad">
      <div className="mb-12 text-center">
        <p className="caption-sm mb-4">Connect</p>
        <h3 className="heading-md text-white">Connect with me</h3>
        <p className="body-sm max-line-body mx-auto mt-2">Find me on social platforms and professional channels.</p>
        <div className="mt-6 flex justify-center gap-6">
          <Link
            href="https://github.com/SAR0406"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Sarthak's Github Profile"
          >
            <Button variant="outline" size="icon" className="h-16 w-16 rounded-full transition-transform hover:scale-110">
              <Github className="h-8 w-8" />
            </Button>
          </Link>
          <Link href="https://www.linkedin.com/in/sarthak-sharma-51a892243/" aria-label="Sarthak's LinkedIn Profile">
            <Button variant="outline" size="icon" className="h-16 w-16 rounded-full transition-transform hover:scale-110">
              <Linkedin className="h-8 w-8" />
            </Button>
          </Link>
          <Link href="https://x.com/Sarthak44201143" aria-label="Sarthak's Twitter Profile">
            <Button variant="outline" size="icon" className="h-16 w-16 rounded-full transition-transform hover:scale-110">
              <Twitter className="h-8 w-8" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-center">
        <h2 className="heading-lg max-line-headline mx-auto text-white">Get In Touch</h2>
      </div>

      <ContactForm />
    </section>
  );
}
