import { Client } from "@elastic/elasticsearch";
import fs from "fs";
import { env } from "./env";

const auth =
  env.elasticsearch.username && env.elasticsearch.password
    ? {
        username: env.elasticsearch.username,
        password: env.elasticsearch.password
      }
    : undefined;

const tlsOptions: Record<string, unknown> = {};

if (env.elasticsearch.caCertPath) {
  try {
    tlsOptions.ca = fs.readFileSync(env.elasticsearch.caCertPath);
  } catch (error) {
    console.warn(`Failed to read Elasticsearch CA certificate at ${env.elasticsearch.caCertPath}`, error);
  }
}

if (env.elasticsearch.skipTlsVerify) {
  tlsOptions.rejectUnauthorized = false;
}

const tls = Object.keys(tlsOptions).length > 0 ? (tlsOptions as { ca?: Buffer; rejectUnauthorized?: boolean }) : undefined;

export const elasticClient = new Client({
  node: env.elasticsearch.node,
  auth,
  tls
});

export const videoIndexName = env.elasticsearch.index;
