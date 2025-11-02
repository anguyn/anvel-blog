'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types/post.types';
import { cn, formatDate } from '@/libs/utils';
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
import { useEffect, useState } from 'react';

interface BlogHeroSectionProps {
  post: Post;
  locale: string;
  session: any;
}

const extractDominantColor = (imageSrc: string): Promise<string> => {
  return new Promise(resolve => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('59, 130, 246');
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let r = 0,
        g = 0,
        b = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }

      r = Math.floor(r / pixelCount);
      g = Math.floor(g / pixelCount);
      b = Math.floor(b / pixelCount);

      resolve(`${r}, ${g}, ${b}`);
    };

    img.onerror = () => {
      resolve('59, 130, 246');
    };
  });
};

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '59, 130, 246';
};

export function BlogHeroSection({
  post,
  locale,
  session,
}: BlogHeroSectionProps) {
  const [bgColor, setBgColor] = useState<string>('59, 130, 246');

  useEffect(() => {
    if (post.featuredImage) {
      extractDominantColor(post.featuredImage).then(setBgColor);
    } else if (post.category?.color) {
      setBgColor(hexToRgb(post.category.color));
    } else {
      const colors = [
        '59, 130, 246', // blue
        '168, 85, 247', // purple
        '236, 72, 153', // pink
        '34, 197, 94', // green
        '251, 146, 60', // orange
      ];
      setBgColor(colors[Math.floor(Math.random() * colors.length)]);
    }
  }, [post.featuredImage, post.category?.color]);

  return (
    <div className="from-primary/5 to-background relative overflow-hidden bg-gradient-to-b py-4 pb-0">
      <div className="container mx-auto px-4">
        <div className="mx-auto">
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

          <div
            className="relative -mx-4 overflow-hidden rounded-2xl p-6 lg:p-8"
            style={{
              background: `
                radial-gradient(
                  ellipse 80% 80% at 50% -20%,
                  rgba(${bgColor}, 0.15),
                  transparent
                ),
                radial-gradient(
                  ellipse 60% 60% at 100% 50%,
                  rgba(${bgColor}, 0.1),
                  transparent
                )
              `,
              backdropFilter: 'blur(40px)',
            }}
          >
            <div
              className="absolute inset-0 -z-10 opacity-50"
              style={{
                background: `linear-gradient(135deg, rgba(${bgColor}, 0.1) 0%, transparent 50%, rgba(${bgColor}, 0.05) 100%)`,
                filter: 'blur(60px)',
              }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:gap-8">
              <div className={cn('flex flex-1 flex-col justify-between')}>
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    {post.category && (
                      <Link
                        href={`/${locale}/blog?category=${post.category.slug}`}
                      >
                        <Badge
                          variant="secondary"
                          className="hover:bg-secondary/80"
                        >
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
                  <h1 className="mb-4 text-4xl leading-tight font-bold md:text-4xl xl:text-5xl">
                    {post.title}
                  </h1>
                  {post.excerpt && (
                    <p className="text-muted-foreground mb-6 text-lg">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <div>
                  <div className="mb-6 flex flex-wrap items-center gap-6 text-sm">
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
                  <BlogActions post={post} locale={locale} session={session} />
                </div>
              </div>
              {post.featuredImage && (
                <div className="mt-8 lg:mt-0 lg:flex-1">
                  <div className="relative aspect-video overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/10 lg:sticky lg:top-4">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
