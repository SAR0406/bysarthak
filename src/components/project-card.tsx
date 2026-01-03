import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Repo } from "@/types";
import { Github, ExternalLink, Code } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

type ProjectCardProps = {
  repo: Repo;
};

export function ProjectCard({ repo }: ProjectCardProps) {

  return (
    <Card className="h-full overflow-hidden group flex flex-col">
        <div className="relative h-40 w-full overflow-hidden bg-muted flex items-center justify-center">
            <Github className="w-20 h-20 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary/30" />
        </div>
        <CardHeader className="p-4">
            <CardTitle className="text-lg">{repo.name}</CardTitle>
            <CardDescription className="h-10 text-xs line-clamp-2">{repo.description || "No description provided."}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-4">
            <div className="flex flex-wrap gap-1">
            {(repo.topics || []).slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
                </Badge>
            ))}
            </div>
            {repo.language && (
                <div className="flex items-center text-xs text-muted-foreground mt-3">
                    <Code className="w-3 h-3 mr-1.5"/> 
                    <span>{repo.language}</span>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex gap-2 p-4">
            <Button asChild variant="outline" size="sm">
                <Link href={repo.html_url} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-1.5" />
                    GitHub
                </Link>
            </Button>
            {repo.homepage && (
                <Button asChild size="sm">
                    <Link href={repo.homepage} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1.5" />
                        Demo
                    </Link>
                </Button>
            )}
        </CardFooter>
    </Card>
  );
}
