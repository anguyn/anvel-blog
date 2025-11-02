'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/common/dialog';
import { Button } from '@/components/common/button';
import { X } from 'lucide-react';
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
      <DialogContent className="flex h-screen w-screen max-w-none flex-col gap-0 p-0">
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">
          Preview: {post.title || 'Untitled Post'}
        </DialogTitle>

        {/* Header - Fixed */}
        <div className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-lg leading-none font-semibold">Preview</h2>
              <p className="text-muted-foreground mt-1.5 text-sm leading-none">
                How your post will appear to readers
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <article className="mx-auto max-w-4xl px-6 py-12 md:px-8 lg:px-12">
            {/* Category */}
            {post.category && (
              <div className="mb-6">
                <span className="bg-primary/10 text-primary inline-block rounded-full px-3 py-1.5 text-sm font-medium">
                  {post.category.name}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="mb-6 text-4xl leading-[1.2] font-bold tracking-tight md:text-5xl md:leading-[1.15]">
              {post.title || 'Untitled Post'}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-muted-foreground mb-8 text-xl leading-[1.6]">
                {post.excerpt}
              </p>
            )}

            {/* Meta Info */}
            <div className="text-muted-foreground mb-10 flex flex-wrap items-center gap-3 border-b pb-6 text-sm">
              <div className="flex items-center gap-2.5">
                {post.author.image ? (
                  <img
                    src={post.author.image}
                    alt={post.author.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
                    {post.author.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-foreground font-medium">
                  {post.author.name}
                </span>
              </div>

              <span className="text-muted-foreground/50">•</span>

              <time className="leading-none">
                {formatDistanceToNow(new Date(), { addSuffix: true })}
              </time>

              <span className="text-muted-foreground/50">•</span>

              <span className="leading-none">Preview Mode</span>
            </div>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="mb-12 overflow-hidden rounded-xl">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="h-auto w-full object-cover"
                />
              </div>
            )}

            {/* Content - HTML from Tiptap with inline styles */}
            <div
              className="prose-content"
              dangerouslySetInnerHTML={{
                __html:
                  post.content ||
                  '<p class="text-muted-foreground" style="margin: 1.5em 0; line-height: 1.75;">No content yet...</p>',
              }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 flex flex-wrap gap-2 border-t pt-10">
                <p className="text-muted-foreground mb-3 w-full text-sm font-medium">
                  Tags:
                </p>
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-muted text-muted-foreground hover:bg-muted/80 inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </article>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 border-t">
          <div className="flex items-center justify-between px-6 py-4">
            <p className="text-muted-foreground text-sm leading-none">
              This is a preview. Changes are not saved yet.
            </p>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="sm"
            >
              Close Preview
            </Button>
          </div>
        </div>

        {/* Global styles for preview content */}
        <style jsx global>{`
          /* Preview content inherits Tiptap HTML inline styles */
          .prose-content {
            max-width: none;
          }

          /* Additional fallback styles if inline styles missing */
          .prose-content p {
            margin: 1.5em 0;
            line-height: 1.75;
            color: hsl(var(--foreground) / 0.9);
          }

          .prose-content p:first-child {
            margin-top: 0;
          }

          .prose-content p:last-child {
            margin-bottom: 0;
          }

          .prose-content h1 {
            font-size: 2.5em;
            font-weight: bold;
            margin: 2em 0 0.5em 0;
            line-height: 1.2;
            color: hsl(var(--foreground));
          }

          .prose-content h1:first-child {
            margin-top: 0;
          }

          .prose-content h2 {
            font-size: 2em;
            font-weight: bold;
            margin: 1.8em 0 0.5em 0;
            line-height: 1.3;
            color: hsl(var(--foreground));
          }

          .prose-content h3 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 1.6em 0 0.5em 0;
            line-height: 1.4;
            color: hsl(var(--foreground));
          }

          .prose-content h4 {
            font-size: 1.25em;
            font-weight: bold;
            margin: 1.4em 0 0.5em 0;
            line-height: 1.4;
            color: hsl(var(--foreground));
          }

          .prose-content blockquote {
            border-left: 4px solid hsl(var(--primary));
            padding-left: 1.5em;
            margin: 1.5em 0;
            font-style: italic;
            color: hsl(var(--muted-foreground));
            line-height: 1.6;
          }

          .prose-content code {
            background: hsl(var(--muted));
            padding: 0.2em 0.4em;
            border-radius: 4px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9em;
          }

          .prose-content pre {
            background: hsl(var(--muted));
            padding: 1.5em;
            border-radius: 6px;
            overflow-x: auto;
            font-family: 'Courier New', Courier, monospace;
            margin: 1.5em 0;
            line-height: 1.6;
          }

          .prose-content pre code {
            background: none;
            padding: 0;
          }

          .prose-content a {
            color: hsl(var(--primary));
            text-decoration: underline;
          }

          .prose-content ul,
          .prose-content ol {
            padding-left: 2em;
            margin: 1.5em 0;
          }

          .prose-content li {
            margin: 0.5em 0;
            line-height: 1.75;
          }

          .prose-content img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            margin: 1.5em 0;
            display: block;
          }

          .prose-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 1.5em 0;
          }

          .prose-content table td,
          .prose-content table th {
            border: 1px solid hsl(var(--border));
            padding: 0.75em;
          }

          .prose-content table th {
            background: hsl(var(--muted));
            font-weight: bold;
          }

          .prose-content hr {
            border: none;
            border-top: 2px solid hsl(var(--border));
            margin: 2em 0;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
