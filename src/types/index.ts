export type Repo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  language: string | null;
  topics: string[];
  homepage: string | null;
  image_url?: string | null;
};
