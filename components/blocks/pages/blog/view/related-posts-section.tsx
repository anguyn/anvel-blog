import { Post } from '@/types/post.types';
import { RelatedPosts } from './related-posts';

interface RelatedPostsSectionProps {
  posts: Post[];
  locale: string;
  title: string;
}

export function RelatedPostsSection({
  posts,
  locale,
  title,
}: RelatedPostsSectionProps) {
  if (posts.length === 0) return null;

  return (
    <section className="bg-muted/30 border-t py-12">
      <div className="container mx-auto px-4">
        <RelatedPosts posts={posts} locale={locale} title={title} />
      </div>
    </section>
  );
}
