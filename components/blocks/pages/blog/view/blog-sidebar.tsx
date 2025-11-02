'use client';

import { Post } from '@/types/post.types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/card';
import { BlogSidebarActions } from './blog-sidebar-actions';
import { TableOfContentsWrapper } from './table-of-contents-wrapper';
import { useUIStore } from '@/store/ui';
import { motion } from 'framer-motion';

interface BlogSidebarProps {
  post: Post;
  locale: string;
  translations: {
    share: string;
    save: string;
    saved: string;
    tableOfContents: string;
  };
  session: any;
}

export function BlogSidebar({
  post,
  locale,
  translations,
  session,
}: BlogSidebarProps) {
  const { isHeaderVisible } = useUIStore();

  return (
    <aside className="hidden space-y-6 lg:col-span-3 lg:block">
      <motion.div
        animate={{
          top: isHeaderVisible ? '4.5rem' : '1rem',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
        className="sticky space-y-6"
      >
        <TableOfContentsWrapper
          content={post.content}
          title={translations.tableOfContents}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Share This Post</CardTitle>
          </CardHeader>
          <CardContent>
            <BlogSidebarActions
              post={post}
              locale={locale}
              translations={translations}
              session={session}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Post Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Views</span>
              <span className="font-medium">{post.viewCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Comments</span>
              <span className="font-medium">{post.commentCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Likes</span>
              <span className="font-medium">{post.likeCount}</span>
            </div>
            {post.readingTime && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reading Time</span>
                <span className="font-medium">{post.readingTime} min</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </aside>
  );
}
