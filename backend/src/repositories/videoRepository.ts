import { Prisma, Tag, Video } from "@prisma/client";
import { prisma } from "../config/database";
import { CreateVideoInput, ListVideosOptions, UpdateVideoInput, VideoWithRelations } from "../dtos/video.dto";
import { normalizeTags } from "../utils/tagNormalizer";

async function syncTags(transaction: Prisma.TransactionClient, videoId: number, tags?: string[]) {
  const tagNames = normalizeTags(tags);

  const existingLinks = await transaction.videoTag.findMany({
    where: { videoId },
    include: { tag: true }
  });

  const existingTagNames = new Set(existingLinks.map((link) => link.tag.name));

  const tagsToRemove = existingLinks.filter((link) => !tagNames.includes(link.tag.name));

  if (tagsToRemove.length) {
    await transaction.videoTag.deleteMany({
      where: {
        videoId,
        tagId: { in: tagsToRemove.map((link) => link.tagId) }
      }
    });
  }

  const tagsToAdd = tagNames.filter((name) => !existingTagNames.has(name));

  if (tagsToAdd.length) {
    const tagRecords: Tag[] = [];

    for (const name of tagsToAdd) {
      const tag = await transaction.tag.upsert({
        where: { name },
        create: { name },
        update: {}
      });

      tagRecords.push(tag);
    }

    if (tagRecords.length) {
      await transaction.videoTag.createMany({
        data: tagRecords.map((tag) => ({
          videoId,
          tagId: tag.id
        }))
      });
    }
  }
}

export async function createVideo(data: CreateVideoInput): Promise<VideoWithRelations> {
  const tagNames = normalizeTags(data.tags);
  return prisma.$transaction(async (tx) => {
    const video = await tx.video.create({
      data: {
        title: data.title,
        description: data.description,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        duration: data.duration,
        category: data.category,
        uploadDate: data.uploadDate ?? new Date(),
        uploaderName: data.uploaderName,
        fileSize: data.fileSize,
        resolution: data.resolution
      }
    });

    if (tagNames.length) {
      const tags: Tag[] = [];

      for (const name of tagNames) {
        const tag = await tx.tag.upsert({
          where: { name },
          create: { name },
          update: {}
        });
        tags.push(tag);
      }

      await tx.videoTag.createMany({
        data: tags.map((tag) => ({
          videoId: video.id,
          tagId: tag.id
        }))
      });
    }

    const created = await tx.video.findUniqueOrThrow({
      where: { id: video.id },
      include: { tags: { include: { tag: true } } }
    });

    return created;
  });
}

export async function updateVideo(id: number, data: UpdateVideoInput): Promise<VideoWithRelations> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.video.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        duration: data.duration,
        category: data.category,
        uploadDate: data.uploadDate,
        uploaderName: data.uploaderName,
        fileSize: data.fileSize,
        resolution: data.resolution
      }
    });

    if (data.tags) {
      await syncTags(tx, id, data.tags);
    }

    const refreshed = await tx.video.findUniqueOrThrow({
      where: { id: updated.id },
      include: { tags: { include: { tag: true } } }
    });

    return refreshed;
  });
}

export async function deleteVideo(id: number): Promise<void> {
  await prisma.video.delete({ where: { id } });
}

export async function getVideoById(id: number): Promise<VideoWithRelations | null> {
  return prisma.video.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } }
  });
}

export async function listVideos(options: ListVideosOptions): Promise<{ videos: VideoWithRelations[]; total: number }> {
  const { page, pageSize } = options;

  const [videos, total] = await prisma.$transaction([
    prisma.video.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { uploadDate: "desc" },
      include: { tags: { include: { tag: true } } }
    }),
    prisma.video.count()
  ]);

  return { videos, total };
}

export async function incrementViewCount(videoId: number): Promise<Video> {
  return prisma.video.update({
    where: { id: videoId },
    data: { viewCount: { increment: 1 } }
  });
}

export async function listDistinctCategories(): Promise<string[]> {
  const results = await prisma.video.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" }
  });

  return results.map((item) => item.category);
}
