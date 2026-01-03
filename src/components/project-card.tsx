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
        <div className="relative h-60 w-full overflow-hidden bg-muted flex items-center justify-center">
            <Github className="w-24 h-24 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary/30" />
        </div>
        <CardHeader>
            <CardTitle>{repo.name}</CardTitle>
            <CardDescription className="h-10 line-clamp-2">{repo.description || "No description provided."}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <div className="flex flex-wrap gap-2">
            {(repo.topics || []).map((tag) => (
                <Badge key={tag} variant="secondary">
                {tag}
                </Badge>
            ))}
            </div>
            {repo.language && (
                <div className="flex items-center text-sm text-muted-foreground mt-4">
                    <Code className="w-4 h-4 mr-2"/> 
                    <span>{repo.language}</span>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex gap-2">
            <Button asChild variant="outline" className="w-full">
                <Link href={repo.html_url} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2" />
                    GitHub
                </Link>
            </Button>
            {repo.homepage && (
                <Button asChild className="w-full">
                    <Link href={repo.homepage} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2" />
                        Live Demo
                    </Link>
                </Button>
            )}
        </CardFooter>
    </Card>
  );
}
