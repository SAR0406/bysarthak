
import { ProjectCard } from "@/components/project-card";
import { Repo } from "@/types";
import { Button } from "../ui/button";
import Link from "next/link";
import { Github } from "lucide-react";

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

export async function Work() {
  const repos = await getGithubRepos();

  return (
    <section id="work" className="container mx-auto py-16">
      <div className="text-center">
        <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
          Projects
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
          Here are some of the projects I've been working on. You can find more on my GitHub profile.
        </p>
      </div>
      
      {repos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {repos.map((repo) => (
            <ProjectCard key={repo.id} repo={repo} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
          <p className="text-muted-foreground">Unable to load repositories at the moment. Please visit GitHub directly.</p>
        </div>
      )}

      <div className="text-center mt-12">
        <Button asChild size="lg" variant="outline">
          <Link href="https://github.com/SAR0406" target="_blank" rel="noopener noreferrer">
            <Github className="mr-2 h-4 w-4" />
            View All on GitHub
          </Link>
        </Button>
      </div>
    </section>
  );
}
