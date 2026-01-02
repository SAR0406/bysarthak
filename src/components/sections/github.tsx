import type { Repo } from "@/types";
import { RepoCard } from "@/components/repo-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Github } from 'lucide-react';

async function getGithubRepos(): Promise<Repo[]> {
  try {
    const res = await fetch(
      "https://api.github.com/users/SAR0406/repos?sort=pushed&per_page=6",
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );

    if (!res.ok) {
      console.error("Failed to fetch GitHub repos");
      return [];
    }
    
    return res.json();
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return [];
  }
}

export async function GithubSection() {
  const repos = await getGithubRepos();

  return (
    <section id="github" className="bg-muted/50 dark:bg-card/50 py-24">
      <div className="container mx-auto">
        <h2 className="text-center font-headline text-3xl md:text-4xl font-bold mb-12">
          Latest on GitHub
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Button asChild size="lg" variant="outline">
            <Link href="https://github.com/SAR0406" target="_blank" rel="noopener noreferrer">
              <Github className="mr-2 h-4 w-4" />
              View All on GitHub
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
