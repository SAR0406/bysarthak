'use client';

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Repo } from "@/types";
import { Github, Star, GitFork, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

type ProjectCardProps = {
  repo: Repo;
};

export function ProjectCard({ repo }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const allTopics = repo.language ? [repo.language, ...(repo.topics || [])] : repo.topics || [];

  return (
    <motion.div
      className="h-full project-card"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.03, y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      data-cursor-variant="project"
      data-cursor-label="View"
    >
      <Card className="h-full flex flex-col group border border-white/10 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-xl hover:border-primary/50 transition-all duration-500 relative overflow-hidden">
        {/* Gradient overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
          animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
        />

        {/* Animated corner accent */}
        <motion.div
          className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -z-10"
          animate={isHovered ? { scale: 1.5, opacity: 0.5 } : { scale: 1, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />

        <CardHeader className="p-6 pb-4 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <motion.h3
              className="font-headline font-bold text-xl text-white group-hover:text-primary transition-colors duration-300"
              animate={isHovered ? { x: 4 } : { x: 0 }}
            >
              {repo.name}
            </motion.h3>
            <div className="flex items-center text-xs text-muted-foreground gap-4 shrink-0">
              <motion.div
                className="flex items-center gap-1"
                whileHover={{ scale: 1.1 }}
              >
                <Star className="w-3 h-3" />
                <span>{repo.stargazers_count}</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-1"
                whileHover={{ scale: 1.1 }}
              >
                <GitFork className="w-3 h-3" />
                <span>{repo.forks_count}</span>
              </motion.div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 flex-grow flex flex-col gap-4 relative z-10">
          <p className="text-sm text-white/70 flex-grow leading-relaxed">
            {repo.description || "No description provided."}
          </p>
          <div className="flex flex-wrap gap-2">
            {allTopics.slice(0, 4).map((topic, index) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Badge
                  variant="secondary"
                  className="text-xs bg-white/10 hover:bg-primary/20 transition-colors border border-white/10"
                >
                  {topic}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 relative z-10">
          {repo.homepage && (
            <Button
              asChild
              className="w-full bg-primary/20 hover:bg-primary border border-primary/30 hover:border-primary text-white group/btn"
              variant="outline"
            >
              <Link href={repo.homepage} target="_blank" rel="noopener noreferrer">
                <span className="flex items-center gap-2">
                  See Project
                  <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </span>
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
