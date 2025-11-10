'use client';

import { PostWithRelations } from '@/types/post.types';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Clock, Eye, Heart, Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/common/button';
import Image from 'next/image';

interface ArticleLayoutProps {
  post: PostWithRelations;
  relatedPosts?: PostWithRelations[];
  onFavorite?: () => void;
  onShare?: () => void;
  isFavorited?: boolean;
}

export function ArticleLayout({
  post,
  onFavorite,
  onShare,
  isFavorited = false,
}: ArticleLayoutProps) {
  return (
    <article className="mx-auto">
      <header className="mb-8">
        {post.category && (
          <div className="mb-4">
            <span className="bg-primary/10 text-primary inline-block rounded-full px-3 py-1 text-sm font-medium">
              {post.category.name}
            </span>
          </div>
        )}

        <h1 className="mb-4 text-4xl leading-tight font-bold md:text-5xl">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-muted-foreground mb-6 text-xl">{post.excerpt}</p>
        )}

        <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            {post.author.image && (
              <Image
                src={post.author.image}
                alt={post.author.name || 'Author'}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div>
              <p className="text-foreground leading-normal font-medium">
                {post.author.name || post.author.username}
              </p>
            </div>
          </div>

          <span className="text-border">•</span>

          {post.publishedAt && (
            <>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.publishedAt.toISOString()}>
                  {formatDistanceToNow(new Date(post.publishedAt), {
                    addSuffix: true,
                  })}
                </time>
              </div>
              <span className="text-border">•</span>
            </>
          )}

          {post.readingTime && (
            <>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{post.readingTime} min read</span>
              </div>
              <span className="text-border">•</span>
            </>
          )}

          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{post.viewCount} views</span>
          </div>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map(postTag => (
              <span
                key={postTag.tag.id}
                className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs"
              >
                #{postTag.tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {post.featuredImage && (
        <div className="mb-8 overflow-hidden rounded-lg">
          <Image
            src={post.featuredImage}
            alt={post.title}
            width={1200}
            height={600}
            className="h-auto w-full"
            priority
          />
        </div>
      )}

      <div className="bg-background/95 sticky top-0 z-10 mb-8 flex items-center justify-between border-y py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onFavorite}
            className={isFavorited ? 'text-red-600' : ''}
          >
            <Heart
              className={`mr-1 h-4 w-4 ${isFavorited ? 'fill-current' : ''}`}
            />
            <span className="hidden sm:inline">
              {post.likeCount > 0 ? post.likeCount : 'Like'}
            </span>
          </Button>

          <Button variant="ghost" size="sm" onClick={onFavorite}>
            <Bookmark
              className={`mr-1 h-4 w-4 ${isFavorited ? 'fill-current' : ''}`}
            />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={onShare}>
          <Share2 className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      <div
        className="prose prose-lg prose-slate dark:prose-invert mb-12 max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <footer className="border-t pt-8">
        <div className="mb-8 flex items-start gap-4">
          {post.author.image && (
            <Image
              src={post.author.image}
              alt={post.author.name || 'Author'}
              width={80}
              height={80}
              className="rounded-full"
            />
          )}
          <div>
            <p className="mb-1 text-lg font-semibold">
              {post.author.name || post.author.username}
            </p>
            {post.author.bio && (
              <p className="text-muted-foreground leading-normal">
                {post.author.bio}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 border-y py-6">
          <span className="text-muted-foreground text-sm">
            Enjoyed this article?
          </span>
          <Button onClick={onShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </footer>
    </article>
  );
}
