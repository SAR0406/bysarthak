import { ProjectCard } from "@/components/project-card";
import { Repo } from "@/types";

async function getGithubRepos(): Promise<Repo[]> {
  try {
    const res = await fetch(
      "https://api.github.com/users/SAR0406/repos?sort=pushed&per_page=14",
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
      <h2 className="text-center font-headline text-3xl md:text-4xl font-bold mb-12">
        Featured Projects
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {repos.map((repo) => (
          <ProjectCard key={repo.id} repo={repo} />
        ))}
      </div>
    </section>
  );
}
