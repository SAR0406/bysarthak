import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Repo } from "@/types";
import { Github } from "lucide-react";
import Link from "next/link";

type ProjectCardProps = {
  repo: Repo;
};

export function ProjectCard({ repo }: ProjectCardProps) {

  return (
    <Link href={repo.html_url} target="_blank" rel="noopener noreferrer" className="h-full block">
        <Card className="h-full overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-2">
            <div className="relative h-60 w-full overflow-hidden bg-muted flex items-center justify-center">
                <Github className="w-24 h-24 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary/30" />
            </div>
            <CardHeader>
                <CardTitle>{repo.name}</CardTitle>
                <CardDescription className="h-10 line-clamp-2">{repo.description || "No description provided."}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                {(repo.topics || []).map((tag) => (
                    <Badge key={tag} variant="secondary">
                    {tag}
                    </Badge>
                ))}
                </div>
            </CardContent>
        </Card>
    </Link>
  );
}
