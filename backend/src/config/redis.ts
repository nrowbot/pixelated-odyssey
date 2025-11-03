import { createClient } from "redis";
import { env } from "./env";

export const redisClient = createClient({
  url: env.redisUrl
});

redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});

export async function connectRedis(): Promise<void> {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient.isOpen) {
    await redisClient.disconnect();
  }
}
