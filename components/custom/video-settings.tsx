'use client';

import { useState } from 'react';
import { MediaUploader } from '@/components/blocks/admin/posts/media-uploader';
import { MediaItem } from '@/types/post.types';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import {
  Video,
  Upload,
  Link as LinkIcon,
  X,
  Play,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/libs/utils';

interface VideoSettingsProps {
  video?: MediaItem;
  videoUrl?: string;
  thumbnail?: string;
  duration?: number;
  onChange: (data: {
    video?: MediaItem;
    videoUrl?: string;
    thumbnail?: string;
    duration?: number;
  }) => void;
  disabled?: boolean;
}

export function VideoSettings({
  video,
  videoUrl,
  thumbnail,
  duration,
  onChange,
  disabled = false,
}: VideoSettingsProps) {
  const [mode, setMode] = useState<'upload' | 'url'>(
    video ? 'upload' : videoUrl ? 'url' : 'upload',
  );
  const [showVideoUploader, setShowVideoUploader] = useState(false);
  const [showThumbnailUploader, setShowThumbnailUploader] = useState(false);

  const handleVideoSelected = (videos: MediaItem[]) => {
    if (videos.length > 0) {
      onChange({
        video: videos[0],
        videoUrl: undefined,
        thumbnail,
        duration,
      });
      setShowVideoUploader(false);
    }
  };

  const handleThumbnailSelected = (thumbnails: MediaItem[]) => {
    if (thumbnails.length > 0) {
      onChange({
        video,
        videoUrl,
        thumbnail: thumbnails[0].url,
        duration,
      });
      setShowThumbnailUploader(false);
    }
  };

  const handleUrlChange = (url: string) => {
    onChange({
      video: undefined,
      videoUrl: url,
      thumbnail,
      duration,
    });
  };

  const handleDurationChange = (value: string) => {
    const minutes = parseInt(value) || 0;
    onChange({
      video,
      videoUrl,
      thumbnail,
      duration: minutes,
    });
  };

  const removeVideo = () => {
    onChange({
      video: undefined,
      videoUrl: undefined,
      thumbnail,
      duration,
    });
  };

  const removeThumbnail = () => {
    onChange({
      video,
      videoUrl,
      thumbnail: undefined,
      duration,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <Video className="text-primary h-4 w-4" />
            Video Source
          </h3>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'upload' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('upload')}
              disabled={disabled}
            >
              <Upload className="mr-1 h-3 w-3" />
              Upload
            </Button>
            <Button
              type="button"
              variant={mode === 'url' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('url')}
              disabled={disabled}
            >
              <LinkIcon className="mr-1 h-3 w-3" />
              URL
            </Button>
          </div>
        </div>

        {mode === 'upload' && (
          <div className="space-y-4">
            {video ? (
              <div className="bg-card rounded-lg border p-4">
                <div className="flex items-start gap-4">
                  <div className="bg-muted relative h-20 w-32 flex-shrink-0 overflow-hidden rounded">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt="Video thumbnail"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Play className="text-muted-foreground h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{video.filename}</p>
                    <p className="text-muted-foreground text-sm">
                      {video.mimeType}
                      {video.size &&
                        ` • ${(video.size / 1024 / 1024).toFixed(2)} MB`}
                      {video.duration &&
                        ` • ${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}`}
                    </p>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline"
                    >
                      View video
                    </a>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeVideo}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : showVideoUploader ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Upload Video File</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVideoUploader(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <MediaUploader
                  onSelect={handleVideoSelected}
                  accept={['video/*']}
                />
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowVideoUploader(true)}
                disabled={disabled}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Video File
              </Button>
            )}
          </div>
        )}

        {mode === 'url' && (
          <div className="space-y-2">
            <Label htmlFor="video-url">
              Video URL (YouTube, Vimeo, or direct link)
            </Label>
            <Input
              id="video-url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl || ''}
              onChange={e => handleUrlChange(e.target.value)}
              disabled={disabled}
            />
            <p className="text-muted-foreground text-xs">
              Supports YouTube, Vimeo, and direct video file URLs
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <ImageIcon className="text-primary h-4 w-4" />
            Video Thumbnail
          </h3>
        </div>

        {thumbnail ? (
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-start gap-4">
              <div className="bg-muted relative h-20 w-32 flex-shrink-0 overflow-hidden rounded">
                <img
                  src={thumbnail}
                  alt="Video thumbnail"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium">Thumbnail uploaded</p>
                <p className="text-muted-foreground text-sm">
                  This will be shown before video plays
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeThumbnail}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : showThumbnailUploader ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Upload Thumbnail</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowThumbnailUploader(false)}
              >
                Cancel
              </Button>
            </div>
            <MediaUploader
              onSelect={handleThumbnailSelected}
              accept={['image/*']}
            />
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowThumbnailUploader(true)}
            disabled={disabled}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Thumbnail
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-duration">
          Duration (minutes){' '}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="video-duration"
          type="number"
          min="0"
          placeholder="e.g., 5"
          value={duration || ''}
          onChange={e => handleDurationChange(e.target.value)}
          disabled={disabled}
        />
        <p className="text-muted-foreground text-xs">
          Auto-detected for uploaded videos
        </p>
      </div>
    </div>
  );
}
