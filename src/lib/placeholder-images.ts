import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

export const getGalleryImages = (): ImagePlaceholder[] => {
  return PlaceHolderImages.filter(p => p.id.startsWith('gallery/'));
}
