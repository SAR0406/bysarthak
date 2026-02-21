
import { Skeleton } from "@/components/ui/skeleton";

export function WorkSkeleton() {
  return (
    <section id="work" className="container mx-auto py-16">
      <div className="text-center">
        <Skeleton className="h-10 w-48 mx-auto mb-4" />
        <Skeleton className="h-4 w-full max-w-2xl mx-auto mb-12" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
      <div className="text-center mt-12">
        <Skeleton className="h-12 w-48 mx-auto" />
      </div>
    </section>
  );
}
