import { ExperienceShell } from "@/components/experience-shell";
import { getGithubRepos } from "@/lib/github";

export default async function Home() {
  const repos = await getGithubRepos();

  return <ExperienceShell repos={repos} />;
}
