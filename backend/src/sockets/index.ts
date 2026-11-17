import { Server } from "socket.io";

let ioRef: Server | null = null;

export function registerSocketHandlers(io: Server) {
  ioRef = io;
  io.on("connection", (socket) => {
    socket.emit("connected", { message: "Socket connected" });
    socket.on("join:user", (userId: string) => { if (userId) socket.join(`user:${userId}`); });
    socket.on("join:project", (projectId: string) => { if (projectId) socket.join(`project:${projectId}`); });
    socket.on("leave:project", (projectId: string) => { if (projectId) socket.leave(`project:${projectId}`); });
    socket.on("join:channel", (channelId: string) => { if (channelId) socket.join(`channel:${channelId}`); });
    socket.on("leave:channel", (channelId: string) => { if (channelId) socket.leave(`channel:${channelId}`); });
    socket.on("typing", (data: any) => { if (data?.channelId) socket.to(`channel:${data.channelId}`).emit("typing", data); });
    socket.on("disconnect", () => {});
  });
}

export function emitToProject(projectId: string, event: string, payload: any) {
  ioRef?.to(`project:${projectId}`).emit(event, payload);
}

export function emitToAll(event: string, payload: any) {
  ioRef?.emit(event, payload);
}

export function emitToUser(userId: string, event: string, payload: any) {
  ioRef?.to(`user:${userId}`).emit(event, payload);
}

export function emitToChannel(channelId: string, event: string, payload: any) {
  ioRef?.to(`channel:${channelId}`).emit(event, payload);
}
