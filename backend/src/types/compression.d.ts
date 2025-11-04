declare module "compression" {
  import { RequestHandler } from "express";

  export interface CompressionOptions {
    threshold?: number | string;
  }

  export default function compression(options?: CompressionOptions): RequestHandler;
}
