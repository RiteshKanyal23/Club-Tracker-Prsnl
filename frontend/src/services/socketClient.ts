import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
export const socket = io(URL, { withCredentials: true, autoConnect: false });

let joinedUser: string | null = null;
export function connectSocket(userId?: string) {
  if (!socket.connected) socket.connect();
  if (userId && joinedUser !== userId) {
    socket.emit("join:user", userId);
    joinedUser = userId;
  }
}
export function disconnectSocket() {
  joinedUser = null;
  if (socket.connected) socket.disconnect();
}
