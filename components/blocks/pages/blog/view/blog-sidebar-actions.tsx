'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/button';
import { CopyButton } from '@/components/custom/copy-button';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/libs/utils';
import { Post } from '@/types/post.types';

interface BlogSidebarActionsProps {
  post: Post;
  locale: string;
  translations: {
    save: string;
    saved: string;
  };
  session: any;
}

export function BlogSidebarActions({
  post,
  locale,
  translations,
  session,
}: BlogSidebarActionsProps) {
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
    <div className="space-y-2">
      <CopyButton text={shareUrl} label="Copy Link" className="w-full" />
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleFavoriteToggle}
        disabled={isLoading || !session}
      >
        <Heart
          className={cn(
            'mr-2 h-4 w-4',
            isFavorited && 'fill-current text-red-500',
          )}
        />
        {isFavorited ? translations.saved : translations.save}
      </Button>
    </div>
  );
}
