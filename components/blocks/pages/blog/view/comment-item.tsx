import { useState, useRef, useCallback, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Reply,
  Trash2,
  User,
  Loader2,
  Edit2,
  X,
  Check,
  Send,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Comment } from '@/libs/hooks/use-comments';
import { CommentTextarea, CommentTextareaRef } from './comment-textarea';
import { cn, formatTimeAgo } from '@/libs/utils';
import { resolveMentions } from '@/libs/helpers/mention.helpter';
import { useSession } from 'next-auth/react';

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  locale: string;
  postId: string;
  canEditOrDelete: (comment: Comment) => boolean;
  loadingRepliesFor: Set<string>;
  onLikeToggle: (comment: Comment) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onCreate: (
    content: string,
    options: {
      parentId?: string;
      mentions?: Array<{
        userId: string;
        username: string;
        position: number;
      }>;
    },
  ) => Promise<Comment>;
  onLoadMoreReplies: (
    commentId: string,
    cursor: string | null,
  ) => Promise<void>;
  emitTyping: (parentId?: string) => void;
  stopTyping: (parentId?: string) => void;
  renderContent: (
    content: string,
    mentions: Array<{
      id: string;
      userId: string;
      username: string;
      position: number;
    }>,
  ) => React.ReactNode;
}

function CommentItemComponent({
  comment,
  isReply = false,
  locale,
  postId,
  canEditOrDelete,
  loadingRepliesFor,
  onLikeToggle,
  onDelete,
  onUpdate,
  onCreate,
  onLoadMoreReplies,
  emitTyping,
  stopTyping,
  renderContent,
}: CommentItemProps) {
  const { data: session } = useSession();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [localReplyContent, setLocalReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [isLocalEditing, setIsLocalEditing] = useState(false);
  const [localEditContent, setLocalEditContent] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const localReplyTextareaRef = useRef<CommentTextareaRef | null>(null);
  const localEditTextareaRef = useRef<CommentTextareaRef | null>(null);
  const localTypingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localIsTypingRef = useRef(false);

  const canManage = useMemo(
    () => canEditOrDelete(comment),
    [comment, canEditOrDelete],
  );
  const isLoadingReplies = loadingRepliesFor.has(comment.id);

  const handleStartEdit = useCallback(() => {
    setIsLocalEditing(true);
    setLocalEditContent(comment.content);

    setTimeout(() => {
      if (localEditTextareaRef.current) {
        localEditTextareaRef.current.focus();
        const length = comment.content.length;
        localEditTextareaRef.current.setSelectionRange(length, length);
      }
    }, 0);
  }, [comment.content]);

  const handleCancelEdit = useCallback(() => {
    setIsLocalEditing(false);
    setLocalEditContent('');
  }, []);

  const handleLocalEditSubmit = async () => {
    if (!localEditContent.trim() || isSubmittingEdit) return;

    setIsSubmittingEdit(true);

    try {
      await onUpdate(comment.id, localEditContent);
      setIsLocalEditing(false);
      setLocalEditContent('');
      toast.success('Đã chỉnh sửa!');
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleLocalReplySubmit = async () => {
    if (!localReplyContent.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);

    if (localTypingTimerRef.current) {
      clearTimeout(localTypingTimerRef.current);
    }
    stopTyping(comment.id);
    localIsTypingRef.current = false;

    try {
      const mentions = await resolveMentions(localReplyContent, postId);
      await onCreate(localReplyContent, {
        parentId: comment.id,
        mentions,
      });
      setLocalReplyContent('');
      setShowReplyForm(false);
      toast.success('Đã trả lời!');
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleLocalTyping = (value: string) => {
    setLocalReplyContent(value);

    if (localTypingTimerRef.current) {
      clearTimeout(localTypingTimerRef.current);
    }

    if (!localIsTypingRef.current) {
      emitTyping(comment.id);
      localIsTypingRef.current = true;
    }

    localTypingTimerRef.current = setTimeout(() => {
      stopTyping(comment.id);
      localIsTypingRef.current = false;
    }, 3000);
  };

  return (
    <div className="space-y-3">
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
          {!isLocalEditing ? (
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
              <CommentTextarea
                value={localEditContent}
                onChange={(value: string) => setLocalEditContent(value)}
                ref={localEditTextareaRef}
                className="bg-background focus:ring-primary w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleLocalEditSubmit}
                  disabled={isSubmittingEdit}
                >
                  {isSubmittingEdit ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {!isLocalEditing && (
            <div className="flex flex-wrap items-center gap-3 px-2 text-sm">
              <button
                onClick={() => onLikeToggle(comment)}
                className={cn(
                  'flex items-center gap-1 transition-colors hover:cursor-pointer',
                  comment.isLiked
                    ? 'text-red-500'
                    : 'text-muted-foreground hover:text-red-500',
                )}
              >
                <Heart
                  className={`h-4 w-4 ${comment.isLiked ? 'fill-current' : ''}`}
                />
                {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
              </button>

              {session && !isReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors hover:cursor-pointer"
                >
                  <Reply className="h-4 w-4" />
                  <span className="hidden sm:inline">Trả lời</span>
                </button>
              )}

              {canManage && (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors hover:cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Sửa</span>
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors hover:cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Xóa</span>
                  </button>
                </>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {showReplyForm && (
              <motion.div
                key={`reply-${comment.id}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="flex gap-2 px-2"
              >
                <CommentTextarea
                  ref={localReplyTextareaRef}
                  value={localReplyContent}
                  onChange={(value: string) => handleLocalTyping(value)}
                  onBlur={() => {
                    if (localTypingTimerRef.current) {
                      clearTimeout(localTypingTimerRef.current);
                    }
                    stopTyping(comment.id);
                    localIsTypingRef.current = false;
                  }}
                  onFocus={() => {
                    if (!localIsTypingRef.current) {
                      emitTyping(comment.id);
                      localIsTypingRef.current = true;
                    }
                  }}
                  placeholder={`Trả lời ${comment.author.username}...`}
                  className="bg-background focus:ring-primary flex-1 resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                />
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={handleLocalReplySubmit}
                    disabled={isSubmittingReply || !localReplyContent.trim()}
                  >
                    {isSubmittingReply ? (
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
                      setLocalReplyContent('');
                      if (localTypingTimerRef.current) {
                        clearTimeout(localTypingTimerRef.current);
                      }
                      stopTyping(comment.id);
                      localIsTypingRef.current = false;
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render replies directly without virtualization */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => (
                <CommentItemComponent
                  key={reply.id}
                  comment={reply}
                  isReply
                  locale={locale}
                  postId={postId}
                  canEditOrDelete={canEditOrDelete}
                  loadingRepliesFor={loadingRepliesFor}
                  onLikeToggle={onLikeToggle}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onCreate={onCreate}
                  onLoadMoreReplies={onLoadMoreReplies}
                  emitTyping={emitTyping}
                  stopTyping={stopTyping}
                  renderContent={renderContent}
                />
              ))}
            </div>
          )}

          {comment.hasMoreReplies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onLoadMoreReplies(comment.id, comment.nextRepliesCursor ?? null)
              }
              disabled={isLoadingReplies}
              className="ml-2"
            >
              {isLoadingReplies ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Đang tải...
                </>
              ) : (
                'Xem thêm trả lời'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export const CommentItem = memo(CommentItemComponent);
