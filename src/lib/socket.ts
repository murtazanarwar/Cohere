import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(userId: string, token?: string) {
  if (socket) return socket;
  socket = io('http://localhost:4000', {
    auth: { userId, token }, // send your auth token if needed
  });
  return socket;
}

export function getSocket() {
  if (!socket) throw new Error('Socket not initialized');
  return socket;
}
