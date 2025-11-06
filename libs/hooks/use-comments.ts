'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { useSocket, SOCKET_EVENTS } from '@/providers/socket';

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  likeCount: number;
  replyCount: number;
  isLiked: boolean;
  author: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  mentions: Array<{
    id: string;
    userId: string;
    username: string;
    position: number;
  }>;
  sticker?: {
    id: string;
    imageUrl: string;
    name: string;
  };
  parentId?: string;
  replyTo?: {
    id: string;
    username: string;
  };
  replies?: Comment[];
  _optimistic?: boolean;
  _pending?: boolean;
}

interface UseCommentsOptions {
  postId: string;
  enabled?: boolean;
}

export function useComments({ postId, enabled = true }: UseCommentsOptions) {
  const { socket, isConnected } = useSocket();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<
    Map<string, { userId: string; username: string }>
  >(new Map());
  const [isPending, startTransition] = useTransition();

  // const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // const socketRef = useRef(socket);
  // const isConnectedRef = useRef(isConnected);

  // useEffect(() => {
  //   socketRef.current = socket;
  //   isConnectedRef.current = isConnected;
  // }, [socket, isConnected]);

  const fetchComments = useCallback(
    async (cursor?: string | null) => {
      try {
        const url = new URL(
          `/api/posts/${postId}/comments`,
          window.location.origin,
        );
        if (cursor) url.searchParams.set('cursor', cursor);

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch comments');

        const data = await res.json();

        if (cursor) {
          setComments(prev => [...prev, ...data.comments]);
        } else {
          setComments(data.comments);
        }

        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [postId],
  );

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;
    fetchComments(nextCursor);
  }, [hasMore, isLoading, nextCursor, fetchComments]);

  const createComment = useCallback(
    (
      content: string,
      options?: {
        parentId?: string;
        mentions?: Array<{
          userId: string;
          username: string;
          position: number;
        }>;
        stickerId?: string;
      },
    ) => {
      return new Promise<Comment>((resolve, reject) => {
        // const currentSocket = socketRef.current;
        // const currentIsConnected = isConnectedRef.current;

        if (!socket || !isConnected) {
          return reject(new Error('Socket not connected'));
        }

        // Optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticComment: Comment = {
          id: tempId,
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isEdited: false,
          likeCount: 0,
          replyCount: 0,
          isLiked: false,
          author: {
            id: 'temp',
            name: 'You',
            username: 'you',
            image: null,
          },
          mentions:
            options?.mentions?.map((m, index) => ({
              id: `${tempId}-mention-${index}`,
              userId: m.userId,
              username: m.username,
              position: m.position,
            })) || [],
          parentId: options?.parentId,
          _optimistic: true,
          _pending: true,
        };

        startTransition(() => {
          if (!options?.parentId) {
            setComments(prev => [optimisticComment, ...prev]);
          } else {
            setComments(prev =>
              prev.map(c =>
                c.id === options.parentId
                  ? {
                      ...c,
                      replyCount: c.replyCount + 1,
                      replies: [...(c.replies || []), optimisticComment],
                    }
                  : c,
              ),
            );
          }
        });

        socket.emit(
          SOCKET_EVENTS.COMMENT_NEW,
          {
            postId,
            content,
            ...options,
          },
          (response: any) => {
            if (response.error) {
              // Rollback optimistic update
              startTransition(() => {
                setComments(prev => prev.filter(c => c.id !== tempId));
              });
              reject(new Error(response.error));
            } else {
              // Replace optimistic với real comment
              startTransition(() => {
                if (!options?.parentId) {
                  setComments(prev =>
                    prev.map(c => (c.id === tempId ? response.comment : c)),
                  );
                } else {
                  setComments(prev =>
                    prev.map(c =>
                      c.id === options.parentId
                        ? {
                            ...c,
                            replies: (c.replies || []).map(r =>
                              r.id === tempId ? response.comment : r,
                            ),
                          }
                        : c,
                    ),
                  );
                }
              });
              resolve(response.comment);
            }
          },
        );
      });
    },
    [postId, socket, isConnected],
  );

  const updateComment = useCallback(
    (commentId: string, content: string) => {
      return new Promise<void>((resolve, reject) => {
        if (!socket || !isConnected) {
          return reject(new Error('Socket not connected'));
        }

        // Optimistic update - chỉ update content và isEdited
        const previousComments = comments;
        startTransition(() => {
          setComments(prev =>
            prev.map(c =>
              c.id === commentId
                ? {
                    ...c, // ✅ Giữ nguyên tất cả fields (replies, author, etc.)
                    content,
                    isEdited: true,
                    _pending: true,
                  }
                : c,
            ),
          );
        });

        socket.emit(
          SOCKET_EVENTS.COMMENT_UPDATE,
          { commentId, postId, content },
          (response: any) => {
            if (response.error) {
              // Rollback
              setComments(previousComments);
              reject(new Error(response.error));
            } else {
              startTransition(() => {
                setComments(prev =>
                  prev.map(c =>
                    c.id === commentId
                      ? {
                          ...c, // ✅ Giữ nguyên replies và các field khác
                          ...response.comment, // Merge với data mới từ server
                          replies: c.replies, // ✅ Đảm bảo replies không bị mất
                          _pending: false,
                        }
                      : c,
                  ),
                );
              });
              resolve();
            }
          },
        );
      });
    },
    [postId, comments, socket, isConnected],
  );

  const likeComment = useCallback(
    (commentId: string) => {
      return new Promise<void>((resolve, reject) => {
        // const currentSocket = socketRef.current;
        // const currentIsConnected = isConnectedRef.current;

        if (!socket || !isConnected) {
          return reject(new Error('Socket not connected'));
        }

        // Optimistic update
        startTransition(() => {
          setComments(prev =>
            prev.map(c =>
              c.id === commentId
                ? { ...c, isLiked: true, likeCount: c.likeCount + 1 }
                : c,
            ),
          );
        });

        socket.emit(
          SOCKET_EVENTS.COMMENT_LIKE,
          { commentId, postId },
          (response: any) => {
            if (response.error) {
              // Rollback
              startTransition(() => {
                setComments(prev =>
                  prev.map(c =>
                    c.id === commentId
                      ? { ...c, isLiked: false, likeCount: c.likeCount - 1 }
                      : c,
                  ),
                );
              });
              reject(new Error(response.error));
            } else {
              resolve();
            }
          },
        );
      });
    },
    [postId, socket, isConnected],
  );

  const unlikeComment = useCallback(
    (commentId: string) => {
      return new Promise<void>((resolve, reject) => {
        // const currentSocket = socketRef.current;
        // const currentIsConnected = isConnectedRef.current;

        if (!socket || !isConnected) {
          return reject(new Error('Socket not connected'));
        }

        // Optimistic update
        startTransition(() => {
          setComments(prev =>
            prev.map(c =>
              c.id === commentId
                ? {
                    ...c,
                    isLiked: false,
                    likeCount: Math.max(0, c.likeCount - 1),
                  }
                : c,
            ),
          );
        });

        socket.emit(
          SOCKET_EVENTS.COMMENT_UNLIKE,
          { commentId, postId },
          (response: any) => {
            if (response.error) {
              // Rollback
              startTransition(() => {
                setComments(prev =>
                  prev.map(c =>
                    c.id === commentId
                      ? { ...c, isLiked: true, likeCount: c.likeCount + 1 }
                      : c,
                  ),
                );
              });
              reject(new Error(response.error));
            } else {
              resolve();
            }
          },
        );
      });
    },
    [postId, socket, isConnected],
  );

  const deleteComment = useCallback(
    (commentId: string) => {
      return new Promise<void>((resolve, reject) => {
        // const currentSocket = socketRef.current;
        // const currentIsConnected = isConnectedRef.current;

        if (!socket || !isConnected) {
          return reject(new Error('Socket not connected'));
        }

        const previousComments = comments;
        startTransition(() => {
          setComments(prev => prev.filter(c => c.id !== commentId));
        });

        socket.emit(
          SOCKET_EVENTS.COMMENT_DELETE,
          { commentId, postId },
          (response: any) => {
            if (response.error) {
              setComments(previousComments);
              reject(new Error(response.error));
            } else {
              resolve();
            }
          },
        );
      });
    },
    [postId, comments, socket, isConnected],
  );

  const emitTyping = useCallback(
    (parentId?: string) => {
      if (!socket || !isConnected) {
        console.warn('❌ Cannot emit - socket not ready');
        return;
      }

      socket.emit(SOCKET_EVENTS.COMMENT_TYPING, { postId, parentId });
    },
    [postId, socket, isConnected],
  );

  const stopTyping = useCallback(
    (parentId?: string) => {
      if (!socket || !isConnected) {
        console.warn('❌ Cannot stop typing - socket not ready');
        return;
      }

      socket.emit(SOCKET_EVENTS.COMMENT_STOP_TYPING, { postId, parentId });
    },
    [postId, socket, isConnected],
  );

  useEffect(() => {
    if (!socket || !isConnected || !enabled) return;

    socket.emit(SOCKET_EVENTS.POST_JOIN, postId);

    const handleCommentCreated = (comment: Comment) => {
      startTransition(() => {
        setComments(prev => {
          // Tránh duplicate
          if (prev.some(c => c.id === comment.id)) return prev;

          if (!comment.parentId) {
            return [comment, ...prev.filter(c => !c._optimistic)];
          } else {
            return prev.map(c =>
              c.id === comment.parentId
                ? {
                    ...c,
                    replyCount: c.replyCount + 1,
                    replies: [...(c.replies || []), comment],
                  }
                : c,
            );
          }
        });
      });
    };

    const handleCommentUpdated = (comment: Comment) => {
      startTransition(() => {
        setComments(prev =>
          prev.map(c =>
            c.id === comment.id
              ? {
                  ...c, // ✅ Giữ nguyên replies
                  ...comment, // Merge data mới
                  replies: c.replies, // ✅ Preserve replies
                }
              : c,
          ),
        );
      });
    };

    const handleCommentLiked = (data: {
      commentId: string;
      likeCount: number;
      userId: string;
    }) => {
      startTransition(() => {
        setComments(prev =>
          prev.map(c =>
            c.id === data.commentId ? { ...c, likeCount: data.likeCount } : c,
          ),
        );
      });
    };

    const handleCommentUnliked = (data: {
      commentId: string;
      likeCount: number;
      userId: string;
    }) => {
      startTransition(() => {
        setComments(prev =>
          prev.map(c =>
            c.id === data.commentId ? { ...c, likeCount: data.likeCount } : c,
          ),
        );
      });
    };

    const handleCommentDeleted = (data: { commentId: string }) => {
      startTransition(() => {
        setComments(prev => prev.filter(c => c.id !== data.commentId));
      });
    };

    const handleTyping = (data: {
      userId: string;
      username: string;
      postId: string;
      parentId?: string;
    }) => {
      setTypingUsers(prev =>
        new Map(prev).set(data.userId, {
          userId: data.userId,
          username: data.username,
        }),
      );

      // const existingTimeout = typingTimeouts.current.get(data.userId);
      // if (existingTimeout) clearTimeout(existingTimeout);

      // const timeout = setTimeout(() => {
      //   setTypingUsers(prev => {
      //     const next = new Map(prev);
      //     next.delete(data.userId);
      //     return next;
      //   });
      //   typingTimeouts.current.delete(data.userId);
      // }, 5000);

      // typingTimeouts.current.set(data.userId, timeout);
    };

    const handleStopTyping = (data: { userId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });

      // const timeout = typingTimeouts.current.get(data.userId);
      // if (timeout) {
      //   clearTimeout(timeout);
      //   typingTimeouts.current.delete(data.userId);
      // }
    };

    socket.on(SOCKET_EVENTS.COMMENT_CREATED, handleCommentCreated);
    socket.on(SOCKET_EVENTS.COMMENT_UPDATED, handleCommentUpdated);
    socket.on(SOCKET_EVENTS.COMMENT_LIKED, handleCommentLiked);
    socket.on(SOCKET_EVENTS.COMMENT_UNLIKED, handleCommentUnliked);
    socket.on(SOCKET_EVENTS.COMMENT_DELETED, handleCommentDeleted);
    socket.on(SOCKET_EVENTS.COMMENT_TYPING, handleTyping);
    socket.on(SOCKET_EVENTS.COMMENT_STOP_TYPING, handleStopTyping);

    return () => {
      socket.emit(SOCKET_EVENTS.POST_LEAVE, postId);
      socket.off(SOCKET_EVENTS.COMMENT_CREATED, handleCommentCreated);
      socket.off(SOCKET_EVENTS.COMMENT_UPDATED, handleCommentUpdated);
      socket.off(SOCKET_EVENTS.COMMENT_LIKED, handleCommentLiked);
      socket.off(SOCKET_EVENTS.COMMENT_UNLIKED, handleCommentUnliked);
      socket.off(SOCKET_EVENTS.COMMENT_DELETED, handleCommentDeleted);
      socket.off(SOCKET_EVENTS.COMMENT_TYPING, handleTyping);
      socket.off(SOCKET_EVENTS.COMMENT_STOP_TYPING, handleStopTyping);

      // typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
      // typingTimeouts.current.clear();
    };
  }, [socket, isConnected, postId, enabled]);

  useEffect(() => {
    if (enabled) {
      fetchComments();
    }
  }, [enabled, fetchComments]);

  return {
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
    refetch: () => fetchComments(),
  };
}
