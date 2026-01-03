import { ProjectCard } from "@/components/project-card";
import { Repo } from "@/types";
import { Button } from "../ui/button";
import Link from "next/link";
import { Github } from "lucide-react";

async function getGithubRepos(): Promise<Repo[]> {
  try {
    const res = await fetch(
      "https://api.github.com/users/SAR0406/repos?sort=pushed&per_page=8",
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {repos.map((repo) => (
          <ProjectCard key={repo.id} repo={repo} />
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
    </section>
  );
}
