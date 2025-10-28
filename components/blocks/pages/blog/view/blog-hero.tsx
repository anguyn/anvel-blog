import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types/post.types';
import { formatDate } from '@/libs/utils';
import {
  Calendar,
  Eye,
  Clock,
  User,
  MessageCircle,
  Folder,
} from 'lucide-react';
import { Badge } from '@/components/common/badge';
import { BlogActions } from './blog-actions';

interface BlogHeroSectionProps {
  post: Post;
  locale: string;
  session: any;
}

export function BlogHeroSection({
  post,
  locale,
  session,
}: BlogHeroSectionProps) {
  return (
    <>
      {/* Hero Background */}
      <div className="from-primary/5 to-background relative overflow-hidden bg-gradient-to-b py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto">
            {/* Breadcrumb */}
            <nav className="text-muted-foreground mb-6 flex items-center gap-2 text-sm">
              <Link href={`/${locale}`} className="hover:text-foreground">
                Home
              </Link>
              <span>/</span>
              <Link href={`/${locale}/blog`} className="hover:text-foreground">
                Blog
              </Link>
              {post.category && (
                <>
                  <span>/</span>
                  <Link
                    href={`/${locale}/blog?category=${post.category.slug}`}
                    className="hover:text-foreground"
                  >
                    {post.category.name}
                  </Link>
                </>
              )}
            </nav>

            {/* Post Meta Badges */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {post.category && (
                <Link href={`/${locale}/blog?category=${post.category.slug}`}>
                  <Badge variant="secondary" className="hover:bg-secondary/80">
                    <Folder className="mr-1 h-3 w-3" />
                    {post.category.name}
                  </Badge>
                </Link>
              )}
              {post.isPinned && <Badge variant="default">Pinned</Badge>}
              {post.isFeatured && (
                <Badge
                  variant="default"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500"
                >
                  ★ Featured
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="mb-6 text-4xl leading-tight font-bold md:text-5xl">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-muted-foreground mb-6 text-xl">
                {post.excerpt}
              </p>
            )}

            {/* Author & Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <Link
                href={`/${locale}/users/${post.author.username}`}
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
              >
                {post.author.image ? (
                  <Image
                    src={post.author.image}
                    alt={post.author.name || 'Author'}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="bg-secondary flex h-12 w-12 items-center justify-center rounded-full">
                    <User className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <div className="font-medium">
                    {post.author.name || post.author.username}
                  </div>
                  <div className="text-muted-foreground">
                    @{post.author.username}
                  </div>
                </div>
              </Link>

              <div className="text-muted-foreground flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.publishedAt || post.createdAt)}
                </div>
                {post.readingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.readingTime} min read
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.viewCount}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {post.commentCount}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <BlogActions post={post} locale={locale} session={session} />
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-5xl">
            <div className="relative aspect-video overflow-hidden rounded-xl">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
