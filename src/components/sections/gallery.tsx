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
import { useState, useEffect } from "react";
import { ImagePlaceholder } from "@/lib/placeholder-images";

export function Gallery() {
  const images = getGalleryImages();
  const [selectedImage, setSelectedImage] = useState<ImagePlaceholder | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section id="gallery" className="container mx-auto py-16">
        <div className="text-center font-headline text-3xl md:text-4xl font-bold mb-12 opacity-0">
          Visual Explorations
        </div>
        <div className="h-[700px] w-full bg-muted/10 rounded-lg animate-pulse" />
      </section>
    );
  }

  return (
    <section id="gallery" className="container mx-auto py-16">
      <ScrollFloat className="text-center font-headline text-3xl md:text-4xl font-bold mb-12 text-white">
        Visual Explorations
      </ScrollFloat>

      <Dialog>
        <div className="flex flex-col md:flex-row gap-4" style={{ height: 'calc(80vh)', maxHeight: '700px' }}>
          {images[0] && (
            <DialogTrigger asChild>
              <div
                className="flex-[1.618] relative rounded-lg overflow-hidden group cursor-pointer border border-white/5"
                onClick={() => setSelectedImage(images[0])}
              >
                <Image
                  src={images[0].imageUrl}
                  alt={images[0].description}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  data-ai-hint={images[0].imageHint}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white font-medium tracking-widest uppercase text-sm">View Archive</span>
                </div>
              </div>
            </DialogTrigger>
          )}

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 grid grid-cols-2 gap-4">
              {images[1] && (
                 <DialogTrigger asChild>
                    <div
                      className="relative rounded-lg overflow-hidden group cursor-pointer border border-white/5"
                      onClick={() => setSelectedImage(images[1])}
                    >
                      <Image
                        src={images[1].imageUrl}
                        alt={images[1].description}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        data-ai-hint={images[1].imageHint}
                      />
                    </div>
                </DialogTrigger>
              )}
              {images[2] && (
                <DialogTrigger asChild>
                    <div
                      className="relative rounded-lg overflow-hidden group cursor-pointer border border-white/5"
                      onClick={() => setSelectedImage(images[2])}
                    >
                      <Image
                        src={images[2].imageUrl}
                        alt={images[2].description}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
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
                      className="relative rounded-lg overflow-hidden group cursor-pointer border border-white/5"
                      onClick={() => setSelectedImage(images[3])}
                    >
                      <Image
                        src={images[3].imageUrl}
                        alt={images[3].description}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        data-ai-hint={images[3].imageHint}
                      />
                    </div>
                </DialogTrigger>
              )}
              {images[4] && (
                 <DialogTrigger asChild>
                    <div
                      className="relative rounded-lg overflow-hidden group cursor-pointer border border-white/5"
                      onClick={() => setSelectedImage(images[4])}
                    >
                      <Image
                        src={images[4].imageUrl}
                        alt={images[4].description}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        data-ai-hint={images[4].imageHint}
                      />
                    </div>
                </DialogTrigger>
              )}
            </div>
          </div>
        </div>

        {selectedImage && (
            <DialogContent className="max-w-4xl p-0 bg-background/95 backdrop-blur-2xl border-white/10">
                <DialogHeader className="p-4 sr-only">
                    <DialogTitle>{selectedImage.description}</DialogTitle>
                    <DialogDescription>
                        A larger view of the selected image.
                    </DialogDescription>
                </DialogHeader>
                <div className="aspect-video relative">
                    <Image src={selectedImage.imageUrl} alt={selectedImage.description} fill className="object-contain rounded-md p-4"/>
                </div>
                <div className="p-6 border-t border-white/5 bg-black/20">
                  <p className="text-white/80 font-medium tracking-wide">{selectedImage.description}</p>
                </div>
            </DialogContent>
        )}
      </Dialog>
    </section>
  );
}