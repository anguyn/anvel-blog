'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/custom/copy-button';
import { DeletePostDialog } from './delete-post-dialog';
import { Heart, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/libs/utils';
import { Post } from '@/types/post.types';

interface BlogActionsProps {
  post: Post;
  locale: string;
  session: any;
}

export function BlogActions({ post, locale, session }: BlogActionsProps) {
  const router = useRouter();
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/blog/${post.slug}`;
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFavoriteToggle = async () => {
    if (!session) {
      toast.error('Please login to save posts');
      router.push(`/${locale}/login?callbackUrl=/${locale}/blog/${post.slug}`);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/favorite`, {
        method: isFavorited ? 'DELETE' : 'POST',
      });

      if (!res.ok) throw new Error('Failed to update favorite');

      setIsFavorited(!isFavorited);
      toast.success(
        isFavorited ? 'Removed from favorites' : 'Added to favorites',
      );
    } catch (error) {
      toast.error('Failed to update favorite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <CopyButton text={shareUrl} label="Share" />

      {session && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleFavoriteToggle}
          disabled={isLoading}
        >
          <Heart
            className={cn(
              'mr-2 h-4 w-4',
              isFavorited && 'fill-current text-red-500',
            )}
          />
          {isFavorited ? 'Saved' : 'Save'}
        </Button>
      )}

      {session?.user?.id === post.authorId && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/blog/${post.slug}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeletePostDialog
            postId={post.id}
            postTitle={post.title}
            locale={locale}
            onClose={() => {}}
          />
        </>
      )}
    </div>
  );
}
