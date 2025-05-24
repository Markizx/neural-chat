import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { storageService } from '../services/storage.service';

interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: Function) => void;
  off: (event: string, handler?: Function) => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = storageService.getAccessToken();
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_WS_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated]);

  const emit = useCallback(
    (event: string, data?: any) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit(event, data);
      }
    },
    []
  );

  const on = useCallback(
    (event: string, handler: Function) => {
      if (socketRef.current) {
        socketRef.current.on(event, handler as any);
      }
    },
    []
  );

  const off = useCallback(
    (event: string, handler?: Function) => {
      if (socketRef.current) {
        if (handler) {
          socketRef.current.off(event, handler as any);
        } else {
          socketRef.current.off(event);
        }
      }
    },
    []
  );

  return {
    socket,
    connected,
    emit,
    on,
    off,
  };
};