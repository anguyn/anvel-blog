import { Post } from '@/types/post.types';
import { BlogCard } from './blog-card';
import { Search } from 'lucide-react';

interface BlogGridProps {
  posts: Post[];
  featuredPost: Post | undefined;
  regularPosts: Post[];
  locale: string;
  translations: {
    featured: string;
    noPostsFound: string;
    readMore: string;
    readingTime: string;
    views: string;
  };
  currentPage: number;
}

export function BlogGrid({
  posts,
  featuredPost,
  regularPosts,
  locale,
  translations,
  currentPage,
}: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="bg-muted mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
          <Search className="text-muted-foreground h-12 w-12" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">
          {translations.noPostsFound}
        </h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {featuredPost && currentPage === 1 && (
        <article className="from-primary/10 to-primary/5 relative overflow-hidden rounded-xl bg-gradient-to-br p-6 md:p-8">
          <div className="bg-primary/10 absolute -top-12 -right-12 h-48 w-48 rounded-full blur-3xl" />
          <div className="relative">
            <div className="bg-primary/20 text-primary mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium">
              <span className="animate-pulse">★</span>
              {translations.featured}
            </div>
            <BlogCard
              post={featuredPost}
              locale={locale}
              translations={translations}
              featured
              priority
            />
          </div>
        </article>
      )}

      {/* Regular Posts Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {regularPosts.map((post, index) => (
          <BlogCard
            key={post.id}
            post={post}
            locale={locale}
            translations={translations}
            priority={index < 6}
          />
        ))}
      </div>
    </div>
  );
}
