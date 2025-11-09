'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
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
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useVirtualizer } from '@tanstack/react-virtual';
import Link from 'next/link';
import { useComments, Comment } from '@/libs/hooks/use-comments';
import { useMentionSearch } from '@/libs/hooks/use-mention-search';
import { resolveMentions } from '@/libs/helpers/mention.helpter';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePermissions } from '@/libs/hooks/use-permissions';
import { StickerPicker } from './sticker-picker';
import { MentionMenu, MentionUser } from './mention-menu';
import { CommentTextarea, CommentTextareaRef } from './comment-textarea';
import { CommentItem } from './comment-item';
import { cn, formatTimeAgo } from '@/libs/utils';

interface BlogCommentsProps {
  postId: string;
  locale: string;
}

function BlogCommentsComponent({ postId, locale }: BlogCommentsProps) {
  const { data: session } = useSession();
  const currentUser = session?.user;

  const {
    comments,
    totalComments,
    isLoading,
    isLoadingMore,
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
    loadMoreReplies,
  } = useComments({ postId });

  console.log('Comments rendered with comments count:', comments);
  console.log('Has more: ', hasMore);

  const { hasMinimumRole } = usePermissions();

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRepliesFor, setLoadingRepliesFor] = useState<Set<string>>(
    new Set(),
  );

  const textareaRef = useRef<CommentTextareaRef | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<{
    id: string;
    imageUrl: string;
  } | null>(null);

  const [confirmedMentions, setConfirmedMentions] = useState<
    Array<{
      id: string;
      userId: string;
      username: string;
      position: number;
    }>
  >([]);

  const {
    showMentions,
    mentionUsers,
    selectedMentionIndex,
    isSearching,
    anchorEl,
    mentionStartPos,
    handleMentionInput,
    handleMentionKeyDown,
    closeMentions,
  } = useMentionSearch(postId);

  const estimateCommentHeight = useCallback(
    (index: number) => {
      const comment = comments[index];
      if (!comment) return 150;

      // Base height: avatar + padding + actions
      let height = 80;

      // Content height (ước tính ~20px mỗi 60 ký tự)
      const contentLines = Math.max(1, Math.ceil(comment.content.length / 60));
      height += contentLines * 24;

      // Sticker
      if (comment.sticker) {
        height += 120;
      }

      // Mentions và metadata
      if (comment.mentions?.length > 0) {
        height += 20;
      }

      // Replies
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach(reply => {
          let replyHeight = 70; // Base reply height
          const replyLines = Math.max(1, Math.ceil(reply.content.length / 60));
          replyHeight += replyLines * 24;

          if (reply.sticker) replyHeight += 120;
          height += replyHeight;
        });
      }

      // "Load more replies" button
      if (comment.hasMoreReplies) {
        height += 48;
      }

      // Padding giữa các comments
      height += 24;

      return height;
    },
    [comments],
  );

  const rowVirtualizer = useVirtualizer({
    count: comments.length,
    getScrollElement: () => parentRef.current?.parentElement || null,
    estimateSize: estimateCommentHeight,
    overscan: 3, // Tăng overscan lên một chút
    measureElement: element => {
      const height = element?.getBoundingClientRect().height;
      return height || 150; // Fallback nếu không đo được
    },
  });

  const insertMention = useCallback(
    (user: MentionUser) => {
      if (!textareaRef.current || mentionStartPos === null) return;

      const mentionText = `@${user.username} `;
      const cursorPos = textareaRef.current.getSelectionStart();
      const beforeMention = newComment.slice(0, mentionStartPos);
      const afterCursor = newComment.slice(cursorPos);

      const newValue = `${beforeMention}${mentionText}${afterCursor}`;
      const newCursorPos = mentionStartPos + mentionText.length;

      setNewComment(newValue);

      setConfirmedMentions(prev => [
        ...prev.filter(m => m.position < mentionStartPos),
        {
          id: `mention-${Date.now()}-${user.id}`,
          userId: user.id,
          username: user.username,
          position: mentionStartPos,
        },
        ...prev
          .filter(m => m.position >= cursorPos)
          .map(m => ({
            ...m,
            position:
              m.position + mentionText.length - (cursorPos - mentionStartPos),
          })),
      ]);

      closeMentions();

      setTimeout(() => {
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current?.focus();
      }, 10);
    },
    [newComment, mentionStartPos, closeMentions],
  );

  const handleInputChange = useCallback(
    (value: string, cursorPos: number) => {
      const lengthDiff = value.length - newComment.length;

      setNewComment(value);

      setConfirmedMentions(prev =>
        prev
          .filter(mention => {
            const mentionText = `@${mention.username}`;
            const actualText = value.slice(
              mention.position,
              mention.position + mentionText.length,
            );
            return actualText === mentionText;
          })
          .map(mention => {
            if (mention.position >= cursorPos && lengthDiff !== 0) {
              return {
                ...mention,
                position: mention.position + lengthDiff,
              };
            }
            return mention;
          }),
      );

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (!isTypingRef.current) {
        emitTyping(undefined);
        isTypingRef.current = true;
      }
      typingTimerRef.current = setTimeout(() => {
        stopTyping(undefined);
        isTypingRef.current = false;
      }, 3000);

      const editableDiv = document.querySelector(
        '[contenteditable="true"][data-main-textarea]',
      ) as HTMLElement;

      console.log('Handling mention input with cursor at:', cursorPos);

      handleMentionInput(value, cursorPos, editableDiv);
    },
    [newComment, emitTyping, stopTyping, handleMentionInput],
  );

  const handleFocus = useCallback(() => {
    if (!isTypingRef.current) {
      emitTyping(undefined);
      isTypingRef.current = true;
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    typingTimerRef.current = setTimeout(() => {
      stopTyping(undefined);
      isTypingRef.current = false;
    }, 3000);
  }, [emitTyping, stopTyping]);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    stopTyping();

    try {
      const mentions = await resolveMentions(newComment, postId);
      await createComment(newComment, { mentions });
      setNewComment('');
      setConfirmedMentions([]);

      // Đợi một chút để DOM update xong
      setTimeout(() => {
        rowVirtualizer.measure(); // Force đo lại
      }, 100);

      toast.success('Đã đăng bình luận!');
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadMoreReplies = async (
    commentId: string,
    cursor: string | null,
  ) => {
    setLoadingRepliesFor(prev => new Set(prev).add(commentId));
    try {
      await loadMoreReplies(commentId, cursor);
    } finally {
      setLoadingRepliesFor(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
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
      return hasMinimumRole(100);
    },
    [currentUser, hasMinimumRole],
  );

  const renderContent = (
    content: string,
    mentions: Array<{
      id: string;
      userId: string;
      username: string;
      position: number;
    }>,
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
          className="text-primary bg-primary/10 rounded px-1 font-semibold hover:underline"
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

  useEffect(() => {
    console.log('Observer setup - hasMore:', hasMore, 'isLoading:', isLoading);
    if (!loadMoreSentinelRef.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          console.log('Intersection detected, loading more');
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1,
      },
    );

    observer.observe(loadMoreSentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadMoreSentinelRef?.current]);

  useEffect(() => {
    // Khi có comment mới, đo lại tất cả items
    rowVirtualizer.measure();
  }, [comments.length, rowVirtualizer]);

  useEffect(() => {
  if (!isLoadingMore) {
    requestAnimationFrame(() => {
      rowVirtualizer.measure();
    });
  }
}, [isLoadingMore]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Bình luận ({totalComments || 0})
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 !p-4">
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
                  ref={textareaRef}
                  value={newComment}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onBlur={() => {
                    setTimeout(() => closeMentions(), 200);

                    if (typingTimerRef.current) {
                      clearTimeout(typingTimerRef.current);
                    }
                    stopTyping();
                    isTypingRef.current = false;
                  }}
                  onKeyDown={e => {
                    const keyResult = handleMentionKeyDown(e as any);

                    if (
                      keyResult &&
                      typeof keyResult === 'object' &&
                      'id' in keyResult
                    ) {
                      insertMention(keyResult as MentionUser);
                      return;
                    }

                    if (e.key === ' ' && showMentions) {
                      closeMentions();
                    }

                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSubmit();
                    }
                  }}
                  placeholder="Viết bình luận... Dùng @ để nhắc đến (tối thiểu 2 ký tự)"
                  className="bg-background focus:ring-primary min-h-20 w-full resize-none rounded-lg border px-4 py-3 leading-normal transition-all focus:ring-2 focus:outline-none"
                  disabled={isSubmitting}
                  mentions={confirmedMentions}
                  data-main-textarea
                />

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
                <span>Someone is typing...</span>
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
              <div
                ref={parentRef}
                className="min-h-[200px]"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const comment = comments[virtualRow.index];
                    return (
                      <div
                        key={comment.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="py-3"
                      >
                        <CommentItem
                          comment={comment}
                          locale={locale}
                          postId={postId}
                          canEditOrDelete={canEditOrDelete}
                          loadingRepliesFor={loadingRepliesFor}
                          onLikeToggle={handleLikeToggle}
                          onDelete={handleDelete}
                          onUpdate={updateComment}
                          onCreate={createComment}
                          onLoadMoreReplies={handleLoadMoreReplies}
                          emitTyping={emitTyping}
                          stopTyping={stopTyping}
                          renderContent={renderContent}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div ref={loadMoreSentinelRef} className="py-4 text-center">
                {isLoadingMore && (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang tải thêm...</span>
                  </div>
                )}
              </div>
            </>
          ) : session ? (
            <div className="text-muted-foreground py-12 text-center">
              <MessageCircle className="mx-auto mb-2 h-12 w-12 opacity-20" />
              <p>Chưa có bình luận. Hãy là người đầu tiên!</p>
            </div>
          ) : null}
        </CardContent>

        {showMentions && (
          <MentionMenu
            users={mentionUsers}
            selectedIndex={selectedMentionIndex}
            onSelect={insertMention}
            isSearching={isSearching}
            anchorEl={anchorEl}
            mentionStartPos={mentionStartPos}
          />
        )}
      </Card>
    </>
  );
}

export const BlogComments = memo(BlogCommentsComponent);
