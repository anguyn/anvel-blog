'use client';

import { Card, CardContent } from '@/components/common/card';
import { MediaItem } from '@/types/post.types';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  media: MediaItem;
}

export function VideoPlayer({ media }: VideoPlayerProps) {
  const isYouTube =
    media.url.includes('youtube.com') || media.url.includes('youtu.be');
  const isVimeo = media.url.includes('vimeo.com');

  const getEmbedUrl = () => {
    if (isYouTube) {
      const videoId = media.url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      )?.[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (isVimeo) {
      const videoId = media.url.match(/vimeo\.com\/(\d+)/)?.[1];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl();

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              controls
              className="h-full w-full"
              poster={media.thumbnailUrl || undefined}
              preload="metadata"
            >
              <source src={media.url} type={media.mimeType} />
              Your browser does not support the video tag.
            </video>
          )}

          {media.duration && (
            <div className="absolute right-2 bottom-2 rounded bg-black/75 px-2 py-1 text-xs text-white backdrop-blur">
              {formatDuration(media.duration)}
            </div>
          )}
        </div>

        {media.caption && (
          <div className="text-muted-foreground p-4 text-center text-sm">
            {media.caption}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
