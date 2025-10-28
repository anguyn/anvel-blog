import { Post } from '@/types/post.types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/common/card';
import { BlogSidebarActions } from './blog-sidebar-actions';

interface BlogSidebarProps {
  post: Post;
  locale: string;
  translations: {
    share: string;
    save: string;
    saved: string;
  };
  session: any;
}

export function BlogSidebar({
  post,
  locale,
  translations,
  session,
}: BlogSidebarProps) {
  return (
    <aside className="hidden space-y-6 xl:col-span-3 xl:block">
      <div className="sticky top-24 space-y-6">
        {/* Share & Actions Card */}
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

        {/* Post Stats */}
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
      </div>
    </aside>
  );
}
