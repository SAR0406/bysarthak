
'use client';

import { Button } from "./ui/button";

export function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-8 text-center">
      <h2 className="text-xl font-bold text-destructive mb-4">Something went wrong!</h2>
      <p className="text-destructive/80 mb-6">{error.message}</p>
      <Button onClick={reset} variant="destructive">
        Try Again
      </Button>
    </div>
  );
}
