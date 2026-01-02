"use client";

import { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { useInView } from 'react-intersection-observer';

type SkillProgressProps = {
  name: string;
  level: number;
};

export function SkillProgress({ name, level }: SkillProgressProps) {
  const [progress, setProgress] = useState(0);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => setProgress(level), 100);
      return () => clearTimeout(timer);
    }
  }, [inView, level]);

  return (
    <div ref={ref} className="w-full">
      <div className="flex justify-between items-center mb-1">
        <h4 className="font-medium text-sm">{name}</h4>
        <span className="text-xs text-muted-foreground">{level}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
