import Link from "next/link";
import type { Repo } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, GitFork, Circle } from "lucide-react";

type RepoCardProps = {
  repo: Repo;
};

export function RepoCard({ repo }: RepoCardProps) {
  return (
    <Link href={repo.html_url} target="_blank" rel="noopener noreferrer" className="h-full">
      <Card className="h-full relative overflow-hidden group transition-all duration-300 hover:border-primary/50 hover:-translate-y-1">
        <div className="absolute top-0 left-[-100%] h-full w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite] group-hover:left-[100%]" />
        <CardHeader>
          <CardTitle className="truncate">{repo.name}</CardTitle>
          <CardDescription className="h-10 line-clamp-2">{repo.description || "No description available."}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {repo.language && <Circle className="h-3 w-3 text-primary fill-current" />}
              <span>{repo.language || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{repo.stargazers_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="h-4 w-4" />
                <span>{repo.forks_count}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
