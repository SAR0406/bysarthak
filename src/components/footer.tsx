'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, ArrowUpRight } from 'lucide-react';

const socials = [
  { icon: <Github className="h-5 w-5" />, href: 'https://github.com/SAR0406', label: 'GitHub' },
  { icon: <Linkedin className="h-5 w-5" />, href: 'https://www.linkedin.com/in/sarthak-sharma-51a892243/', label: 'LinkedIn' },
  { icon: <Twitter className="h-5 w-5" />, href: 'https://x.com/Sarthak44201143', label: 'Twitter/X' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 overflow-hidden rounded-t-[32px] border border-white/10 bg-gradient-to-b from-white/10 via-black/40 to-black/70 px-6 py-16 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(158,240,26,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(82,39,255,0.15),transparent_40%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-10 text-center">
        <motion.h2
          className="font-headline text-4xl leading-tight text-white md:text-6xl lg:text-7xl"
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          viewport={{ once: true }}
        >
          LET&apos;S TALK — BUILD SOMETHING CINEMATIC.
        </motion.h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {socials.map((social) => (
            <motion.div
              key={social.label}
              whileHover={{ y: -4, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 240, damping: 16 }}
            >
              <Link
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-white transition duration-300 hover:border-primary/40 hover:bg-primary/10"
                data-cursor="link"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-primary">
                  {social.icon}
                </span>
                <span className="text-sm font-medium">{social.label}</span>
                <ArrowUpRight className="h-4 w-4 opacity-50 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100" />
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="text-sm text-white/50">
          © {year} Sarthak • Crafted with motion, light, and a sprinkle of chaos.
        </div>
      </div>
    </footer>
  );
}
