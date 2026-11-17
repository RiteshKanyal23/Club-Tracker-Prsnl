import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import { env } from "./config/environment";
import { connectDatabase } from "./config/database";
import { registerSocketHandlers } from "./sockets";
import { registerJobs } from "./jobs";

async function bootstrap() {
  try {
    await connectDatabase();
    console.log("Database connected");
  } catch (err) {
    console.warn("Database connection skipped/failed at startup (ensure DATABASE_URL and postgres are available):", (err as Error).message);
  }

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: env.CORS_ORIGIN.split(",").map((s: string) => s.trim()), credentials: true } });
  registerSocketHandlers(io);
  registerJobs();

  server.listen(env.PORT, () => {
    console.log(`Backend listening on port ${env.PORT}`);
  });
}

bootstrap();
