import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { corsOptions } from "./config/cors";
import { env } from "./config/environment";
import { apiRouter } from "./routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { requestContextMiddleware } from "./utils/requestContext";

export const app = express();

app.use(requestContextMiddleware);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https://unpkg.com"],
        connectSrc: ["'self'"],
      },
    },
  }),
);
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX }));

app.use("/api/v1", apiRouter);
app.use(errorMiddleware);
