'use client';

import { useState } from 'react';
import { MediaUploader } from '@/components/blocks/admin/posts/media-uploader';
import { MediaItem } from '@/types/post.types';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import {
  X,
  GripVertical,
  Star,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { cn } from '@/libs/utils';

interface GalleryManagerProps {
  images: MediaItem[];
  onChange: (images: MediaItem[]) => void;
  disabled?: boolean;
}

export function GalleryManager({
  images,
  onChange,
  disabled = false,
}: GalleryManagerProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);

  const handleImagesSelected = (newImages: MediaItem[]) => {
    onChange([...images, ...newImages]);
    setShowUploader(false);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], caption };
    onChange(updated);
  };

  const setPrimary = (index: number) => {
    // Move selected image to first position
    const updated = [...images];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    onChange(updated);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
  };

  if (showUploader) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Upload Images</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowUploader(false)}
          >
            Cancel
          </Button>
        </div>
        <MediaUploader
          onSelect={handleImagesSelected}
          multiple
          accept={['image/*']}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Gallery Images</h3>
          <p className="text-muted-foreground text-sm">
            {images.length} image{images.length !== 1 ? 's' : ''}
            {images.length > 0 && ' (first is primary)'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUploader(true)}
          disabled={disabled}
        >
          <Upload className="mr-2 h-4 w-4" />
          Add Images
        </Button>
      </div>

      {/* Empty State */}
      {images.length === 0 && (
        <div className="rounded-lg border-2 border-dashed p-8 text-center">
          <ImageIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h4 className="mb-2 font-medium">No images yet</h4>
          <p className="text-muted-foreground mb-4 text-sm">
            Upload multiple images to create a gallery
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowUploader(true)}
            disabled={disabled}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Images
          </Button>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {images.map((image, index) => (
            <div
              key={image.id || index}
              className={cn(
                'bg-card overflow-hidden rounded-lg border',
                index === 0 && 'ring-primary ring-2',
              )}
            >
              {/* Image */}
              <div className="bg-muted group relative aspect-video">
                <img
                  src={image.url}
                  alt={image.alt || `Gallery image ${index + 1}`}
                  className="h-full w-full object-cover"
                />

                {/* Overlay Actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {index !== 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setPrimary(index)}
                      title="Set as primary"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Primary Badge */}
                {index === 0 && (
                  <div className="bg-primary text-primary-foreground absolute top-2 left-2 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium">
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </div>
                )}

                {/* Position Indicator */}
                <div className="absolute top-2 right-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                  {index + 1} / {images.length}
                </div>
              </div>

              {/* Caption Input */}
              <div className="space-y-2 p-3">
                <Label className="text-xs">Caption (optional)</Label>
                {editingCaption === image.id ? (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add a caption..."
                      defaultValue={image.caption || ''}
                      onBlur={e => {
                        updateCaption(index, e.target.value);
                        setEditingCaption(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          updateCaption(index, e.currentTarget.value);
                          setEditingCaption(null);
                        }
                      }}
                      disabled={disabled}
                      autoFocus
                      className="text-sm"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingCaption(image.id)}
                    disabled={disabled}
                    className="text-muted-foreground hover:text-foreground w-full text-left text-sm transition-colors"
                  >
                    {image.caption || 'Click to add caption...'}
                  </button>
                )}
              </div>

              {/* Drag Handle (for future drag-drop implementation) */}
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <GripVertical className="h-4 w-4" />
                  <span>Drag to reorder</span>
                </div>
                {index > 0 && (
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => moveImage(index, index - 1)}
                      disabled={disabled}
                      title="Move up"
                    >
                      ↑
                    </Button>
                    {index < images.length - 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => moveImage(index, index + 1)}
                        disabled={disabled}
                        title="Move down"
                      >
                        ↓
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
