import "../src/config/env";
import { readFileSync } from "fs";
import path from "path";
import { prisma } from "../src/config/database";
import { indexVideo, initializeSearchInfrastructure } from "../src/services/searchService";

interface VideoSeed {
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  category: string;
  tags?: string[];
  uploadDate?: string;
  uploaderName: string;
  fileSize: number;
  resolution: string;
  viewCount?: number;
}

function ensureString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function ensureNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function loadSeedData(): VideoSeed[] {
  const dataPath = path.join(__dirname, "data", "seed-data.json");

  try {
    const raw = readFileSync(dataPath, "utf-8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new Error("Seed file must contain an array of videos");
    }

    return parsed.map((entry, index) => {
      const record = typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};

      const title = ensureString(record.title);
      const url = ensureString(record.url);
      const uploaderName = ensureString(record.uploaderName ?? record.uploader_name);

      if (!title || !url || !uploaderName) {
        throw new Error(`Missing required fields (title, url, uploaderName) for seed entry at index ${index}`);
      }

      const tagsRaw = record.tags;
      const tags = Array.isArray(tagsRaw)
        ? tagsRaw.map((tag) => ensureString(tag)).filter((tag): tag is string => Boolean(tag))
        : typeof tagsRaw === "string"
        ? tagsRaw.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];

      return {
        title,
        description: ensureString(record.description),
        url,
        thumbnailUrl: ensureString(record.thumbnailUrl ?? record.thumbnail_url),
        duration: ensureNumber(record.duration) ?? 0,
        category: ensureString(record.category) ?? "uncategorized",
        tags,
        uploadDate: ensureString(record.uploadDate ?? record.upload_date),
        uploaderName,
        fileSize: ensureNumber(record.fileSize ?? record.file_size) ?? 0,
        resolution: ensureString(record.resolution) ?? "unknown",
        viewCount: ensureNumber(record.viewCount ?? record.view_count) ?? 0
      } satisfies VideoSeed;
    });
  } catch (error) {
    console.error(`Failed to read seed data at ${dataPath}:`, error);
    throw error;
  }
}

async function main() {
  let searchReady = true;

  try {
    await initializeSearchInfrastructure();
  } catch (error) {
    searchReady = false;
    console.warn("Elasticsearch is unavailable; continuing without search indexing.", error);
  }

  const sampleVideos = loadSeedData();

  for (const video of sampleVideos) {
    const tags = Array.isArray(video.tags) ? video.tags : [];

    const created = await prisma.video.upsert({
      where: { url: video.url },
      update: {},
      create: {
        title: video.title,
        description: video.description,
        url: video.url,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        category: video.category,
        uploadDate: video.uploadDate ? new Date(video.uploadDate) : undefined,
        uploaderName: video.uploaderName,
        fileSize: video.fileSize,
        resolution: video.resolution,
        viewCount: video.viewCount ?? 0,
        tags: {
          create: tags.map((tag) => ({
            tag: {
              connectOrCreate: {
                where: { name: tag },
                create: { name: tag }
              }
            }
          }))
        }
      },
      include: { tags: { include: { tag: true } } }
    });

    if (searchReady) {
      try {
        await indexVideo(created);
      } catch (error) {
        searchReady = false;
        console.warn(`Failed to index video ${created.id} in Elasticsearch. Further indexing skipped.`, error);
      }
    }
  }

  console.log(`Database seeded with ${sampleVideos.length} videos from data/seed-data.json.`);

  if (!searchReady) {
    console.warn("Elasticsearch indexing was skipped. Start Elasticsearch and rerun npm run seed to populate the search index.");
  }
}

main()
  .catch((error) => {
    console.error("Failed to seed database", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
