import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
      { autoConnect: false, transports: ['websocket', 'polling'] }
    );
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('auth', token);
  s.emit('subscribe:ev');
  s.emit('subscribe:arb');
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
