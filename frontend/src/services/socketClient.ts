import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";

export const socket = io(SOCKET_URL, { withCredentials: true, autoConnect: false });

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
