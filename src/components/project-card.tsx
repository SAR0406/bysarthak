import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Repo } from "@/types";
import { Github, ExternalLink, Code, Star, GitFork } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type ProjectCardProps = {
  repo: Repo;
};

export function ProjectCard({ repo }: ProjectCardProps) {
  return (
    <Card className="h-full flex flex-col group border-2 border-transparent hover:border-primary transition-all duration-300">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            <Link href={repo.html_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-lg hover:underline truncate">
              {repo.name}
            </Link>
          </div>
          {repo.homepage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon">
                    <Link href={repo.homepage} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-5 h-5 text-muted-foreground" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open App</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <p className="text-sm text-muted-foreground h-16 line-clamp-3 mb-4">
            {repo.description || "No description provided."}
          </p>
          <div className="flex flex-wrap gap-1 mb-4">
            {(repo.topics || []).slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Code className="w-3 h-3"/> 
            <span>{repo.language || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-4">
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
      </CardContent>
    </Card>
  );
}
