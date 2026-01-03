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
    <Card className="h-full flex flex-col group border-2 bg-card hover:border-primary transition-all duration-300">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-start justify-between gap-4">
            <h3 className="font-bold text-xl text-primary-foreground">{repo.name}</h3>
            <div className="flex items-center text-xs text-muted-foreground gap-4 shrink-0">
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
      <CardContent className="p-6 pt-0 flex-grow flex flex-col gap-4">
        <p className="text-sm text-muted-foreground flex-grow">
          {repo.description || "No description provided."}
        </p>
        <div className="flex flex-wrap gap-2">
          {allTopics.slice(0, 4).map((topic) => (
            <Badge key={topic} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {repo.homepage && (
          <Button asChild className="w-full" variant="outline">
            <Link href={repo.homepage} target="_blank" rel="noopener noreferrer">
              See Project
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
