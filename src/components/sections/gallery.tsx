import Image from "next/image";
import { getGalleryImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ScrollFloat from "../ScrollFloat";

export function Gallery() {
  const images = getGalleryImages();
  const [img1, img2, img3, img4, img5] = images;

  // Golden ratio
  const gr = 1.618;

  return (
    <section id="gallery" className="container mx-auto py-16">
      <ScrollFloat as="h2" className="text-center font-headline text-3xl md:text-4xl font-bold mb-12">
        Visual Explorations
      </ScrollFloat>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full md:h-[618px]">
        {/* Main large image (landscape) */}
        {img1 && (
          <div className="md:col-span-3 md:row-span-2 relative h-64 md:h-auto rounded-lg overflow-hidden group">
            <Image
              src={img1.imageUrl}
              alt={img1.description}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={img1.imageHint}
            />
          </div>
        )}

        {/* Small image (landscape) */}
        {img2 && (
          <div className="md:col-span-2 relative h-48 md:h-auto rounded-lg overflow-hidden group">
            <Image
              src={img2.imageUrl}
              alt={img2.description}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={img2.imageHint}
            />
          </div>
        )}
        
        {/* Tall image (portrait) */}
        {img3 && (
          <div className="md:col-span-1 md:row-span-2 relative h-96 md:h-auto rounded-lg overflow-hidden group">
            <Image
              src={img3.imageUrl}
              alt={img3.description}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={img3.imageHint}
            />
          </div>
        )}

        {/* Square image */}
        {img4 && (
          <div className="md:col-span-1 relative h-64 md:h-auto aspect-square rounded-lg overflow-hidden group">
            <Image
              src={img4.imageUrl}
              alt={img4.description}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={img4.imageHint}
            />
          </div>
        )}

        {/* Small landscape image */}
         {img5 && (
          <div className="md:col-span-2 relative h-48 md:h-auto rounded-lg overflow-hidden group">
            <Image
              src={img5.imageUrl}
              alt={img5.description}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={img5.imageHint}
            />
          </div>
        )}
      </div>
    </section>
  );
}
