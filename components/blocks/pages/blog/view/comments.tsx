// components/blog/blog-comments-enhanced.tsx
'use client';

import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
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
import { StickerPicker } from './sticker-picker';
import { CommentTextarea } from './comment-textarea';
import { cn } from '@/libs/utils';

interface BlogCommentsProps {
  postId: string;
  locale: string;
}

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

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };

  return debounced;
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

  console.log('log ra comment nè: ', comments);

  const { hasMinimumRole } = usePermissions();

  const [newComment, setNewComment] = useState('');
  // const [replyTo, setReplyTo] = useState<string | null>(null);
  // const [replyContent, setReplyContent] = useState('');
  // const [editingId, setEditingId] = useState<string | null>(null);
  // const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  // const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<{
    id: string;
    imageUrl: string;
  } | null>(null);

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
      // else if (type === 'reply') setReplyContent(value);
      // else setEditContent(value);

      const parentId = undefined;

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

      if (!isTypingRef.current) {
        emitTyping(parentId);
        isTypingRef.current = true;
      }
      typingTimerRef.current = setTimeout(() => {
        stopTyping(parentId);
        isTypingRef.current = false;
      }, 3000);

      handleMentionInput(value, textareaRef.current?.selectionStart || 0);
    },
    [emitTyping, stopTyping, handleMentionInput],
  );

  const handleFocus = useCallback(
    (type: 'new' | 'reply' | 'edit' = 'new') => {
      const parentId = undefined;

      // ✅ Chỉ emit nếu chưa typing
      if (!isTypingRef.current) {
        emitTyping(parentId);
        isTypingRef.current = true;
      }

      // ✅ Set timeout để auto stop
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

      typingTimerRef.current = setTimeout(() => {
        stopTyping(parentId);
        isTypingRef.current = false;
      }, 3000);
    },
    [emitTyping, stopTyping],
    // ^^^^ QUAN TRỌNG: Phải có emitTyping, stopTyping trong deps
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
      const [localReplyContent, setLocalReplyContent] = useState('');
      const [isSubmittingReply, setIsSubmittingReply] = useState(false);

      const [isLocalEditing, setIsLocalEditing] = useState(false);
      const [localEditContent, setLocalEditContent] = useState('');
      const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

      const localReplyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
      const localEditTextareaRef = useRef<HTMLTextAreaElement | null>(null);
      const localTypingTimerRef = useRef<NodeJS.Timeout | null>(null);
      const localIsTypingRef = useRef(false);

      const canManage = useMemo(() => canEditOrDelete(comment), [comment]);

      // Local edit handlers
      const handleStartEdit = useCallback(() => {
        setIsLocalEditing(true);
        setLocalEditContent(comment.content);

        setTimeout(() => {
          if (localEditTextareaRef.current) {
            const textarea = localEditTextareaRef.current;
            const length = textarea.value.length;

            textarea.focus();

            textarea.setSelectionRange(length, length);

            textarea.scrollTop = textarea.scrollHeight;
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
          await updateComment(comment.id, localEditContent);
          setIsLocalEditing(false);
          setLocalEditContent('');
          toast.success('Đã chỉnh sửa!');
        } catch (error) {
          if (error instanceof Error) toast.error(error.message);
        } finally {
          setIsSubmittingEdit(false);
        }
      };

      // Local reply submit handler
      const handleLocalReplySubmit = async () => {
        if (!localReplyContent.trim() || isSubmittingReply) return;

        setIsSubmittingReply(true);

        // Stop typing indicator
        if (localTypingTimerRef.current) {
          clearTimeout(localTypingTimerRef.current);
        }
        stopTyping(comment.id);
        localIsTypingRef.current = false;

        try {
          const mentions = await resolveMentions(localReplyContent, postId);
          await createComment(localReplyContent, {
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

      // Local typing handler
      const handleLocalTyping = (value: string) => {
        setLocalReplyContent(value);

        // Clear previous timer
        if (localTypingTimerRef.current) {
          clearTimeout(localTypingTimerRef.current);
        }

        // Emit typing
        if (!localIsTypingRef.current) {
          emitTyping(comment.id);
          localIsTypingRef.current = true;
        }

        // Auto stop after 3s
        localTypingTimerRef.current = setTimeout(() => {
          stopTyping(comment.id);
          localIsTypingRef.current = false;
        }, 3000);
      };

      return (
        <motion.div
          layout
          initial={comment._pending ? { opacity: 0, scale: 0.95 } : false} // ← CHỈ animate khi pending
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }} // ← Giảm duration
          className={`space-y-3`}
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
                    onChange={setLocalEditContent}
                    textareaRef={localEditTextareaRef}
                    className="bg-background focus:ring-primary w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    rows={3}
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {!isLocalEditing && (
                <div className="flex flex-wrap items-center gap-3 px-2 text-sm">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleLikeToggle(comment)}
                    className={cn(
                      'flex items-center gap-1 transition-colors hover:cursor-pointer',
                      comment.isLiked
                        ? 'text-red-500'
                        : 'text-muted-foreground hover:text-red-500',
                    )}
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
                        // ← KHÔNG cần setReplyTo nữa vì dùng comment.id local
                      }}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors hover:cursor-pointer"
                    >
                      <Reply className="h-4 w-4" />
                      <span className="hidden sm:inline">Trả lời</span>
                    </button>
                  )}

                  {canManage && !isLocalEditing && (
                    <>
                      <button
                        onClick={handleStartEdit}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors hover:cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Sửa</span>
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
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
                    key={`reply-${comment.id}`} // ← Key stable
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2 px-2"
                  >
                    <CommentTextarea
                      textareaRef={localReplyTextareaRef}
                      value={localReplyContent} // ← LOCAL state
                      onChange={handleLocalTyping}
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
                      onKeyDown={e => {
                        handleMentionKeyDown(
                          e as any,
                          localReplyTextareaRef.current!,
                        );
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleLocalReplySubmit();
                        }
                      }}
                      placeholder={`Trả lời ${comment.author.username}...`}
                      className="bg-background focus:ring-primary flex-1 resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                      rows={2}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={handleLocalReplySubmit} // ← LOCAL submit
                        disabled={
                          isSubmittingReply || !localReplyContent.trim()
                        }
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
              <CommentTextarea
                textareaRef={textareaRef}
                value={newComment}
                onChange={(value: string) => handleInputChange(value, 'new')}
                onFocus={() => handleFocus('new')} // ✅ Thêm onFocus
                onBlur={() => {
                  if (typingTimerRef.current) {
                    clearTimeout(typingTimerRef.current);
                  }
                  stopTyping();
                  isTypingRef.current = false;
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

              <AnimatePresence>
                {showStickerPicker && (
                  <StickerPicker
                    onSelect={sticker => {
                      setSelectedSticker(sticker);
                      setShowStickerPicker(false);
                    }}
                    onClose={() => setShowStickerPicker(false)}
                    className="top-32 z-[120]"
                  />
                )}
              </AnimatePresence>
            </div>

            {selectedSticker && (
              <div className="relative inline-block">
                <Image
                  src={selectedSticker.imageUrl}
                  alt="Selected sticker"
                  width={60}
                  height={60}
                  unoptimized
                  className="rounded-lg"
                />
                <button
                  onClick={() => setSelectedSticker(null)}
                  className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowStickerPicker(!showStickerPicker)}
              >
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
                {/* {Array.from(typingUsers.values())
                  .map(u => u.username)
                  .join(', ')}{' '} */}
                Someone is typing...
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
              <AnimatePresence mode="popLayout">
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
