import { VideoWithRelations } from "../dtos/video.dto";

export function toVideoResponse(video: VideoWithRelations) {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    url: video.url,
    thumbnailUrl: video.thumbnailUrl,
    duration: video.duration,
    category: video.category,
    uploadDate: video.uploadDate,
    uploaderName: video.uploaderName,
    viewCount: video.viewCount,
    fileSize: video.fileSize,
    resolution: video.resolution,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    tags: video.tags.map((tag) => tag.tag.name)
  };
}

export function toVideoListResponse(videos: VideoWithRelations[]) {
  return videos.map(toVideoResponse);
}
