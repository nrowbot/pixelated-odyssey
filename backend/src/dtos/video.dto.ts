import { Tag, Video } from "@prisma/client";

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

export interface VideoWithRelations extends Video {
  tags: Array<{
    tag: Tag;
  }>;
}
