import type { Socket } from 'socket.io-client';

let socket: Socket | null = null;

// SSR no-op — socket.io-client must not be imported server-side because the
// engine.io-client native addons (ws/bufferutil) keep the Node.js event loop
// alive and cause Next.js static generation to time out at 60 s.
const ssrNoop = {
  on(_ev: string, _fn: unknown) { return ssrNoop; },
  off(_ev: string, _fn: unknown) { return ssrNoop; },
  emit(_ev: string, ..._args: unknown[]) { return true; },
  connected: false,
} as unknown as Socket;

export function getSocket(): Socket {
  if (typeof window === 'undefined') return ssrNoop;
  if (!socket) {
    // Dynamic require keeps socket.io-client out of the server-side module graph
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { io } = require('socket.io-client') as { io: typeof import('socket.io-client').io };
    socket = io(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
      { autoConnect: false, transports: ['websocket', 'polling'] }
    );
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const s = getSocket();
  if (typeof window === 'undefined') return s;
  if (!s.connected) s.connect();
  s.emit('auth', token);
  s.emit('subscribe:ev');
  s.emit('subscribe:arb');
  return s;
}

export function disconnectSocket(): void {
  if (typeof window === 'undefined') return;
  socket?.disconnect();
}
