import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getStoredAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('noblenet-auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken || null;
  } catch {
    return null;
  }
}

export function getSocket(): Socket {
  if (!socket) {
    const backendUrl = import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL).origin
      : 'http://localhost:5000';

    socket = io(backendUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: (cb) => {
        const token = getStoredAccessToken();
        cb({ token });
      },
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to NobleNet real-time gateway:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from real-time gateway:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('Real-time connection retry in progress:', err.message);
    });
  }

  return socket;
}

export function reconnectSocketWithAuth() {
  if (socket) {
    socket.disconnect();
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
