import { api } from "./api";
import { Video, VideoSearchFilters, SearchSortOption, VideoSearchResult, Highlight } from "../types/video";

export interface SearchVideosParams {
  query?: string;
  filters?: VideoSearchFilters;
  sort?: SearchSortOption;
  page?: number;
  pageSize?: number;
  within?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface VideoApiResponse {
  id: number;
  title: string;
  description?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  duration: number;
  category: string;
  uploadDate: string;
  uploaderName: string;
  viewCount: number;
  fileSize: number;
  resolution: string;
  tags?: string[];
}

interface SearchApiItem {
  video: VideoApiResponse;
  score: number;
  highlights: Highlight;
}

interface SearchApiResponse {
  results: SearchApiItem[];
  total: number;
  page: number;
  pageSize: number;
  tookMs: number;
  summary: string;
}

export interface SearchVideosResponse extends SearchApiResponse {
  results: VideoSearchResult[];
}

const toVideo = (raw: VideoApiResponse): Video => ({
  id: raw.id,
  title: raw.title,
  description: raw.description ?? undefined,
  url: raw.url,
  thumbnailUrl: raw.thumbnailUrl ?? undefined,
  duration: raw.duration,
  category: raw.category,
  uploadDate: raw.uploadDate,
  uploaderName: raw.uploaderName,
  viewCount: raw.viewCount,
  fileSize: raw.fileSize,
  resolution: raw.resolution,
  tags: raw.tags ?? []
});

export async function searchVideosApi(params: SearchVideosParams): Promise<SearchVideosResponse> {
  const response = await api.get<SearchApiResponse>("/videos/search", {
    params: {
      q: params.query,
      category: params.filters?.category,
      duration: params.filters?.duration,
      minDuration: params.filters?.minDuration,
      maxDuration: params.filters?.maxDuration,
      uploadDateFrom: params.filters?.uploadDateFrom,
      uploadDateTo: params.filters?.uploadDateTo,
      resolution: params.filters?.resolution,
      tags: params.filters?.tags?.join(","),
      sort: params.sort,
      page: params.page,
      pageSize: params.pageSize,
      within: params.within
    }
  });

  return {
    ...response.data,
    results: response.data.results.map((item) => ({
      video: toVideo(item.video),
      score: item.score,
      highlights: item.highlights
    }))
  };
}

export async function getTrendingVideos(limit = 12): Promise<Video[]> {
  const response = await api.get<VideoApiResponse[]>("/videos/trending", { params: { limit } });
  return response.data.map(toVideo);
}

export async function listVideos(page = 1, pageSize = 12): Promise<{ data: Video[]; pagination: PaginationMeta }> {
  const response = await api.get<{ data: VideoApiResponse[]; pagination: PaginationMeta }>("/videos", { params: { page, pageSize } });
  return {
    data: response.data.data.map(toVideo),
    pagination: response.data.pagination
  };
}

export async function getVideoById(id: number): Promise<Video> {
  const response = await api.get<VideoApiResponse>(`/videos/${id}`);
  return toVideo(response.data);
}

export async function getRelatedVideos(id: number): Promise<Video[]> {
  const response = await api.get<VideoApiResponse[]>(`/videos/${id}/related`);
  return response.data.map(toVideo);
}

export async function incrementViewCount(id: number, sessionId?: string) {
  await api.post(`/videos/${id}/view`, { sessionId });
}

export async function fetchSearchSuggestions(query: string): Promise<{ suggestions: string[]; tags: string[] }> {
  const response = await api.get<{ suggestions: string[]; tags: string[] }>("/videos/search/suggestions", { params: { q: query } });
  return response.data;
}

export async function saveSearchCombination(name: string, params: SearchVideosParams) {
  const response = await api.post("/videos/search/save", {
    name,
    query: params.query,
    filters: params.filters
  });
  return response.data;
}

export interface SavedSearch {
  id: number;
  name: string;
  query: string;
  filters: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export async function getSavedSearches(): Promise<SavedSearch[]> {
  const response = await api.get<SavedSearch[]>("/videos/search/saved");
  return response.data;
}

export async function getVideoCategories(): Promise<string[]> {
  const response = await api.get<{ categories: string[] }>("/videos/categories");
  return response.data.categories ?? [];
}
