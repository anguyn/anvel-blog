import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types/post.types';
import { formatDate } from '@/libs/utils';
import { Calendar, Eye, Clock, FileText } from 'lucide-react';
import { Badge } from '@/components/common/badge';

interface RelatedPostsProps {
  posts: Post[];
  locale: string;
  title: string;
}

export function RelatedPosts({ posts, locale, title }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">{title}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map(post => (
          <Link
            key={post.id}
            href={`/${locale}/blog/${post.slug}`}
            className="group"
          >
            <article className="bg-card overflow-hidden rounded-xl border transition-shadow hover:shadow-lg">
              <div className="bg-muted relative aspect-video overflow-hidden">
                {post.featuredImage ? (
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileText className="text-muted-foreground h-12 w-12" />
                  </div>
                )}
              </div>

              <div className="p-4">
                {post.category && (
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {post.category.name}
                  </Badge>
                )}

                <h3 className="group-hover:text-primary mb-2 line-clamp-2 font-semibold transition-colors">
                  {post.title}
                </h3>

                {post.excerpt && (
                  <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
                    {post.excerpt}
                  </p>
                )}

                <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                  <time className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(post.publishedAt || post.createdAt)}
                  </time>
                  {post.readingTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readingTime}m
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.viewCount}
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
