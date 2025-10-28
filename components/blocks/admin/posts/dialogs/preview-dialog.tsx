'use client';

import { Dialog, DialogContent } from '@/components/common/dialog';
import { Button } from '@/components/common/button';
import { X, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    title: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    author: {
      name: string;
      image?: string;
    };
    category?: {
      name: string;
    };
    tags?: Array<{
      name: string;
    }>;
  };
}

export function PostPreviewDialog({
  open,
  onOpenChange,
  post,
}: PostPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-background/95 sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 backdrop-blur">
          <div>
            <h2 className="text-lg font-semibold">Preview</h2>
            <p className="text-muted-foreground text-sm">
              How your post will appear to readers
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <article className="px-6 py-8">
          {/* Category */}
          {post.category && (
            <div className="mb-4">
              <span className="bg-primary/10 text-primary inline-block rounded-full px-3 py-1 text-sm font-medium">
                {post.category.name}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="mb-4 text-4xl leading-tight font-bold md:text-5xl">
            {post.title || 'Untitled Post'}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-muted-foreground mb-6 text-xl">{post.excerpt}</p>
          )}

          {/* Meta Info */}
          <div className="text-muted-foreground mb-8 flex flex-wrap items-center gap-4 border-b pb-8 text-sm">
            <div className="flex items-center gap-2">
              {post.author.image && (
                <img
                  src={post.author.image}
                  alt={post.author.name}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <span className="text-foreground font-medium">
                {post.author.name}
              </span>
            </div>

            <span className="text-border">•</span>

            <time>{formatDistanceToNow(new Date(), { addSuffix: true })}</time>

            <span className="text-border">•</span>

            <span>Preview Mode</span>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-8 overflow-hidden rounded-lg">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="h-auto w-full"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: post.content || '<p>No content yet...</p>',
            }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2 border-t pt-8">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Footer */}
        <div className="bg-background/95 sticky bottom-0 border-t px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              This is a preview. Changes are not saved yet.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close Preview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
