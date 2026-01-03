
import Image from "next/image";
import { getGalleryImages } from "@/lib/placeholder-images";
import ScrollFloat from "../ScrollFloat";

export function Gallery() {
  const images = getGalleryImages();
  const [img1, img2, img3, img4, img5] = images;

  return (
    <section id="gallery" className="container mx-auto py-16">
      <ScrollFloat className="text-center font-headline text-3xl md:text-4xl font-bold mb-12">
        Visual Explorations
      </ScrollFloat>

      <div className="flex flex-col md:flex-row gap-4" style={{ height: 'calc(80vh)', maxHeight: '700px' }}>
        {/* Main Image (Larger part of the Golden Ratio) */}
        {img1 && (
          <div className="flex-[1.618] relative rounded-lg overflow-hidden group">
            <Image
              src={img1.imageUrl}
              alt={img1.description}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={img1.imageHint}
            />
          </div>
        )}

        {/* Smaller Images Column */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 grid grid-cols-2 gap-4">
            {img2 && (
              <div className="relative rounded-lg overflow-hidden group">
                <Image
                  src={img2.imageUrl}
                  alt={img2.description}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={img2.imageHint}
                />
              </div>
            )}
            {img3 && (
              <div className="relative rounded-lg overflow-hidden group">
                <Image
                  src={img3.imageUrl}
                  alt={img3.description}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={img3.imageHint}
                />
              </div>
            )}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            {img4 && (
              <div className="relative rounded-lg overflow-hidden group">
                <Image
                  src={img4.imageUrl}
                  alt={img4.description}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={img4.imageHint}
                />
              </div>
            )}
            {img5 && (
              <div className="relative rounded-lg overflow-hidden group">
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
        </div>
      </div>
    </section>
  );
}
