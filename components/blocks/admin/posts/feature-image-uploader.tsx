'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/common/button';

interface FeatureImageUploaderProps {
  value?: string; // Current featured image URL
  onChange: (file: File | null, previewUrl: string | null) => void;
  onRemove: () => void;
}

export function FeatureImageUploader({
  value,
  onChange,
  onRemove,
}: FeatureImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Pass file to parent (will upload on save)
      onChange(file, url);
    },
    [onChange],
  );

  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };
    input.click();
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    setPreviewUrl(null);
    onChange(null, null);
    onRemove();
  }, [onChange, onRemove]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  if (previewUrl) {
    return (
      <div className="group relative overflow-hidden rounded-lg border">
        <img
          src={previewUrl}
          alt="Featured image preview"
          className="h-full max-h-1/2 w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
          >
            <X className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
        <div className="bg-background/90 absolute right-0 bottom-0 left-0 p-2 backdrop-blur-sm">
          <p className="text-center text-xs">
            <span className="text-muted-foreground">
              Image will be uploaded when you save the post
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Show upload zone
  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
          <ImageIcon className="text-primary h-8 w-8" />
        </div>

        <div>
          <p className="mb-1 text-lg font-medium">
            {isDragging ? 'Drop image here' : 'Upload featured image'}
          </p>
          <p className="text-muted-foreground text-sm">
            Drag & drop or click to browse
          </p>
        </div>

        <div className="text-muted-foreground text-xs">
          <p>Supported: JPG, PNG, GIF, WebP</p>
          <p>Max size: 10MB</p>
        </div>
      </div>
    </div>
  );
}
