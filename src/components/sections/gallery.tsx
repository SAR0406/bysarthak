import Image from "next/image";
import { getGalleryImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ScrollFloat from "../ScrollFloat";

export function Gallery() {
  const images = getGalleryImages();
  const [img1, img2, img3, img4, img5] = images;

  // Golden ratio for layout
  const gr = 1.618;

  return (
    <section id="gallery" className="container mx-auto py-16">
       <ScrollFloat className="text-center font-headline text-3xl md:text-4xl font-bold mb-12">
        Visual Explorations
      </ScrollFloat>

      <div 
        className="grid grid-cols-1 md:grid-cols-[1.618fr_1fr] md:grid-rows-[1fr_1.618fr] gap-4"
        style={{ height: 'calc(100vh - 200px)', maxHeight: '800px' }}
      >
        {/* Large main image */}
        {img1 && (
          <div className="md:col-start-1 md:col-end-2 md:row-start-1 md:row-end-3 relative h-96 md:h-auto rounded-lg overflow-hidden group">
            <Image
              src={img1.imageUrl}
              alt={img1.description}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={img1.imageHint}
            />
          </div>
        )}

        {/* Top right image */}
        {img2 && (
          <div className="md:col-start-2 md:col-end-3 md:row-start-1 md:row-end-2 relative h-64 md:h-auto rounded-lg overflow-hidden group">
            <Image
              src={img2.imageUrl}
              alt={img2.description}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={img2.imageHint}
            />
          </div>
        )}
        
        {/* Bottom right images (split into two) */}
        <div className="md:col-start-2 md:col-end-3 md:row-start-2 md:row-end-3 grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {img3 && (
              <div className="relative h-64 md:h-auto rounded-lg overflow-hidden group">
                <Image
                  src={img3.imageUrl}
                  alt={img3.description}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={img3.imageHint}
                />
              </div>
            )}
            {img4 && (
              <div className="relative h-64 md:h-auto rounded-lg overflow-hidden group">
                 <Image
                  src={img4.imageUrl}
                  alt={img4.description}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={img4.imageHint}
                />
              </div>
            )}
        </div>
      </div>
    </section>
  );
}
