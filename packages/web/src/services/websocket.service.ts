import { io, Socket } from 'socket.io-client';
import { storageService } from './storage.service';

interface WebSocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig = {
    url: process.env.REACT_APP_WS_URL || 'http://localhost:5000',
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  };
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private connectionPromise: Promise<void> | null = null;

  constructor(config?: WebSocketConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Connect to WebSocket server
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const token = storageService.getAccessToken();
      if (!token) {
        reject(new Error('No authentication token'));
        return;
      }

      this.socket = io(this.config.url!, {
        auth: { token },
        transports: ['websocket'],
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.connectionPromise = null;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.connectionPromise = null;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Re-emit all events to registered handlers
      this.socket.onAny((event, ...args) => {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
          handlers.forEach(handler => handler(...args));
        }
      });
    });

    return this.connectionPromise;
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Emit event
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected. Event not sent:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  // Emit event with acknowledgment
  emitWithAck(event: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket acknowledgment timeout'));
      }, 10000); // 10 second timeout

      this.socket.emit(event, data, (response: any) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Register event handler
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    // If socket is already connected, register handler directly
    if (this.socket?.connected) {
      this.socket.on(event, handler as any);
    }
  }

  // Remove event handler
  off(event: string, handler?: Function): void {
    if (!handler) {
      // Remove all handlers for this event
      this.eventHandlers.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    } else {
      // Remove specific handler
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
      if (this.socket) {
        this.socket.off(event, handler as any);
      }
    }
  }

  // Register one-time event handler
  once(event: string, handler: Function): void {
    const wrappedHandler = (...args: any[]) => {
      handler(...args);
      this.off(event, wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }

  // Join room
  joinRoom(room: string): void {
    this.emit('join', room);
  }

  // Leave room
  leaveRoom(room: string): void {
    this.emit('leave', room);
  }

  // Get socket instance (use with caution)
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Export class for testing or multiple instances
export { WebSocketService };