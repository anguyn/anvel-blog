'use client';

import { PostWithRelations } from '@/types/post.types';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Eye, Heart, Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/common/button';
import Image from 'next/image';
import Link from 'next/link';

interface VideoLayoutProps {
  post: PostWithRelations;
  relatedPosts?: PostWithRelations[];
  onFavorite?: () => void;
  onShare?: () => void;
  isFavorited?: boolean;
}

export function VideoLayout({
  post,
  relatedPosts = [],
  onFavorite,
  onShare,
  isFavorited = false,
}: VideoLayoutProps) {
  const videoMedia = post.media?.find(m => m.media.type === 'VIDEO')?.media;

  return (
    <article className="mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {videoMedia && (
            <div className="relative mb-6 aspect-video overflow-hidden rounded-lg bg-black">
              <video
                controls
                className="h-full w-full"
                poster={post.featuredImage || undefined}
              >
                <source src={videoMedia.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          <div className="space-y-4">
            {post.category && (
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="bg-primary/10 text-primary hover:bg-primary/20 inline-block rounded-full px-3 py-1 text-sm font-medium"
              >
                {post.category.name}
              </Link>
            )}

            <h1 className="text-3xl leading-tight font-bold md:text-4xl">
              {post.title}
            </h1>

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
            </div>

            <div className="flex items-center gap-2 border-y py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onFavorite}
                className={isFavorited ? 'text-red-600' : ''}
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${isFavorited ? 'fill-current' : ''}`}
                />
                {post.likeCount > 0 ? `${post.likeCount} Likes` : 'Like'}
              </Button>

              <Button variant="outline" size="sm" onClick={onFavorite}>
                <Bookmark className="mr-2 h-4 w-4" />
                Save
              </Button>

              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
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

            {post.excerpt && (
              <p className="text-muted-foreground text-lg">{post.excerpt}</p>
            )}

            {post.content && (
              <div
                className="prose prose-lg prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            )}

            <div className="bg-muted/30 mt-8 flex items-start gap-4 rounded-lg p-6">
              {post.author.image && (
                <Image
                  src={post.author.image}
                  alt={post.author.name || 'Author'}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="mb-1 text-lg font-semibold">
                  {post.author.name || post.author.username}
                </p>
                {post.author.bio && (
                  <p className="text-muted-foregroun leading-normald">
                    {post.author.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <h2 className="mb-4 text-xl font-bold">Related Videos</h2>
            <div className="space-y-4">
              {relatedPosts && relatedPosts.length > 0 ? (
                relatedPosts.map(relatedPost => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="group block"
                  >
                    <div className="flex gap-3">
                      <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded">
                        {relatedPost.featuredImage && (
                          <Image
                            src={relatedPost.featuredImage}
                            alt={relatedPost.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="group-hover:text-primary mb-1 line-clamp-2 text-sm font-medium">
                          {relatedPost.title}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                          {relatedPost.author.name ||
                            relatedPost.author.username}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {relatedPost.viewCount} views
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  No related videos found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
