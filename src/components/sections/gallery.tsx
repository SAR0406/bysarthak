
'use client';

import Image from "next/image";
import { getGalleryImages } from "@/lib/placeholder-images";
import ScrollFloat from "../ScrollFloat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ImagePlaceholder } from "@/lib/placeholder-images";

export function Gallery() {
  const images = getGalleryImages();
  const [selectedImage, setSelectedImage] = useState<ImagePlaceholder | null>(null);

  return (
    <section id="gallery" className="container mx-auto py-16">
      <ScrollFloat className="text-center font-headline text-3xl md:text-4xl font-bold mb-12">
        Visual Explorations
      </ScrollFloat>

      <Dialog>
        <div className="flex flex-col md:flex-row gap-4" style={{ height: 'calc(80vh)', maxHeight: '700px' }}>
          {images[0] && (
            <DialogTrigger asChild>
              <div
                className="flex-[1.618] relative rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => setSelectedImage(images[0])}
              >
                <Image
                  src={images[0].imageUrl}
                  alt={images[0].description}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={images[0].imageHint}
                />
              </div>
            </DialogTrigger>
          )}

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4">
              {images[1] && (
                 <DialogTrigger asChild>
                    <div
                      className="relative rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedImage(images[1])}
                    >
                      <Image
                        src={images[1].imageUrl}
                        alt={images[1].description}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={images[1].imageHint}
                      />
                    </div>
                </DialogTrigger>
              )}
              {images[2] && (
                <DialogTrigger asChild>
                    <div
                      className="relative rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedImage(images[2])}
                    >
                      <Image
                        src={images[2].imageUrl}
                        alt={images[2].description}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={images[2].imageHint}
                      />
                    </div>
                </DialogTrigger>
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {images[3] && (
                <DialogTrigger asChild>
                    <div
                      className="relative rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedImage(images[3])}
                    >
                      <Image
                        src={images[3].imageUrl}
                        alt={images[3].description}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={images[3].imageHint}
                      />
                    </div>
                </DialogTrigger>
              )}
              {images[4] && (
                 <DialogTrigger asChild>
                    <div
                      className="relative rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => setSelectedImage(images[4])}
                    >
                      <Image
                        src={images[4].imageUrl}
                        alt={images[4].description}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={images[4].imageHint}
                      />
                    </div>
                </DialogTrigger>
              )}
            </div>
          </div>
        </div>

        {selectedImage && (
            <DialogContent className="max-w-4xl p-0">
                <DialogHeader className="p-4 sr-only">
                    <DialogTitle>{selectedImage.description}</DialogTitle>
                    <DialogDescription>
                        A larger view of the selected image.
                    </DialogDescription>
                </DialogHeader>
                <div className="aspect-video relative">
                    <Image src={selectedImage.imageUrl} alt={selectedImage.description} fill className="object-contain rounded-md"/>
                </div>
            </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
