'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadMediaAction } from '@/app/actions/media.action';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import type { MediaItem } from '@/types/post.types';

interface MediaUploaderProps {
  onUploadComplete?: (media: MediaItem) => void;
  onSelect?: (media: MediaItem[]) => void;
  selectedIds?: string[];
  maxFiles?: number;
  accept?: string[];
  maxSize?: number;
  multiple?: boolean;
}

export function MediaUploader({
  onUploadComplete,
  onSelect,
  selectedIds = [],
  maxFiles = 10,
  accept = ['image/*', 'video/*', 'application/pdf'],
  maxSize = 10,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<MediaItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [localSelectedIds, setLocalSelectedIds] =
    useState<string[]>(selectedIds);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);

      for (const file of acceptedFiles) {
        try {
          // Check file size
          if (file.size > maxSize * 1024 * 1024) {
            toast.error(`${file.name} is too large. Max size is ${maxSize}MB`);
            continue;
          }

          // Create FormData
          const formData = new FormData();
          formData.append('file', file);

          // Upload
          const result = await uploadMediaAction(formData);

          if (result.success && result.media) {
            setUploadedFiles(prev => [...prev, result.media as MediaItem]);
            onUploadComplete?.(result.media as MediaItem);
            toast.success(`${file.name} uploaded successfully`);
          } else {
            toast.error(`Failed to upload ${file.name}: ${result.error}`);
          }
        } catch (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      setUploading(false);
    },
    [maxSize, onUploadComplete],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<string, string[]>,
    ),
    maxFiles,
    disabled: uploading,
  });

  const removeFile = (index: number) => {
    const removedFile = uploadedFiles[index];
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));

    // Remove from selection if selected
    if (localSelectedIds.includes(removedFile.id)) {
      const newSelectedIds = localSelectedIds.filter(
        id => id !== removedFile.id,
      );
      setLocalSelectedIds(newSelectedIds);
      const selectedFiles = uploadedFiles.filter(f =>
        newSelectedIds.includes(f.id),
      );
      onSelect?.(selectedFiles);
    }
  };

  const handleSelect = (media: MediaItem) => {
    let newSelectedIds: string[];

    if (localSelectedIds.includes(media.id)) {
      // Deselect
      newSelectedIds = localSelectedIds.filter(id => id !== media.id);
    } else {
      // Select
      newSelectedIds = [...localSelectedIds, media.id];
    }

    setLocalSelectedIds(newSelectedIds);

    // Get selected media items
    const selectedFiles = uploadedFiles.filter(f =>
      newSelectedIds.includes(f.id),
    );
    onSelect?.(selectedFiles);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        } ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
            {uploading ? (
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
            ) : (
              <Upload className="text-primary h-8 w-8" />
            )}
          </div>

          <div>
            <p className="mb-1 text-lg font-medium">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-muted-foreground text-sm">or click to browse</p>
          </div>

          <div className="text-muted-foreground text-xs">
            <p>Supported: {accept.join(', ')}</p>
            <p>Max size: {maxSize}MB per file</p>
            <p>Max files: {maxFiles}</p>
          </div>
        </div>
      </div>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Uploaded Files</h3>
            {localSelectedIds.length > 0 && (
              <p className="text-muted-foreground text-sm">
                {localSelectedIds.length} selected
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {uploadedFiles.map((file, index) => (
              <div
                key={file.id}
                className={`group relative overflow-hidden rounded-lg border ${
                  localSelectedIds.includes(file.id)
                    ? 'ring-primary ring-2'
                    : ''
                }`}
              >
                {/* Image Preview */}
                {file.type === 'IMAGE' && (
                  <img
                    src={file.thumbnailUrl || file.url}
                    alt={file.alt || 'Uploaded image'}
                    className="aspect-square w-full object-cover"
                  />
                )}

                {/* Video Preview */}
                {file.type === 'VIDEO' && (
                  <div className="bg-muted flex aspect-square w-full items-center justify-center">
                    <ImageIcon className="text-muted-foreground h-8 w-8" />
                  </div>
                )}

                {/* Document Preview */}
                {file.type === 'DOCUMENT' && (
                  <div className="bg-muted flex aspect-square w-full items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="text-muted-foreground mx-auto mb-1 h-8 w-8" />
                      <p className="text-muted-foreground text-xs">
                        {file.filename.split('.').pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Select Button */}
                {onSelect && (
                  <div className="bg-background/90 absolute right-0 bottom-0 left-0 p-2 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant={
                        localSelectedIds.includes(file.id)
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() => handleSelect(file)}
                      className="w-full text-xs"
                    >
                      {localSelectedIds.includes(file.id)
                        ? 'Selected'
                        : 'Select'}
                    </Button>
                  </div>
                )}

                {/* File Info */}
                <div className="bg-background/90 p-2 backdrop-blur-sm">
                  <p className="truncate text-xs" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
