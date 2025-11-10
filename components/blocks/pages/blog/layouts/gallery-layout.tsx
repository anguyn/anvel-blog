'use client';

import { PostWithRelations } from '@/types/post.types';
import { formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/common/button';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';

interface GalleryLayoutProps {
  post: PostWithRelations;
  relatedPosts?: PostWithRelations[];
  onFavorite?: () => void;
  onShare?: () => void;
  isFavorited?: boolean;
}

export function GalleryLayout({
  post,
  relatedPosts = [],
  onFavorite,
  onShare,
  isFavorited = false,
}: GalleryLayoutProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const images = post.media?.map(m => m.media) || [];

  const nextImage = () => {
    setSelectedImageIndex(prev => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  return (
    <article className="mx-auto px-4 py-8">
      <header className="mb-8">
        {post.category && (
          <div className="mb-4">
            <Link
              href={`/blog/category/${post.category.slug}`}
              className="bg-primary/10 text-primary hover:bg-primary/20 inline-block rounded-full px-3 py-1 text-sm font-medium"
            >
              {post.category.name}
            </Link>
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
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <span className="text-foreground font-medium">
              {post.author.name || post.author.username}
            </span>
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

          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{post.viewCount} views</span>
          </div>

          <span className="text-border">•</span>

          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{images.length} photos</span>
          </div>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map(postTag => (
              <Link
                key={postTag.tag.id}
                href={`/blog/tag/${postTag.tag.slug}`}
                className="bg-muted text-muted-foreground hover:bg-muted/80 rounded px-2 py-1 text-xs"
              >
                #{postTag.tag.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {images.length > 0 && (
        <div className="mb-8">
          <div className="bg-muted relative mb-4 aspect-[16/9] overflow-hidden rounded-lg">
            <Image
              src={images[selectedImageIndex].url}
              alt={images[selectedImageIndex].alt || post.title}
              fill
              className="object-contain"
              priority
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="bg-background/80 hover:bg-background absolute top-1/2 left-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="bg-background/80 hover:bg-background absolute top-1/2 right-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="bg-background/80 absolute right-4 bottom-4 rounded-full px-3 py-1 text-sm backdrop-blur-sm">
              {selectedImageIndex + 1} / {images.length}
            </div>

            {images[selectedImageIndex].caption && (
              <div className="bg-background/80 absolute right-20 bottom-4 left-4 rounded-lg px-3 py-2 text-sm backdrop-blur-sm">
                {images[selectedImageIndex].caption}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative aspect-square overflow-hidden rounded ${
                  selectedImageIndex === index
                    ? 'ring-primary ring-2'
                    : 'hover:opacity-80'
                }`}
              >
                <Image
                  src={image.thumbnailUrl || image.url}
                  alt={image.alt || `Photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {post.content && (
        <div
          className="prose prose-lg prose-slate dark:prose-invert mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
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

      {relatedPosts && relatedPosts.length > 0 && (
        <div className="mt-16 border-t pt-8">
          <h2 className="mb-6 text-2xl font-bold">More Galleries</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {relatedPosts.slice(0, 3).map(relatedPost => (
              <Link
                key={relatedPost.id}
                href={`/blog/${relatedPost.slug}`}
                className="group"
              >
                <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-lg">
                  {relatedPost.featuredImage && (
                    <Image
                      src={relatedPost.featuredImage}
                      alt={relatedPost.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <h3 className="group-hover:text-primary line-clamp-2 font-semibold">
                  {relatedPost.title}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {relatedPost?.viewCount || 0} views
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
