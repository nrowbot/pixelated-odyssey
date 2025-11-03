import dotenv from "dotenv";

dotenv.config();

const required = ["DATABASE_URL", "ELASTICSEARCH_NODE", "REDIS_URL", "SEARCH_INDEX_NAME"];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL as string,
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE as string,
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
    index: process.env.SEARCH_INDEX_NAME as string,
    caCertPath: process.env.ELASTICSEARCH_CA_CERT_PATH,
    skipTlsVerify: process.env.ELASTICSEARCH_SKIP_TLS_VERIFY === "true"
  },
  redisUrl: process.env.REDIS_URL as string,
  searchCacheTtlSeconds: Number(process.env.SEARCH_CACHE_TTL_SECONDS ?? 120)
};
