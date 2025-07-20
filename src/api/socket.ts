import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS, SocketEventName } from '../types/socketEvents';
import { useCollaborationStore } from '../store/useCollaborationStore';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

const token = localStorage.getItem('jwt');

export const socket: Socket = io(API_URL, {
  auth: { token },
  autoConnect: true, // Always connect immediately
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

// Typed emit helper
export function emitSocketEvent<TPayload, TAck = void>(
  event: SocketEventName,
  payload: TPayload,
  ack?: (ack: TAck) => void
) {
  socket.emit(event, payload, ack);
}

// Typed on helper
export function onSocketEvent<TPayload>(
  event: SocketEventName,
  handler: (payload: TPayload) => void
) {
  socket.on(event, handler);
}

// Auth/reconnect logic
socket.on('connect_error', (err) => {
  if (err.message === 'Invalid token' || err.message === 'No token provided') {
    // Optionally: trigger logout or token refresh
    console.error('Socket auth error:', err.message);
  }
});

// Utility to update token on login
export function setSocketAuthToken(newToken: string) {
  socket.auth = { token: newToken };
}

export function getSocketId() {
  return socket.id;
}

// Subscribe to socket status changes and update Zustand store
export function subscribeToSocketStatus() {
  const setStatus = useCollaborationStore.getState().setStatus;
  socket.on('connect', () => setStatus('connected'));
  socket.on('disconnect', () => setStatus('reconnecting'));
  socket.on('reconnect_attempt', () => setStatus('reconnecting'));
  socket.on('reconnect', () => setStatus('connected'));
  socket.on('connect_error', () => setStatus('reconnecting'));
} 