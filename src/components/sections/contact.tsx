
'use client';

import { Github, Linkedin, Twitter, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function Contact() {
  return (
    <section id="contact" className="container mx-auto py-24">
      <div className="section-shell p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-40 pointer-events-none" />
        <motion.div
          className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold text-gradient leading-tight"
          initial={{ scale: 0.94, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          LET&apos;S BUILD THE NEXT<br className="hidden md:block" /> CINEMATIC INTERFACE
        </motion.div>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
          Bring the idea. I&apos;ll architect the motion language, break the grid, and ship experiences that feel alive across every breakpoint.
        </p>
        <Button asChild size="lg" className="mt-8 bg-primary text-background hover:bg-primary/90" data-cursor-label="Start">
          <Link href="/admin">
            <MessageSquare className="mr-2 h-5 w-5" /> Start a Conversation
          </Link>
        </Button>
      </div>

      <div className="mt-10 section-shell p-6 md:p-8 text-center">
        <h3 className="text-xl font-semibold text-white">Connect with me</h3>
        <p className="text-muted-foreground mt-2">Magnetic socials—pull to interact.</p>
        <div className="flex justify-center gap-6 mt-6 flex-wrap">
          {[
            { href: "https://github.com/SAR0406", label: "GitHub", icon: <Github className="w-8 h-8" /> },
            { href: "https://www.linkedin.com/in/sarthak-sharma-51a892243/", label: "LinkedIn", icon: <Linkedin className="w-8 h-8" /> },
            { href: "https://x.com/Sarthak44201143", label: "Twitter", icon: <Twitter className="w-8 h-8" /> },
          ].map((social) => (
            <Link
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Sarthak's ${social.label} Profile`}
              data-cursor-label={social.label}
              data-cursor-variant="link"
            >
              <motion.div
                className="w-16 h-16 rounded-full border border-white/10 bg-card/70 flex items-center justify-center text-white/90"
                whileHover={{ scale: 1.15, rotate: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              >
                {social.icon}
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
