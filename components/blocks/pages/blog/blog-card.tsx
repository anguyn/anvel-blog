import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types/post.types';
import { formatDate } from '@/libs/utils';
import {
  Calendar,
  Eye,
  Clock,
  Image as ImageIcon,
  Video,
  FileText,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/common/badge';
import { Card, CardContent } from '@/components/common/card';

interface BlogCardProps {
  post: Post;
  locale: string;
  translations: {
    readMore: string;
    readingTime: string;
    views: string;
  };
  featured?: boolean;
  priority?: boolean;
}

export function BlogCard({
  post,
  locale,
  translations,
  featured = false,
  priority = false,
}: BlogCardProps) {
  const getTypeIcon = () => {
    switch (post.type) {
      case 'GALLERY':
        return <ImageIcon className="h-4 w-4" />;
      case 'VIDEO':
        return <Video className="h-4 w-4" />;
      case 'DOCUMENT':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeColor = () => {
    switch (post.type) {
      case 'GALLERY':
        return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'VIDEO':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'DOCUMENT':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  if (featured) {
    return (
      <Link href={`/${locale}/blog/${post.slug}`}>
        <div className="group relative overflow-hidden rounded-xl transition-all hover:shadow-lg">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="relative aspect-video min-h-72 overflow-hidden rounded-lg lg:aspect-auto lg:h-full">
              {post.featuredImage ? (
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority={priority}
                />
              ) : (
                <div className="from-primary/20 to-primary/5 flex h-full items-center justify-center bg-gradient-to-br">
                  {getTypeIcon() || (
                    <FileText className="text-primary/40 h-16 w-16" />
                  )}
                </div>
              )}
              {post.isPasswordProtected && (
                <div className="bg-background/90 absolute top-2 right-2 rounded-full p-2 backdrop-blur">
                  <Lock className="h-4 w-4" />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center py-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {post.type !== 'ARTICLE' && (
                  <Badge variant="outline" className={getTypeColor()}>
                    {getTypeIcon()}
                    <span className="ml-1 capitalize">
                      {post.type.toLowerCase()}
                    </span>
                  </Badge>
                )}
                {post.category && (
                  <Badge variant="secondary">{post.category.name}</Badge>
                )}
              </div>

              <h2 className="group-hover:text-primary mb-3 text-3xl font-bold transition-colors">
                {post.title}
              </h2>

              {post.excerpt && (
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
              )}

              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.publishedAt || post.createdAt)}
                </div>
                {post.readingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.readingTime} {translations.readingTime}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.viewCount} {translations.views}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/${locale}/blog/${post.slug}`}>
        <div className="relative aspect-video overflow-hidden">
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
            />
          ) : (
            <div className="from-primary/10 to-primary/5 flex h-full items-center justify-center bg-gradient-to-br">
              {getTypeIcon() || (
                <FileText className="text-primary/30 h-12 w-12" />
              )}
            </div>
          )}
          {post.isPasswordProtected && (
            <div className="bg-background/90 absolute top-2 right-2 rounded-full p-2 backdrop-blur">
              <Lock className="h-3 w-3" />
            </div>
          )}
          {post.isPinned && (
            <div className="bg-primary text-primary-foreground absolute top-2 left-2 rounded-full px-2 py-1 text-xs font-medium">
              Pinned
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="my-2.5 flex flex-wrap items-center gap-2">
            {post.type !== 'ARTICLE' && (
              <Badge variant="outline" className={getTypeColor()}>
                {getTypeIcon()}
                <span className="ml-1 text-xs capitalize">
                  {post.type.toLowerCase()}
                </span>
              </Badge>
            )}
            {post.category && (
              <Badge variant="secondary" className="text-xs">
                {post.category.name}
              </Badge>
            )}
          </div>

          <h3 className="group-hover:text-primary mb-2 line-clamp-2 text-lg font-semibold transition-colors">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-muted-foreground mb-3 line-clamp-3 text-sm">
              {post.excerpt}
            </p>
          )}

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(post.publishedAt || post.createdAt)}
            </div>
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
        </CardContent>
      </Link>
    </Card>
  );
}
