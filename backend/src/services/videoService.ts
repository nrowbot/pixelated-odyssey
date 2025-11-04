import { CreateVideoInput, ListVideosOptions, UpdateVideoInput, VideoRecord } from "../dtos/video.dto";
import {
  createVideo as createVideoRecord,
  deleteVideo as deleteVideoRecord,
  getVideoById,
  listVideos as listVideoRecords,
  updateVideo as updateVideoRecord,
  incrementViewCount,
  listDistinctCategories
} from "../repositories/videoRepository";
import { recordView, getTrendingVideos } from "../repositories/videoViewRepository";
import { HttpError } from "../middleware/errorHandler";
import { indexVideo, removeVideoFromIndex, getRelatedVideos } from "./searchService";

export async function createVideo(input: CreateVideoInput) {
  const created = await createVideoRecord(input);
  await indexVideo(created);
  return created;
}

export async function updateVideo(id: number, input: UpdateVideoInput) {
  const existing = await getVideoById(id);
  if (!existing) {
    throw new HttpError(404, "Video not found");
  }

  const updated = await updateVideoRecord(id, input);
  await indexVideo(updated);
  return updated;
}

export async function removeVideo(id: number) {
  const existing = await getVideoById(id);
  if (!existing) {
    throw new HttpError(404, "Video not found");
  }

  await deleteVideoRecord(id);
  await removeVideoFromIndex(id);
}

export async function fetchVideo(id: number) {
  const video = await getVideoById(id);
  if (!video) {
    throw new HttpError(404, "Video not found");
  }
  return video;
}

export async function listVideos(options: ListVideosOptions) {
  return listVideoRecords(options);
}

export async function registerView(videoId: number, viewerIp?: string, sessionId?: string): Promise<VideoRecord> {
  const updated = await incrementViewCount(videoId);
  await recordView(videoId, viewerIp, sessionId);
  return updated;
}

export async function fetchTrendingVideos(limit = 12) {
  return getTrendingVideos(limit);
}

export async function fetchRelatedVideos(videoId: number) {
  const video = await getVideoById(videoId);
  if (!video) {
    throw new HttpError(404, "Video not found");
  }
  return getRelatedVideos(video);
}

export async function fetchCategories() {
  return listDistinctCategories();
}
