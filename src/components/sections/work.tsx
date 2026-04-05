'use client';

import { ProjectCard } from "@/components/project-card";
import { Repo } from "@/types";
import { Button } from "../ui/button";
import Link from "next/link";
import { Github } from "lucide-react";
import { ScrollReveal } from "../scroll-reveal";
import { TextSplitReveal } from "../text-split-reveal";
import { use } from "react";

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

export function Work() {
  const repos = use(getGithubRepos());

  return (
    <section id="work" className="container mx-auto py-24">
      <div className="text-center mb-16">
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="font-headline text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Selected Works
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <TextSplitReveal className="text-white/60 text-lg max-w-2xl mx-auto">
            A collection of projects that showcase my passion for building exceptional digital experiences. Each one tells a unique story.
          </TextSplitReveal>
        </ScrollReveal>
      </div>

      {repos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {repos.map((repo, index) => (
            <ScrollReveal key={repo.id} delay={0.1 * (index % 4)} direction="up">
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

      <ScrollReveal className="text-center mt-16" delay={0.3}>
        <Button
          asChild
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white border-0"
        >
          <Link href="https://github.com/SAR0406" target="_blank" rel="noopener noreferrer">
            <Github className="mr-2 h-5 w-5" />
            View All on GitHub
          </Link>
        </Button>
      </ScrollReveal>
    </section>
  );
}

