'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  disconnect: () => void;
}

export const SOCKET_EVENTS = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  POST_JOIN: 'join:post',
  POST_LEAVE: 'leave:post',

  // Comments
  COMMENT_NEW: 'comment:new',
  COMMENT_REPLY: 'comment:reply',
  COMMENT_UPDATE: 'comment:update',
  COMMENT_DELETE: 'comment:delete',
  COMMENT_LIKE: 'comment:like',
  COMMENT_UNLIKE: 'comment:unlike',

  // Real-time updates
  COMMENT_CREATED: 'comment:created',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',
  COMMENT_LIKED: 'comment:liked',
  COMMENT_UNLIKED: 'comment:unliked',

  // Post views
  POST_VIEW_START: 'post:view:start',
  POST_VIEW_UPDATE: 'post:view:update',
  POST_VIEW_QUALIFIED: 'post:view:qualified',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_READ_ALL: 'notification:read-all',

  // Typing indicators
  COMMENT_TYPING: 'comment:typing',
  COMMENT_STOP_TYPING: 'comment:stop_typing',

  // System
  SYSTEM_MESSAGE: 'system:message',
  ERROR: 'error',

  // Email
  EMAIL_SENT: 'email:sent',
  EMAIL_FAILED: 'email:failed',
} as const;

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  disconnect: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(
    session?.user?.accessToken || null,
  );

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (
      currentAccessToken !== session?.user?.accessToken ||
      !socketRef.current
    ) {
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';

      const newSocket = io(socketUrl, {
        auth: {
          token: session?.user?.accessToken || '',
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts,
        upgrade: false,
        forceNew: false,
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
        reconnectAttempts.current = 0;
      });

      newSocket.on('disconnect', reason => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          reconnectTimeoutRef.current = setTimeout(() => {
            newSocket.connect();
            reconnectAttempts.current++;
          }, 1000);
        } else if (reason === 'transport close') {
          reconnectTimeoutRef.current = setTimeout(() => {
            newSocket.connect();
            reconnectAttempts.current++;
          }, 1000);
        }
      });

      newSocket.on('connect_error', error => {
        console.error('Socket connection error:', error);
        reconnectAttempts.current++;

        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          newSocket.disconnect();
        }
      });

      newSocket.on('error', error => {
        console.error('Socket error:', error);
      });

      newSocket.on('system:message', data => {
        console.log('System message:', data);
      });

      setSocket(newSocket);
      socketRef.current = newSocket;
    }

    setCurrentAccessToken(session?.user?.accessToken || null);

    return () => {
      if (status === 'unauthenticated' && socketRef.current) {
        console.log('🔌 Cleaning up socket on logout');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      }
    };
  }, [session?.user?.accessToken, status]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  const contextValue = useMemo(
    () => ({ socket, isConnected, disconnect }),
    [socket, isConnected, disconnect],
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
