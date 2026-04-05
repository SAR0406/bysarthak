'use client';

import { Github, Linkedin, Twitter, MessageSquare, Mail, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const socials = [
  { icon: <Github className="h-5 w-5" />, href: 'https://github.com/SAR0406', label: 'GitHub' },
  { icon: <Linkedin className="h-5 w-5" />, href: 'https://www.linkedin.com/in/sarthak-sharma-51a892243/', label: 'LinkedIn' },
  { icon: <Twitter className="h-5 w-5" />, href: 'https://x.com/Sarthak44201143', label: 'Twitter/X' },
];

export function Contact() {
  return (
    <section id="contact" className="mx-auto mt-10 w-full max-w-6xl px-6 pb-20">
      <motion.div
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/40 p-10 backdrop-blur-2xl shadow-[0_30px_120px_rgba(0,0,0,0.5)]"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
        viewport={{ once: true }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(158,240,26,0.15),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(82,39,255,0.18),transparent_40%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-[0.22em] text-primary">Collab / inquiries</div>
            <h2 className="font-headline text-3xl leading-tight text-white md:text-4xl lg:text-5xl">
              Let’s build experiences that feel impossible.
            </h2>
            <p className="max-w-2xl text-white/70">
              Tell me about your vision — I’ll translate it into kinetic prototypes, expressive visuals, and production-grade
              interfaces that hum with personality.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild size="lg" data-cursor="link" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/admin">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Start a conversation
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                data-cursor="link"
                className="border-white/20 bg-white/10 text-white hover:border-primary/50 hover:bg-primary/10"
              >
                <Link href="mailto:sarthak@portfolio.studio">
                  <Mail className="mr-2 h-5 w-5" />
                  Email me
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm uppercase tracking-[0.18em] text-white/60">
              <div className="flex items-center justify-between">
                <span>Availability</span>
                <span className="flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-primary">New slots open</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {socials.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition duration-300 hover:border-primary/40 hover:bg-primary/10"
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="link"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-primary">
                      {social.icon}
                    </div>
                    <span className="font-medium">{social.label}</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 opacity-60 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
