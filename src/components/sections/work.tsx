import { ProjectCard } from "@/components/project-card";
import { Repo } from "@/types";
import { Button } from "../ui/button";
import Link from "next/link";
import { Github } from "lucide-react";

async function getGithubRepos(): Promise<Repo[]> {
  try {
    const res = await fetch(
      "https://api.github.com/users/SAR0406/repos?sort=pushed&per_page=100",
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
    <section id="work" className="container mx-auto section-pad">
      <div className="text-center">
        <p className="caption-sm mx-auto mb-4">Selected Projects</p>
        <h2 className="heading-lg max-line-headline mx-auto text-white">Projects</h2>
        <p className="body-md max-line-body mx-auto mb-12 mt-4">
          A curated set of recent builds across web engineering, automation, and practical
          experimentation.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {repos.map((repo) => (
          <ProjectCard key={repo.id} repo={repo} />
        ))}
      </div>
      <div className="mt-12 text-center">
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
