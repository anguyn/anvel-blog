'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, Reply, Trash2, User } from 'lucide-react';
import Image from 'next/image';
import { formatDate } from '@/libs/utils';
import { toast } from 'sonner';
import Link from 'next/link';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  replies?: Comment[];
}

interface BlogCommentsProps {
  postId: string;
  locale: string;
  translations: {
    comments: string;
    leaveComment: string;
    noComments: string;
    loginToComment: string;
  };
  session: any;
}

export function BlogComments({
  postId,
  locale,
  translations,
  session,
}: BlogCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        toast.success('Comment posted successfully');
        setNewComment('');
        fetchComments();
      } else {
        toast.error('Failed to post comment');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !session) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, parentId }),
      });

      if (res.ok) {
        toast.success('Reply posted successfully');
        setReplyContent('');
        setReplyTo(null);
        fetchComments();
      } else {
        toast.error('Failed to post reply');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Comment deleted');
        fetchComments();
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const CommentItem = ({
    comment,
    isReply = false,
  }: {
    comment: Comment;
    isReply?: boolean;
  }) => (
    <div className={`space-y-3 ${isReply ? 'ml-12' : ''}`}>
      <div className="flex gap-3">
        <Link href={`/${locale}/users/${comment.author.username}`}>
          {comment.author.image ? (
            <Image
              src={comment.author.image}
              alt={comment.author.name || 'User'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
              <User className="h-5 w-5" />
            </div>
          )}
        </Link>

        <div className="flex-1 space-y-2">
          <div className="bg-muted rounded-lg p-3">
            <div className="mb-1 flex items-center gap-2">
              <Link
                href={`/${locale}/users/${comment.author.username}`}
                className="font-medium hover:underline"
              >
                {comment.author.name || comment.author.username}
              </Link>
              <span className="text-muted-foreground text-xs">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm">{comment.content}</p>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {session && !isReply && (
              <button
                onClick={() => setReplyTo(comment.id)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            )}
            {session?.user?.id === comment.author.id && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>

          {replyTo === comment.id && (
            <div className="flex gap-2">
              <textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="bg-background flex-1 resize-none rounded-lg border p-2 text-sm"
                rows={2}
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={isSubmitting || !replyContent.trim()}
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyContent('');
                  }}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          {translations.comments} ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {session ? (
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder={translations.leaveComment}
              className="bg-background min-h-24 w-full resize-none rounded-lg border p-3"
              disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              <Send className="mr-2 h-4 w-4" />
              Post Comment
            </Button>
          </form>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground mb-3">
              {translations.loginToComment}
            </p>
            <Button asChild>
              <Link href={`/${locale}/login`}>Sign In</Link>
            </Button>
          </div>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="bg-muted h-10 w-10 animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="bg-muted h-4 w-32 animate-pulse rounded" />
                  <div className="bg-muted h-16 animate-pulse rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            <MessageCircle className="mx-auto mb-2 h-12 w-12 opacity-20" />
            <p>{translations.noComments}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
