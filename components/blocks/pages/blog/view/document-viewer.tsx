'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Button } from '@/components/ui/button';
import { MediaItem } from '@/types/post.types';
import { FileText, Download, ExternalLink } from 'lucide-react';

interface DocumentViewerProps {
  media: MediaItem;
}

export function DocumentViewer({ media }: DocumentViewerProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = () => {
    const mimeType = media.mimeType.toLowerCase();
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
      return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation'))
      return '📊';
    return '📁';
  };

  const isPDF = media.mimeType.toLowerCase().includes('pdf');

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 flex items-start gap-4 rounded-lg border p-4">
          <div className="text-4xl">{getFileIcon()}</div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium">{media.originalName}</h4>
            <p className="text-muted-foreground text-sm">
              {formatFileSize(media.size)}
            </p>
            {media.caption && (
              <p className="text-muted-foreground mt-2 text-sm">
                {media.caption}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a
              href={media.url}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={media.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </a>
          </Button>
        </div>

        {isPDF && (
          <div className="aspect-[8.5/11] w-full overflow-hidden rounded-lg border">
            <iframe
              src={`${media.url}#view=FitH`}
              className="h-full w-full"
              title={media.originalName}
            />
          </div>
        )}

        {!isPDF &&
          (media.mimeType.includes('word') ||
            media.mimeType.includes('excel') ||
            media.mimeType.includes('powerpoint') ||
            media.mimeType.includes('document') ||
            media.mimeType.includes('spreadsheet') ||
            media.mimeType.includes('presentation')) && (
            <div className="aspect-[8.5/11] w-full overflow-hidden rounded-lg border">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(media.url)}&embedded=true`}
                className="h-full w-full"
                title={media.originalName}
              />
            </div>
          )}
      </CardContent>
    </Card>
  );
}
