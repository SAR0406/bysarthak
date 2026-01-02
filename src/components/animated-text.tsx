"use client";

import { cn } from "@/lib/utils";

type AnimatedTextProps = {
  text: string;
  className?: string;
};

export function AnimatedText({ text, className }: AnimatedTextProps) {
  return (
    <div className={cn("flex flex-wrap justify-center", className)}>
      {Array.from(text).map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="animate-char-in"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}
