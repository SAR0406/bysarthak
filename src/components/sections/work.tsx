'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { Github, ExternalLink } from 'lucide-react';
import { Repo } from '@/types';
import { Button } from '../ui/button';

const textures = [
  'https://images.unsplash.com/photo-1520454974749-611b957a7bc6?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1518443791429-4b52502a3d2c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80',
];

type WorkProps = {
  repos: Repo[];
};

export function Work({ repos }: WorkProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-55%']);
  const smoothX = useSpring(x, { stiffness: 120, damping: 30, mass: 0.6 });

  const featured = useMemo(() => {
    const source = repos && repos.length > 0 ? repos.slice(0, 8) : [];
    if (source.length === 0) {
      return [
        {
          id: 1,
          title: 'Speculative OS',
          description: 'A cinematic desktop web shell with motion-controlled windows, shaders, and tactile sounds.',
          href: 'https://github.com/SAR0406',
          image: textures[0],
        },
        {
          id: 2,
          title: 'Neon Ledger',
          description: 'WebGL-ledger playground blending 3D light fields with realtime data stories.',
          href: 'https://github.com/SAR0406',
          image: textures[1],
        },
        {
          id: 3,
          title: 'Holo Rail',
          description: 'Immersive scroll thriller with horizontal narratives, cursor-magnetic CTAs, and kinetic type.',
          href: 'https://github.com/SAR0406',
          image: textures[2],
        },
        {
          id: 4,
          title: 'Aura Grid',
          description: 'Bento-grid experiments showcasing design systems, framer-motion, and glassmorphism.',
          href: 'https://github.com/SAR0406',
          image: textures[3],
        },
      ];
    }

    return source.map((repo, index) => ({
      id: repo.id,
      title: repo.name,
      description:
        repo.description ??
        'Experimental build — motion, sound-reactive visuals, and brutalist UI choreography.',
      href: repo.html_url,
      image: textures[index % textures.length],
    }));
  }, [repos]);

  return (
    <section
      id="work"
      ref={containerRef}
      className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Selected work</p>
          <h2 className="font-headline text-3xl text-white md:text-4xl">Horizontal story rail</h2>
          <p className="max-w-2xl text-white/70">
            A pinned, cinematic rail of projects — drag your eyes along a kinetic stream; hover to reveal liquified previews.
          </p>
        </div>
        <Button asChild variant="outline" size="lg" data-cursor="link" className="border-white/20 bg-white/5 text-white">
          <Link href="https://github.com/SAR0406" target="_blank" rel="noreferrer">
            <Github className="mr-2 h-4 w-4" />
            GitHub Profile
          </Link>
        </Button>
      </div>

      <div className="relative h-[160vh]">
        <div className="sticky top-28 flex h-[70vh] items-center overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.5)]">
          <motion.div style={{ x: smoothX }} className="flex h-full items-stretch gap-6 will-change-transform">
            {featured.map((project) => (
              <ProjectRailCard key={project.id} project={project} />
            ))}
          </motion.div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.14em]">
          Scroll-triggered reveal
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.14em]">
          Cursor distortions
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.14em]">
          Horizontal narrative
        </span>
      </div>
    </section>
  );
}

type Project = {
  id: number;
  title: string;
  description: string;
  href: string;
  image: string;
};

function ProjectRailCard({ project }: { project: Project }) {
  const [offset, setOffset] = useState({ x: 50, y: 50 });
  const gradientX = useMotionValue(50);
  const gradientY = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(280px at ${gradientX}% ${gradientY}%, rgba(158,240,26,0.15), transparent 55%)`;

  return (
    <motion.article
      className="group relative flex h-full w-[68vw] min-w-[320px] max-w-[420px] flex-col justify-between overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-black/30 p-6 text-white backdrop-blur-xl transition duration-500 hover:border-primary/40"
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setOffset({ x, y });
        gradientX.set(x);
        gradientY.set(y);
      }}
      onMouseLeave={() => {
        setOffset({ x: 50, y: 50 });
        gradientX.set(50);
        gradientY.set(50);
      }}
      data-cursor="project"
    >
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: spotlight,
          mixBlendMode: 'screen',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_45%)] opacity-60 transition duration-500 group-hover:opacity-90" />

      <div className="relative space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/70">
          <span>Experimental</span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span>Live</span>
        </div>
        <h3 className="font-headline text-2xl leading-tight text-white">{project.title}</h3>
        <p className="text-sm leading-relaxed text-white/70">{project.description}</p>
      </div>

      <div className="relative mt-6 flex-1 overflow-hidden rounded-2xl border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50 z-10" />
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 80vw, (max-width: 1280px) 420px, 420px"
          className="object-cover transition duration-700 group-hover:scale-110 group-hover:saturate-125"
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          priority={false}
        />
        <motion.div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            background: `radial-gradient(180px at ${offset.x}% ${offset.y}%, rgba(82,39,255,0.65), transparent 60%)`,
          }}
        />
      </div>

      <div className="relative mt-5 flex items-center justify-between text-sm text-white/70">
        <Link
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white transition duration-300 hover:border-primary/40 hover:bg-primary/10"
          data-cursor="project"
        >
          <ExternalLink className="h-4 w-4" />
          View project
        </Link>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em]">
          Hover for liquid preview
        </div>
      </div>
    </motion.article>
  );
}
