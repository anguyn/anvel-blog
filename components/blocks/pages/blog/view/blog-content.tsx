import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types/post.types';
import { User, Tag, Folder } from 'lucide-react';
import { Badge } from '@/components/common/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { BlogComments } from './comments';
import { MediaGallery } from './media-gallery';
import { VideoPlayer } from './video-player';
import { DocumentViewer } from './document-viewer';

interface BlogContentProps {
  post: Post;
  locale: string;
  translations: {
    tags: string;
    aboutAuthor: string;
    viewProfile: string;
    comments: string;
    leaveComment: string;
    noComments: string;
    loginToComment: string;
  };
  session: any;
}

export function BlogContent({
  post,
  locale,
  translations,
  session,
}: BlogContentProps) {
  const renderMediaContent = () => {
    switch (post.type) {
      case 'GALLERY':
        return post.media && post.media.length > 0 ? (
          <MediaGallery media={post.media} />
        ) : null;
      case 'VIDEO':
        return post.media && post.media.length > 0 ? (
          <VideoPlayer media={post.media[0].media} />
        ) : null;
      case 'DOCUMENT':
        return post.media && post.media.length > 0 ? (
          <DocumentViewer media={post.media[0].media} />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <>
      <article className="lg:col-span-9">
        {renderMediaContent()}

        <Card className="mb-8 !border-0 !shadow-none md:!rounded-lg md:!border md:!border-[var(--color-border)] md:!shadow-sm">
          <CardContent className="prose prose-lg dark:prose-invert blog-content max-w-screen px-0 py-4 md:px-4">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </CardContent>
        </Card>

        {post.tags.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-5 w-5" />
                {translations.tags}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(({ tag }) => (
                  <Link key={tag.id} href={`/${locale}/blog?tag=${tag.slug}`}>
                    <Badge
                      variant="secondary"
                      className="hover:bg-secondary/80"
                    >
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{translations.aboutAuthor}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              {post.author.image ? (
                <Image
                  src={post.author.image}
                  alt={post.author.name || 'Author'}
                  width={96}
                  height={96}
                  className="rounded-full"
                />
              ) : (
                <div className="bg-secondary flex h-24 w-24 items-center justify-center rounded-full">
                  <User className="h-12 w-12" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="mb-2 text-xl font-semibold">
                  {post.author.name || post.author.username}
                </h3>
                {post.author.bio && (
                  <p className="text-muted-foreground mb-4">
                    {post.author.bio}
                  </p>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${locale}/users/${post.author.username}`}>
                    {translations.viewProfile}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <BlogComments
          postId={post.id}
          locale={locale}
          translations={translations}
          session={session}
        />
      </article>
    </>
  );
}
