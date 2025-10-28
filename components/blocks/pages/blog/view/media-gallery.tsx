'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/common/card';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Button } from '@/components/common/button';
import { PostMediaItem } from '@/types/post.types';

interface MediaGalleryProps {
  media: PostMediaItem[];
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const sortedMedia = [...media].sort((a, b) => a.order - b.order);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    document.body.style.overflow = 'unset';
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < sortedMedia.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedIndex === null) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
    }
  };

  useState(() => {
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  });

  return (
    <>
      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {sortedMedia.map((item, index) => (
              <button
                key={item.media.id}
                onClick={() => openLightbox(index)}
                className="group bg-muted relative aspect-square overflow-hidden rounded-lg transition-transform hover:scale-105"
              >
                <Image
                  src={item.media.thumbnailUrl || item.media.url}
                  alt={item.media.alt || `Gallery image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {selectedIndex > 0 && (
            <button
              onClick={goToPrevious}
              className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {selectedIndex < sortedMedia.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          <div className="relative h-full w-full p-12">
            <div className="relative h-full w-full">
              <Image
                src={sortedMedia[selectedIndex].media.url}
                alt={
                  sortedMedia[selectedIndex].media.alt ||
                  `Gallery image ${selectedIndex + 1}`
                }
                fill
                className="object-contain"
              />
            </div>

            {sortedMedia[selectedIndex].media.caption && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/75 px-4 py-2 text-center text-white backdrop-blur">
                {sortedMedia[selectedIndex].media.caption}
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white">
            {selectedIndex + 1} / {sortedMedia.length}
          </div>
        </div>
      )}
    </>
  );
}
