import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Repo } from "@/types";
import { ExternalLink, Github, Star, GitFork } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

type ProjectCardProps = {
  repo: Repo;
};

export function ProjectCard({ repo }: ProjectCardProps) {
  const allTopics = repo.language ? [repo.language, ...(repo.topics || [])] : repo.topics || [];
  const hasImage = Boolean(repo.image_url);
  const homepageLabel = repo.homepage?.toLowerCase().includes("case") ? "Case Study" : "Live Preview";

  return (
    <Card className="group flex h-full flex-col overflow-hidden border border-white/10 bg-slate-950/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/70 hover:bg-slate-950/80 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.45),0_16px_30px_-18px_rgba(14,165,233,0.35)]">
      <CardHeader className="space-y-4 p-5">
        <div className="relative h-28 overflow-hidden rounded-md border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
          {hasImage && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${repo.image_url})` }}
              aria-hidden="true"
            />
          )}
          {!hasImage && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.35),transparent_50%)]" aria-hidden="true" />}
          {repo.language && (
            <div
              className="absolute inset-x-0 bottom-0 h-1.5"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--primary)) 0%, rgba(56, 189, 248, 0.7) 40%, rgba(59, 130, 246, 0.5) 100%)",
              }}
              aria-label={`${repo.language} color strip`}
            />
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-semibold tracking-tight text-card-foreground">{repo.name}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
              <Star className="h-3 w-3" />
              {repo.stargazers_count}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
              <GitFork className="h-3 w-3" />
              {repo.forks_count}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-0">
        <p className="line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
          {repo.description || "No description provided."}
        </p>
        <div className="flex flex-wrap gap-2">
          {allTopics.slice(0, 4).map((topic) => (
            <Badge key={topic} variant="secondary" className="border border-white/10 bg-white/[0.05] text-xs text-muted-foreground">
              {topic}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-auto grid grid-cols-2 gap-2 p-5 pt-0">
        {repo.homepage && (
          <Button asChild className="w-full" variant="outline">
            <Link href={repo.homepage} target="_blank" rel="noopener noreferrer">
              {homepageLabel}
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
        <Button asChild className={repo.homepage ? "w-full" : "col-span-2 w-full"} variant="secondary">
          <Link href={repo.html_url} target="_blank" rel="noopener noreferrer">
            Source
            <Github className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
