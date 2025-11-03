import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  createVideo,
  updateVideo,
  removeVideo,
  fetchVideo,
  listVideos,
  registerView,
  fetchTrendingVideos,
  fetchRelatedVideos,
  fetchCategories
} from "../services/videoService";
import { normalizePagination } from "../utils/pagination";
import { searchVideos, getSearchSuggestions } from "../services/searchService";
import { SearchSortOption } from "../types/search";
import { saveSearch, listSavedSearches, getSavedSearchById } from "../repositories/searchRepository";
import { toVideoResponse, toVideoListResponse } from "../utils/videoMapper";
import { SearchSortOption } from "../types/search";

interface SearchQueryParams {
  q?: string;
  category?: string;
  duration?: "short" | "medium" | "long";
  minDuration?: number;
  maxDuration?: number;
  uploadDateFrom?: string;
  uploadDateTo?: string;
  resolution?: string;
  tags?: string | string[];
  sort?: SearchSortOption;
  page?: number;
  pageSize?: number;
  within?: string;
}

function parseTags(input?: string | string[]): string[] | undefined {
  if (!input) return undefined;
  if (Array.isArray(input)) {
    return input.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean);
  }
  return input.split(",").map((item) => item.trim()).filter(Boolean);
}

export const createVideoHandler = asyncHandler(async (req: Request, res: Response) => {
  const created = await createVideo({
    ...req.body,
    uploadDate: req.body.uploadDate ? new Date(req.body.uploadDate) : undefined
  });

  res.status(201).json(toVideoResponse(created));
});

export const listVideosHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = normalizePagination(req.query.page as string | number, req.query.pageSize as string | number);
  const { videos, total } = await listVideos({ page, pageSize });

  res.json({
    data: toVideoListResponse(videos),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
});

export const getVideoHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const video = await fetchVideo(id);
  res.json(toVideoResponse(video));
});

export const updateVideoHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updated = await updateVideo(id, {
    ...req.body,
    uploadDate: req.body.uploadDate ? new Date(req.body.uploadDate) : undefined
  });
  res.json(toVideoResponse(updated));
});

export const deleteVideoHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await removeVideo(id);
  res.status(204).send();
});

export const searchVideosHandler = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as SearchQueryParams;
  const tags = parseTags(query.tags);

  const allowedSorts: SearchSortOption[] = ["relevance", "uploadDate", "viewCount", "duration"];
  const sort = query.sort && allowedSorts.includes(query.sort) ? query.sort : undefined;

  const { page, pageSize } = normalizePagination(query.page, query.pageSize);

  const result = await searchVideos({
    query: query.q,
    filters: {
      category: query.category,
      duration: query.duration,
      minDuration: query.minDuration,
      maxDuration: query.maxDuration,
      uploadDateFrom: query.uploadDateFrom,
      uploadDateTo: query.uploadDateTo,
      resolution: query.resolution,
      tags
    },
    sort,
    page,
    pageSize,
    within: query.within
  });

  res.json({
    results: result.results.map((item) => ({
      video: toVideoResponse(item.video),
      score: item.score,
      highlights: item.highlights
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    tookMs: result.tookMs,
    summary: `Found ${result.total} results in ${(result.tookMs / 1000).toFixed(2)}s`
  });
});

export const searchSuggestionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const prefix = (req.query.q as string) ?? "";
  const suggestions = await getSearchSuggestions(prefix);
  res.json(suggestions);
});

export const listCategoriesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await fetchCategories();
  res.json({ categories });
});

export const registerViewHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updated = await registerView(id, req.ip, req.body?.sessionId);
  res.json({
    id: updated.id,
    viewCount: updated.viewCount
  });
});

export const trendingVideosHandler = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 12;
  const trending = await fetchTrendingVideos(limit);
  res.json(toVideoListResponse(trending));
});

export const relatedVideosHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const related = await fetchRelatedVideos(id);
  res.json(toVideoListResponse(related));
});

export const saveSearchHandler = asyncHandler(async (req: Request, res: Response) => {
  const saved = await saveSearch(req.body.name, req.body.query, req.body.filters);
  res.status(201).json(saved);
});

export const listSavedSearchesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const searches = await listSavedSearches();
  res.json(searches);
});

export const getSavedSearchHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const saved = await getSavedSearchById(id);
  if (!saved) {
    res.status(404).json({ error: "Saved search not found" });
    return;
  }
  res.json(saved);
});
