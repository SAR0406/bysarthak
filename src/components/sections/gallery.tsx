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
import { motion } from "framer-motion";

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

      <div className="section-shell p-4 md:p-8">
        <Dialog>
          {/* Mobile layout: responsive 2-column grid */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {images[0] && (
              <DialogTrigger asChild>
                <motion.div
                  className="col-span-2 relative aspect-video rounded-2xl overflow-hidden group cursor-pointer border border-white/10 bg-card/60 mask-shine"
                  onClick={() => setSelectedImage(images[0])}
                  whileHover={{ scale: 0.99 }}
                  data-cursor-variant="project"
                  data-cursor-label="View"
                >
                  <Image
                    src={images[0].imageUrl}
                    alt={images[0].description}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110 saturate-125"
                    data-ai-hint={images[0].imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white font-medium tracking-widest uppercase text-xs">View Archive</span>
                  </div>
                </motion.div>
              </DialogTrigger>
            )}
            {images.slice(1, 5).map((image) => (
              image && (
                <DialogTrigger asChild key={image.imageUrl}>
                  <motion.div
                    className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer border border-white/10 bg-card/60"
                    onClick={() => setSelectedImage(image)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                    data-cursor-variant="project"
                    data-cursor-label="Zoom"
                  >
                    <Image
                      src={image.imageUrl}
                      alt={image.description}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      data-ai-hint={image.imageHint}
                    />
                  </motion.div>
                </DialogTrigger>
              )
            ))}
          </div>

          {/* Desktop / tablet layout: bento flex */}
          <div className="hidden md:flex flex-row gap-4" style={{ height: 'calc(80vh)', maxHeight: '700px' }}>
            {images[0] && (
              <DialogTrigger asChild>
                <motion.div
                  className="flex-[1.618] relative rounded-2xl overflow-hidden group cursor-pointer border border-white/10 bg-card/60 mask-shine"
                  onClick={() => setSelectedImage(images[0])}
                  whileHover={{ scale: 0.99 }}
                  data-cursor-variant="project"
                  data-cursor-label="View"
                >
                  <Image
                    src={images[0].imageUrl}
                    alt={images[0].description}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110 saturate-125"
                    data-ai-hint={images[0].imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white font-medium tracking-widest uppercase text-sm">View Archive</span>
                  </div>
                </motion.div>
              </DialogTrigger>
            )}

            <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1 grid grid-cols-2 gap-4">
                {images.slice(1, 3).map((image) => (
                  image && (
                    <DialogTrigger asChild key={image.imageUrl}>
                      <motion.div
                        className="relative rounded-2xl overflow-hidden group cursor-pointer border border-white/10 bg-card/60"
                        onClick={() => setSelectedImage(image)}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                        data-cursor-variant="project"
                        data-cursor-label="Zoom"
                      >
                        <Image
                          src={image.imageUrl}
                          alt={image.description}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          data-ai-hint={image.imageHint}
                        />
                      </motion.div>
                    </DialogTrigger>
                  )
                ))}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                {images.slice(3, 5).map((image) => (
                  image && (
                    <DialogTrigger asChild key={image.imageUrl}>
                      <motion.div
                        className="relative rounded-2xl overflow-hidden group cursor-pointer border border-white/10 bg-card/60"
                        onClick={() => setSelectedImage(image)}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                        data-cursor-variant="project"
                        data-cursor-label="Zoom"
                      >
                        <Image
                          src={image.imageUrl}
                          alt={image.description}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          data-ai-hint={image.imageHint}
                        />
                      </motion.div>
                    </DialogTrigger>
                  )
                ))}
              </div>
            </div>
          </div>

          {selectedImage && (
              <DialogContent className="w-[95vw] max-w-4xl p-0 bg-background/95 backdrop-blur-2xl border-white/10">
                  <DialogHeader className="p-4 sr-only">
                      <DialogTitle>{selectedImage.description}</DialogTitle>
                      <DialogDescription>
                          A larger view of the selected image.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="aspect-video relative">
                      <Image src={selectedImage.imageUrl} alt={selectedImage.description} fill className="object-contain rounded-md p-4"/>
                  </div>
                  <div className="p-4 md:p-6 border-t border-white/5 bg-black/20">
                    <p className="text-white/80 font-medium tracking-wide text-sm md:text-base">{selectedImage.description}</p>
                  </div>
              </DialogContent>
          )}
        </Dialog>
      </div>
    </section>
  );
}
