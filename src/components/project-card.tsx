import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaceHolderImages } from "@/lib/placeholder-images";

type ProjectCardProps = {
  id: number;
  title: string;
  description: string;
  tags: readonly string[];
  image: string;
};

export function ProjectCard({ title, description, tags, image }: ProjectCardProps) {
  const placeholder = PlaceHolderImages.find(p => p.id === image.replace('/placeholder-images.json/', ''));

  return (
    <Card className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-2">
      <div className="relative h-60 w-full overflow-hidden">
        <Image
          src={placeholder?.imageUrl || ''}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={placeholder?.imageHint}
        />
      </div>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
