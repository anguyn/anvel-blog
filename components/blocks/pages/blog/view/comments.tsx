// components/blog/blog-comments-enhanced.tsx
'use client';

import { useState, useRef, useCallback, useMemo, memo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  Send,
  Heart,
  Reply,
  Trash2,
  User,
  Smile,
  Loader2,
  Edit2,
  X,
  Check,
  MoreVertical,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import Link from 'next/link';
import { useComments, Comment } from '@/libs/hooks/use-comments';
import { useMentionSearch } from '@/libs/hooks/use-mention-search';
import { resolveMentions } from '@/libs/helpers/mention.helpter';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermissions } from '@/libs/hooks/use-permissions';

interface BlogCommentsProps {
  postId: string;
  locale: string;
}

// Format time helper
function formatTimeAgo(date: string | Date): string {
  const now = new Date().getTime();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 10) return 'vừa mới đăng';
  if (seconds < 60) return `${seconds} giây trước`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;

  // Format date/time
  const dateObj = new Date(date);
  const isThisYear = dateObj.getFullYear() === new Date().getFullYear();

  return dateObj.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    ...(isThisYear ? {} : { year: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BlogCommentsComponent({ postId, locale }: BlogCommentsProps) {
  const { data: session } = useSession();
  const currentUser = session?.user;

  const {
    comments,
    isLoading,
    hasMore,
    typingUsers,
    isPending,
    loadMore,
    createComment,
    updateComment,
    likeComment,
    unlikeComment,
    deleteComment,
    emitTyping,
    stopTyping,
  } = useComments({ postId });

  const { hasMinimumRole } = usePermissions();

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    showMentions,
    mentionUsers,
    selectedMentionIndex,
    isSearching,
    handleMentionInput,
    handleMentionKeyDown,
    selectMention,
  } = useMentionSearch(postId);

  const handleInputChange = useCallback(
    (value: string, type: 'new' | 'reply' | 'edit' = 'new') => {
      if (type === 'new') setNewComment(value);
      else if (type === 'reply') setReplyContent(value);
      else setEditContent(value);

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

      // ✅ Emit typing mỗi khi có thay đổi
      emitTyping(type === 'reply' ? replyTo! : undefined);

      // ✅ Tăng lên 3 giây
      typingTimerRef.current = setTimeout(() => {
        stopTyping(type === 'reply' ? replyTo! : undefined);
      }, 3000);

      handleMentionInput(value, textareaRef.current?.selectionStart || 0);
    },
    [replyTo, emitTyping, stopTyping, handleMentionInput],
  );

  const handleFocus = useCallback(
    (type: 'new' | 'reply' | 'edit' = 'new') => {
      emitTyping(type === 'reply' ? replyTo! : undefined);

      // Set timeout để auto stop nếu không typing
      typingTimerRef.current = setTimeout(() => {
        stopTyping(type === 'reply' ? replyTo! : undefined);
      }, 3000);
    },
    [replyTo, emitTyping, stopTyping],
  );

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    stopTyping();

    try {
      const mentions = await resolveMentions(newComment, postId);
      await createComment(newComment, { mentions });
      setNewComment('');
      toast.success('Đã đăng bình luận!');
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    stopTyping(parentId);

    try {
      const mentions = await resolveMentions(replyContent, postId);
      await createComment(replyContent, { parentId, mentions });
      setReplyContent('');
      setReplyTo(null);
      toast.success('Đã trả lời!');
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editContent.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await updateComment(commentId, editContent);
      setEditingId(null);
      setEditContent('');
      toast.success('Đã chỉnh sửa!');
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeToggle = async (comment: Comment) => {
    try {
      if (comment.isLiked) {
        await unlikeComment(comment.id);
      } else {
        await likeComment(comment.id);
      }
    } catch (error) {
      toast.error('Không thể thực hiện');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Xóa bình luận này?')) return;

    try {
      await deleteComment(commentId);
      toast.success('Đã xóa bình luận');
    } catch (error) {
      toast.error('Không thể xóa');
    }
  };

  const canEditOrDelete = useCallback(
    (comment: Comment) => {
      if (!currentUser) return false;
      if (comment.author.id === currentUser.id) return true;

      // Check admin role
      const isAdmin = hasMinimumRole(100);
      return isAdmin;
    },
    [currentUser],
  );

  const renderContent = (
    content: string,
    mentions: {
      id: string;
      userId: string;
      username: string;
      position: number;
    }[],
  ) => {
    if (!mentions || mentions.length === 0) return content;

    const parts = [];
    let lastIndex = 0;
    const sortedMentions = [...mentions].sort(
      (a, b) => a.position - b.position,
    );

    sortedMentions.forEach(mention => {
      if (mention.position > lastIndex) {
        parts.push(content.slice(lastIndex, mention.position));
      }

      parts.push(
        <Link
          key={mention.id}
          href={`/${locale}/users/${mention.username}`}
          className="text-primary font-medium hover:underline"
        >
          @{mention.username}
        </Link>,
      );

      lastIndex = mention.position + mention.username.length + 1;
    });

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts;
  };

  const CommentItem = memo(
    ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
      const [showReplyForm, setShowReplyForm] = useState(false);
      const isEditing = editingId === comment.id;
      const canManage = useMemo(() => canEditOrDelete(comment), [comment]);

      return (
        <motion.div
          initial={{ opacity: 0.8, y: 5 }}
          animate={{ opacity: comment._pending ? 0.8 : 1, y: 0 }}
          exit={{ opacity: 0, x: -5 }}
          transition={{ duration: 0.25 }}
          className={`space-y-3 ${isReply ? 'ml-8 sm:ml-12' : ''}`}
        >
          <div className="flex gap-2 sm:gap-3">
            <Link
              href={`/${locale}/users/${comment.author.username}`}
              className="flex-shrink-0"
            >
              {comment.author.image ? (
                <Image
                  src={comment.author.image}
                  alt={comment.author.name || 'User'}
                  width={40}
                  height={40}
                  className="h-8 w-8 rounded-full sm:h-10 sm:w-10"
                />
              ) : (
                <div className="bg-secondary flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              )}
            </Link>

            <div className="min-w-0 flex-1 space-y-2">
              {!isEditing ? (
                <div className="bg-muted rounded-2xl px-3 py-2 sm:px-4">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/${locale}/users/${comment.author.username}`}
                      className="truncate text-sm font-semibold hover:underline"
                    >
                      {comment.author.name || comment.author.username}
                    </Link>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                    {comment.isEdited && (
                      <span className="text-muted-foreground text-xs italic">
                        (đã chỉnh sửa)
                      </span>
                    )}
                  </div>

                  {comment.replyTo && (
                    <div className="text-muted-foreground mb-1 text-xs">
                      Trả lời{' '}
                      <span className="text-primary font-medium">
                        @{comment.replyTo.username}
                      </span>
                    </div>
                  )}

                  <p className="text-sm break-words">
                    {renderContent(comment.content, comment.mentions)}
                  </p>

                  {comment.sticker && (
                    <div className="mt-2">
                      <Image
                        src={comment.sticker.imageUrl}
                        alt={comment.sticker.name}
                        width={80}
                        height={80}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    ref={editTextareaRef}
                    value={editContent}
                    onChange={e => handleInputChange(e.target.value, 'edit')}
                    className="bg-background focus:ring-primary w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditSubmit(comment.id)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 px-2 text-sm">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleLikeToggle(comment)}
                  className={`flex items-center gap-1 transition-colors ${
                    comment.isLiked
                      ? 'text-red-500'
                      : 'text-muted-foreground hover:text-red-500'
                  }`}
                >
                  <motion.div
                    animate={comment.isLiked ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart
                      className={`h-4 w-4 ${comment.isLiked ? 'fill-current' : ''}`}
                    />
                  </motion.div>
                  {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                </motion.button>

                {session && !isReply && (
                  <button
                    onClick={() => {
                      setShowReplyForm(!showReplyForm);
                      setReplyTo(comment.id);
                    }}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Reply className="h-4 w-4" />
                    <span className="hidden sm:inline">Trả lời</span>
                  </button>
                )}

                {canManage && !isEditing && (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Xóa</span>
                    </button>
                  </>
                )}
              </div>

              <AnimatePresence>
                {showReplyForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-2 px-2"
                  >
                    <textarea
                      ref={replyTextareaRef}
                      value={replyContent}
                      onChange={e => handleInputChange(e.target.value, 'reply')}
                      onBlur={() => {
                        if (typingTimerRef.current) {
                          clearTimeout(typingTimerRef.current);
                        }
                        stopTyping(comment.id);
                      }}
                      onFocus={() => handleFocus('reply')}
                      placeholder={`Trả lời ${comment.author.username}...`}
                      className="bg-background focus:ring-primary flex-1 resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      rows={2}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReplySubmit(comment.id)}
                        disabled={isSubmitting || !replyContent.trim()}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowReplyForm(false);
                          setReplyContent('');
                          setReplyTo(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-3">
                  {comment.replies.map(reply => (
                    <CommentItem key={reply.id} comment={reply} isReply />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      );
    },
  );

  CommentItem.displayName = 'CommentItem';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Bình luận ({comments.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {!session ? (
          <div className="flex flex-col items-center">
            <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-20" />
            <p className="text-muted-foreground mb-4">
              Đăng nhập để tham gia thảo luận
            </p>
            <Button asChild>
              <Link href={`/${locale}/login`}>Đăng nhập</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={e => handleInputChange(e.target.value, 'new')}
                onFocus={() => handleFocus('new')} // ✅ Thêm onFocus
                onBlur={() => {
                  if (typingTimerRef.current) {
                    clearTimeout(typingTimerRef.current);
                  }
                  stopTyping();
                }}
                onKeyDown={e => {
                  handleMentionKeyDown(e as any, textareaRef.current!);
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmit();
                  }
                }}
                placeholder="Viết bình luận... Dùng @ để nhắc đến (tối thiểu 2 ký tự)"
                className="bg-background focus:ring-primary min-h-20 w-full resize-none rounded-lg border px-4 py-3 leading-normal transition-all focus:ring-2 focus:outline-none"
                disabled={isSubmitting}
              />

              {showMentions && (mentionUsers.length > 0 || isSearching) && (
                <div className="bg-background absolute bottom-full left-0 z-10 mb-2 max-h-48 w-full overflow-y-auto rounded-lg border shadow-lg">
                  {isSearching ? (
                    <div className="text-muted-foreground px-4 py-3 text-sm">
                      Đang tìm...
                    </div>
                  ) : (
                    mentionUsers.map((user, index) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => selectMention(user, textareaRef.current)}
                        className={`hover:bg-muted flex w-full items-center gap-3 px-4 py-2 transition-colors ${
                          index === selectedMentionIndex ? 'bg-muted' : ''
                        }`}
                      >
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.username}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="bg-secondary flex h-8 w-8 items-center justify-center rounded-full">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 text-left">
                          <div className="truncate text-sm font-medium">
                            {user.name || user.username}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            @{user.username}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button type="button" variant="ghost" size="sm">
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !newComment.trim() || isPending}
              >
                {isSubmitting || isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Đăng
              </Button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {typingUsers.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-muted-foreground flex items-center gap-2 px-2 text-sm"
            >
              <div className="flex gap-1">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
                  className="h-2 w-2 rounded-full bg-current"
                />
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
                  className="h-2 w-2 rounded-full bg-current"
                />
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
                  className="h-2 w-2 rounded-full bg-current"
                />
              </div>
              <span>
                {Array.from(typingUsers.values())
                  .map(u => u.username)
                  .join(', ')}{' '}
                đang soạn...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

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
          <>
            <div className="space-y-6">
              <AnimatePresence>
                {comments.map(comment => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Xem thêm bình luận
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-muted-foreground py-12 text-center">
            <MessageCircle className="mx-auto mb-2 h-12 w-12 opacity-20" />
            <p>Chưa có bình luận. Hãy là người đầu tiên!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const BlogComments = memo(BlogCommentsComponent);
