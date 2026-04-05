'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MagneticButton } from './magnetic-button';
import { Github, Linkedin, Twitter, Mail } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Github size={24} />, href: 'https://github.com/SAR0406', label: 'GitHub' },
    { icon: <Linkedin size={24} />, href: 'https://linkedin.com/in/sarthak', label: 'LinkedIn' },
    { icon: <Twitter size={24} />, href: 'https://twitter.com/sarthak', label: 'Twitter' },
    { icon: <Mail size={24} />, href: 'mailto:contact@sarthak.com', label: 'Email' },
  ];

  return (
    <footer className="relative bg-black overflow-hidden">
      {/* Massive unfolding section */}
      <div className="relative py-32 md:py-48">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="container mx-auto px-4"
        >
          <motion.h2
            className="font-headline text-6xl md:text-8xl lg:text-[12rem] font-bold text-center leading-none tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, #5227FF 0%, #E879F9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            LET'S TALK
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-center text-white/60 text-xl md:text-2xl mt-8 max-w-2xl mx-auto"
          >
            Have a project in mind? Let's create something extraordinary together.
          </motion.p>

          {/* Magnetic Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex items-center justify-center gap-6 mt-16"
          >
            {socialLinks.map((link, index) => (
              <Link key={index} href={link.href} target="_blank" rel="noopener noreferrer">
                <MagneticButton
                  className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all duration-300"
                  aria-label={link.label}
                >
                  {link.icon}
                </MagneticButton>
              </Link>
            ))}
          </motion.div>
        </motion.div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -z-10" />
      </div>

      {/* Footer bottom */}
      <div className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              &copy; {currentYear} Sarthak. Crafted with passion and precision.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-white/40 hover:text-white text-sm transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-white/40 hover:text-white text-sm transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

