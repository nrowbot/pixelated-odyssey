import type { Prisma } from "../../node_modules/.prisma/client/index.d.ts";
// import { PrismaClient } from '../generated/prisma'

// const prisma = new PrismaClient()

export interface CreateVideoInput {
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  category: string;
  tags?: string[];
  uploadDate?: Date;
  uploaderName: string;
  fileSize: number;
  resolution: string;
}

export interface UpdateVideoInput {
  title?: string;
  description?: string;
  url?: string;
  thumbnailUrl?: string;
  duration?: number;
  category?: string;
  tags?: string[];
  uploadDate?: Date;
  uploaderName?: string;
  fileSize?: number;
  resolution?: string;
}

export interface ListVideosOptions {
  page: number;
  pageSize: number;
}

export type VideoRecord = Prisma.VideoGetPayload<{}>;

export type VideoWithRelations = Prisma.VideoGetPayload<{
  include: {
    tags: {
      include: {
        tag: true;
      };
    };
  };
}>;