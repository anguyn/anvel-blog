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

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
}

const extractColorPalette = (imageSrc: string): Promise<ColorPalette> => {
  return new Promise(resolve => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.src = imageSrc.includes('?')
      ? `${imageSrc}&t=${Date.now()}`
      : `${imageSrc}?t=${Date.now()}`;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve(getDefaultPalette());
          return;
        }

        const scale = 0.1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const colorMap = new Map<string, number>();
        const step = 4;

        for (let i = 0; i < data.length; i += step * 4) {
          const r = Math.round(data[i] / 10) * 10;
          const g = Math.round(data[i + 1] / 10) * 10;
          const b = Math.round(data[i + 2] / 10) * 10;
          const a = data[i + 3];

          if (a < 125) continue;
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 240) continue;

          const key = `${r},${g},${b}`;
          colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        if (sortedColors.length === 0) {
          resolve(getDefaultPalette());
          return;
        }

        const palette = getDistinctColors(sortedColors.map(c => c[0]));

        resolve(palette);
      } catch (error) {
        console.error('Canvas error:', error);
        resolve(getDefaultPalette());
      }
    };

    img.onerror = error => {
      console.error('Image load error:', error, 'URL:', imageSrc);
      resolve(getDefaultPalette());
    };
  });
};

const getDistinctColors = (colors: string[]): ColorPalette => {
  if (colors.length === 0) return getDefaultPalette();

  const primary = colors[0];
  let secondary = colors[1] || primary;
  let accent = colors[2] || primary;

  for (let i = 1; i < colors.length; i++) {
    if (colorDistance(primary, colors[i]) > 50) {
      secondary = colors[i];
      break;
    }
  }

  for (let i = 2; i < colors.length; i++) {
    if (
      colorDistance(primary, colors[i]) > 50 &&
      colorDistance(secondary, colors[i]) > 50
    ) {
      accent = colors[i];
      break;
    }
  }

  return { primary, secondary, accent };
};

const colorDistance = (color1: string, color2: string): number => {
  const [r1, g1, b1] = color1.split(',').map(Number);
  const [r2, g2, b2] = color2.split(',').map(Number);
  return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2);
};

const getDefaultPalette = (): ColorPalette => {
  const palettes = [
    {
      primary: '59, 130, 246',
      secondary: '99, 102, 241',
      accent: '168, 85, 247',
    }, // Blue-Indigo-Purple
    {
      primary: '168, 85, 247',
      secondary: '236, 72, 153',
      accent: '251, 113, 133',
    }, // Purple-Pink
    {
      primary: '34, 197, 94',
      secondary: '59, 130, 246',
      accent: '14, 165, 233',
    }, // Green-Blue
    {
      primary: '251, 146, 60',
      secondary: '239, 68, 68',
      accent: '236, 72, 153',
    }, // Orange-Red-Pink
    {
      primary: '14, 165, 233',
      secondary: '34, 197, 94',
      accent: '234, 179, 8',
    },
  ];
  return palettes[Math.floor(Math.random() * palettes.length)];
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
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (post.featuredImage) {
      extractColorPalette(post.featuredImage).then(setPalette);
    } else if (post.category?.color) {
      const rgb = hexToRgb(post.category.color);
      setPalette({
        primary: rgb,
        secondary: rgb,
        accent: rgb,
      });
    } else {
      setPalette(getDefaultPalette());
    }
  }, [isClient, post.featuredImage, post.category?.color]);

  const defaultStyle = {
    background:
      'linear-gradient(to bottom, rgba(59, 130, 246, 0.05), transparent)',
  };

  const dynamicStyle = palette
    ? {
        background: `
          radial-gradient(
            ellipse 80% 80% at 50% -20%,
            rgba(${palette.primary}, 0.15),
            transparent
          ),
          radial-gradient(
            ellipse 60% 60% at 100% 50%,
            rgba(${palette.secondary}, 0.1),
            transparent
          ),
          radial-gradient(
            ellipse 50% 50% at 0% 100%,
            rgba(${palette.accent}, 0.08),
            transparent
          )
        `,
        backdropFilter: 'blur(40px)',
      }
    : defaultStyle;

  const overlayStyle = palette
    ? {
        background: `
          linear-gradient(135deg, 
            rgba(${palette.primary}, 0.1) 0%, 
            rgba(${palette.secondary}, 0.05) 50%, 
            rgba(${palette.accent}, 0.05) 100%
          )
        `,
        filter: 'blur(60px)',
      }
    : {
        background:
          'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
        filter: 'blur(60px)',
      };

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

            {post.title && (
              <>
                <span>/</span>
                <span>{post.title}</span>
              </>
            )}
          </nav>

          <div
            className="relative -mx-4 overflow-hidden rounded-2xl p-6 lg:p-8"
            style={dynamicStyle}
          >
            <div
              className="absolute inset-0 -z-10 opacity-50"
              style={overlayStyle}
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
                  <h1 className="mb-4 text-4xl leading-tight font-bold md:text-4xl [@media(min-width:2560px)]:text-5xl">
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
