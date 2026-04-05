import { Repo } from "@/types";

export async function getGithubRepos(): Promise<Repo[]> {
  const token = process.env.GITHUB_ACCESS_TOKEN;
  const headers: HeadersInit = {};

  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  try {
    const res = await fetch(
      "https://api.github.com/users/SAR0406/repos?sort=pushed&per_page=100",
      {
        headers,
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.warn(`GitHub API warning: ${res.status} ${res.statusText}`);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return [];
  }
}
