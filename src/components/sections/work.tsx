'use client';

import { ProjectCard } from "@/components/project-card";
import { Repo } from "@/types";
import { Button } from "../ui/button";
import Link from "next/link";
import { Github } from "lucide-react";
import { ScrollReveal } from "../scroll-reveal";
import { TextSplitReveal } from "../text-split-reveal";
import { use, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";

async function getGithubRepos(): Promise<Repo[]> {
  const token = process.env.GITHUB_ACCESS_TOKEN;
  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const res = await fetch(
      "https://api.github.com/users/SAR0406/repos?sort=pushed&per_page=100",
      {
        headers,
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );

    if (!res.ok) {
      // Don't crash if the API limit is hit or token is bad, just log and return empty
      console.warn(`GitHub API warning: ${res.status} ${res.statusText}`);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return [];
  }
}

type FeaturedProject = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  href: string;
  tech: string[];
};

const featuredProjects: FeaturedProject[] = [
  {
    title: 'Neon Atlas',
    subtitle: 'Cinematic OS-style portfolio surface',
    description: 'Floating glass, generative particle skies, magnetic UI with spring physics and scroll-synced text reveals.',
    image: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80',
    href: '#contact',
    tech: ['Next.js', 'GSAP', 'WebGL', 'Lenis'],
  },
  {
    title: 'Signal Grid',
    subtitle: 'Horizontal story rail',
    description: 'Pinned, horizontal scroll case study line with distorted hover previews, cursor spotlight, and F-pattern content.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    href: '#contact',
    tech: ['Framer Motion', 'Tailwind', 'ARIA'],
  },
  {
    title: 'Glasswork',
    subtitle: 'Glassmorphic research deck',
    description: 'Frosted layers with grain, adaptive typography, and content-aware breakpoints that preserve hierarchy.',
    image: 'https://images.unsplash.com/photo-1473181488821-2d23949a045a?auto=format&fit=crop&w=1200&q=80',
    href: '#contact',
    tech: ['TypeScript', 'Design Systems', 'Accessibility'],
  },
  {
    title: 'Motion Lab',
    subtitle: 'Micro-interaction kit',
    description: 'Spring-calibrated buttons, cursor intentions, hover morphs, and soft 3D parallax cards ready to drop into builds.',
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    href: '#contact',
    tech: ['Framer Motion', 'GSAP', 'Atomic Design'],
  },
];

export function Work() {
  const repos = use(getGithubRepos());
  const [hoveredProject, setHoveredProject] = useState<FeaturedProject | null>(null);
  const hoverX = useMotionValue(0);
  const hoverY = useMotionValue(0);
  const hoverOpacity = useSpring(hoveredProject ? 1 : 0, { stiffness: 260, damping: 30 });

  return (
    <section id="work" className="container mx-auto py-24 relative">
      <motion.div
        className="pointer-events-none fixed z-[60]"
        style={{ x: hoverX, y: hoverY, opacity: hoverOpacity }}
      >
        {hoveredProject && (
          <motion.div
            className="relative h-40 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white/5 backdrop-blur-2xl mix-blend-screen"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            <Image
              src={hoveredProject.image}
              alt={hoveredProject.title}
              fill
              className="object-cover saturate-125 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 mix-blend-screen" />
          </motion.div>
        )}
      </motion.div>

      <div className="text-center mb-16">
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="font-headline text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Selected Works
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <TextSplitReveal className="text-white/70 text-lg max-w-2xl mx-auto">
            Horizontal stories, bento cards, and kinetic case studies—each piece uses scroll velocity, custom cursors, and tactile reveals.
          </TextSplitReveal>
        </ScrollReveal>
      </div>

      <div className="relative section-shell p-3 md:p-8 overflow-hidden">
        <div className="flex gap-3 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide scroll-touch">
          {featuredProjects.map((project, index) => (
            <motion.div
              key={project.title}
              className="snap-start min-w-[260px] sm:min-w-[320px] md:min-w-[360px] lg:min-w-[420px] flex-shrink-0 section-shell bg-card/80 border-white/10 mask-shine"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              onMouseEnter={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                hoverX.set(e.clientX - rect.width * 0.15);
                hoverY.set(e.clientY - rect.height * 0.25);
                setHoveredProject(project);
              }}
              onMouseMove={(e) => {
                hoverX.set(e.clientX + 12);
                hoverY.set(e.clientY - 24);
              }}
              onMouseLeave={() => setHoveredProject(null)}
              data-cursor-variant="project"
              data-cursor-label="View"
            >
              <div className="relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-white/50">
                  <span>{project.subtitle}</span>
                  <span className="h-[1px] w-10 bg-white/30" />
                </div>
                <h3 className="font-headline text-2xl md:text-3xl text-white">{project.title}</h3>
                <p className="text-white/70 leading-relaxed">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <span key={tech} className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/80">
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Link
                    href={project.href}
                    className="text-gradient text-sm font-semibold uppercase tracking-[0.25em]"
                    data-cursor-variant="link"
                    data-cursor-label="Open"
                  >
                    Open Case Study
                  </Link>
                  <span className="text-white/60 text-xs">Hover for preview</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-16 space-y-8">
        <ScrollReveal direction="up" delay={0.15}>
          <h3 className="font-headline text-2xl md:text-3xl text-white">Latest GitHub drops</h3>
        </ScrollReveal>

        {repos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {repos.map((repo, index) => (
              <ScrollReveal key={repo.id} delay={0.08 * (index % 4)} direction="up">
                <ProjectCard repo={repo} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal direction="up" delay={0.2}>
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-card/20 backdrop-blur-sm">
              <p className="text-muted-foreground text-lg">
                Unable to load repositories at the moment. Please visit GitHub directly.
              </p>
            </div>
          </ScrollReveal>
        )}
      </div>

      <ScrollReveal className="text-center mt-16" delay={0.25}>
        <Button
          asChild
          size="lg"
          className="bg-primary hover:bg-primary/90 text-background border-0"
        >
          <Link href="https://github.com/SAR0406" target="_blank" rel="noopener noreferrer" data-cursor-label="Open">
            <Github className="mr-2 h-5 w-5" />
            View All on GitHub
          </Link>
        </Button>
      </ScrollReveal>
    </section>
  );
}
