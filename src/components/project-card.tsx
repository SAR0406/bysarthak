import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Repo } from "@/types";
import { Github, Star, GitFork } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

type ProjectCardProps = {
  repo: Repo;
};

export function ProjectCard({ repo }: ProjectCardProps) {
  const allTopics = repo.language ? [repo.language, ...(repo.topics || [])] : repo.topics || [];

  return (
    <Card className="h-full flex flex-col group border-2 border-transparent hover:border-primary transition-all duration-300">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={repo.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group/link">
            <Github className="w-5 h-5" />
            <span className="font-semibold text-lg group-hover/link:underline truncate">
              {repo.name}
            </span>
          </Link>
          <div className="flex items-center text-xs text-muted-foreground gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>{repo.stargazers_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              <span>{repo.forks_count}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 flex-grow">
        <p className="text-sm text-muted-foreground h-12 line-clamp-2 mb-4">
          {repo.description || "No description provided."}
        </p>
        <div className="flex flex-wrap gap-1">
          {allTopics.slice(0, 4).map((topic) => (
            <Badge key={topic} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {repo.homepage && (
          <Button asChild className="w-full">
            <Link href={repo.homepage} target="_blank" rel="noopener noreferrer">
              See Project
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
