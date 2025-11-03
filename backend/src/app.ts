import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import pinoHttp from "pino-http";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { env } from "./config/env";

const app = express();

app.use(
  pinoHttp({
    level: env.nodeEnv === "development" ? "debug" : "info"
  })
);

const connectSources = [
  "'self'",
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
  "https://*.youtube.com",
  "https://*.ytimg.com",
  "https://*.googlevideo.com",
  "https://*.googleusercontent.com",
  "https://player.vimeo.com"
];
if (env.nodeEnv === "development") {
  connectSources.push("http://localhost:5173", "https://localhost:5173", "ws://localhost:5173", "wss://localhost:5173");
}

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "img-src": ["'self'", "data:", "https:"],
        "media-src": ["'self'", "data:", "https:"],
        "style-src": ["'self'", "https:", "'unsafe-inline'"],
        "frame-src": ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com", "https://player.vimeo.com"],
        "connect-src": connectSources
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(
  cors({
    origin: "*"
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
