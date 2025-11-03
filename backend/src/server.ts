import app from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { connectRedis, disconnectRedis } from "./config/redis";
import { initializeSearchInfrastructure } from "./services/searchService";

async function bootstrap() {
  try {
    await connectDatabase();
    await connectRedis();
    await initializeSearchInfrastructure();

    const server = app.listen(env.port, () => {
      console.log(`API server listening on port ${env.port}`);
    });

    const shutdown = async () => {
      console.log("Shutting down gracefully...");
      server.close(async () => {
        await disconnectRedis();
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void bootstrap();
