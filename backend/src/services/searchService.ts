import { performance } from "perf_hooks";
import type { estypes } from "@elastic/elasticsearch";
import { Prisma } from "@prisma/client";
import { elasticClient, videoIndexName } from "../config/elasticsearch";
import { redisClient } from "../config/redis";
import { prisma } from "../config/database";
import { VideoWithRelations } from "../dtos/video.dto";
import { buildSearchCacheKey } from "../utils/cacheKey";
import { resolveDurationRange } from "../utils/durationFilter";
import { VideoSearchFilters, SearchResponse, SearchResultItem, SearchResultHighlight, SearchSortOption } from "../types/search";
import { recordSearch, getPopularSearches } from "../repositories/searchRepository";

interface SearchVideosParams {
  query?: string;
  filters?: VideoSearchFilters;
  sort?: SearchSortOption;
  page?: number;
  pageSize?: number;
  within?: string;
  savedSearchFilters?: Record<string, unknown> | null;
}

interface IndexVideoPayload {
  id: number;
  title: string;
  description?: string | null;
  uploaderName: string;
  viewCount: number;
  category: string;
  duration: number;
  uploadDate: string;
  resolution: string;
  tags: string[];
}

async function ensureIndex() {
  const exists = await elasticClient.indices.exists({ index: videoIndexName });
  if (!exists) {
    await elasticClient.indices.create({
      index: videoIndexName,
      settings: {
        analysis: {
          filter: {
            autocomplete_filter: {
              type: "edge_ngram",
              min_gram: 2,
              max_gram: 20
            }
          },
          analyzer: {
            autocomplete_analyzer: {
              type: "custom",
              tokenizer: "standard",
              filter: ["lowercase", "autocomplete_filter"]
            }
          }
        }
      },
      mappings: {
        properties: {
          id: { type: "integer" },
          title: {
            type: "text",
            analyzer: "standard",
            fields: {
              autocomplete: {
                type: "text",
                analyzer: "autocomplete_analyzer",
                search_analyzer: "standard"
              }
            }
          },
          description: { type: "text", analyzer: "standard" },
          uploaderName: {
            type: "text",
            analyzer: "standard",
            fields: {
              autocomplete: {
                type: "text",
                analyzer: "autocomplete_analyzer",
                search_analyzer: "standard"
              }
            }
          },
          category: { type: "keyword" },
          duration: { type: "integer" },
          uploadDate: { type: "date" },
          resolution: { type: "keyword" },
          tags: {
            type: "keyword",
            fields: {
              autocomplete: {
                type: "text",
                analyzer: "autocomplete_analyzer",
                search_analyzer: "standard"
              }
            }
          },
          viewCount: { type: "integer" }
        }
      }
    });
  }
}

export async function initializeSearchInfrastructure() {
  await ensureIndex();
}

export async function indexVideo(video: VideoWithRelations) {
  await ensureIndex();

  const payload: IndexVideoPayload = {
    id: video.id,
    title: video.title,
    description: video.description ?? "",
    uploaderName: video.uploaderName,
    viewCount: video.viewCount,
    category: video.category,
    duration: video.duration,
    uploadDate: video.uploadDate.toISOString(),
    resolution: video.resolution,
    tags: video.tags.map((link) => link.tag.name)
  };

  await elasticClient.index({
    index: videoIndexName,
    id: video.id.toString(),
    document: payload,
    refresh: "wait_for"
  });
}

export async function removeVideoFromIndex(id: number) {
  const exists = await elasticClient.exists({
    index: videoIndexName,
    id: id.toString()
  });

  if (!exists) {
    return;
  }

  await elasticClient.delete({
    index: videoIndexName,
    id: id.toString(),
    refresh: "wait_for"
  });
}

function buildFilterClauses(filters?: VideoSearchFilters): estypes.QueryDslQueryContainer[] {
  if (!filters) {
    return [];
  }

  const clauses: estypes.QueryDslQueryContainer[] = [];

  if (filters.category) {
    clauses.push({ term: { category: filters.category } });
  }

  if (filters.resolution) {
    clauses.push({ term: { resolution: filters.resolution } });
  }

  if (filters.tags?.length) {
    clauses.push({ terms: { tags: filters.tags } });
  }

  const range = resolveDurationRange(filters.duration);

  if (typeof range.min === "number" || typeof range.max === "number") {
    const durationRange: { gte?: number; lt?: number } = {};
    if (typeof range.min === "number") {
      durationRange.gte = range.min;
    }
    if (typeof range.max === "number") {
      durationRange.lt = range.max;
    }
    clauses.push({ range: { duration: durationRange } });
  }

  if (filters.minDuration) {
    clauses.push({ range: { duration: { gte: filters.minDuration } } });
  }

  if (filters.maxDuration) {
    clauses.push({ range: { duration: { lte: filters.maxDuration } } });
  }

  if (filters.uploadDateFrom || filters.uploadDateTo) {
    clauses.push({
      range: {
        uploadDate: {
          gte: filters.uploadDateFrom,
          lte: filters.uploadDateTo
        }
      }
    });
  }

  return clauses;
}

function normalizeSort(sort?: SearchSortOption) {
  switch (sort) {
    case "uploadDate":
      return [{ uploadDate: { order: "desc" } }];
    case "viewCount":
      return [{ viewCount: { order: "desc" } }];
    case "duration":
      return [{ duration: { order: "asc" } }];
    default:
      return ["_score"];
  }
}

function extractHighlights(hit: estypes.SearchHit<IndexVideoPayload>): SearchResultHighlight {
  const highlight = (hit.highlight ?? {}) as Record<string, string[]>;
  return {
    title: highlight["title"],
    description: highlight["description"],
    uploaderName: highlight["uploaderName"],
    tags: highlight["tags"]
  };
}

async function fetchVideosByIds(ids: number[]): Promise<VideoWithRelations[]> {
  if (!ids.length) {
    return [];
  }

  const videos = await prisma.video.findMany({
    where: { id: { in: ids } },
    include: { tags: { include: { tag: true } } }
  });

  const videoMap = new Map<number, VideoWithRelations>();
  videos.forEach((video) => videoMap.set(video.id, video));
  return ids.map((id) => videoMap.get(id)).filter(Boolean) as VideoWithRelations[];
}

function hydrateResults(
  videos: VideoWithRelations[],
  hits: SearchResultItem[]
): Array<{ video: VideoWithRelations; score: number; highlights: SearchResultHighlight }> {
  const result: Array<{ video: VideoWithRelations; score: number; highlights: SearchResultHighlight }> = [];

  for (const hit of hits) {
    const video = videos.find((item) => item.id === hit.id);
    if (video) {
      result.push({
        video,
        score: hit.score,
        highlights: hit.highlights
      });
    }
  }

  return result;
}

async function fallbackSearch(params: SearchVideosParams): Promise<SearchResponse<VideoWithRelations>> {
  const { query, filters, page = 1, pageSize = 12 } = params;

  const where: Prisma.VideoWhereInput = {};

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { uploaderName: { contains: query, mode: "insensitive" } },
      {
        tags: {
          some: {
            tag: {
              name: { contains: query, mode: "insensitive" }
            }
          }
        }
      }
    ];
  }

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.resolution) {
    where.resolution = filters.resolution;
  }

  if (filters?.tags?.length) {
    where.tags = {
      some: {
        tag: {
          name: {
            in: filters.tags
          }
        }
      }
    };
  }

  const range = resolveDurationRange(filters?.duration);

  if (typeof range.min === "number" || typeof range.max === "number" || filters?.minDuration || filters?.maxDuration) {
    const durationFilter: Prisma.IntFilter = {};
    if (typeof range.min === "number") {
      durationFilter.gte = range.min;
    }
    if (typeof range.max === "number") {
      durationFilter.lte = range.max;
    }
    if (filters?.minDuration) {
      durationFilter.gte = durationFilter.gte !== undefined ? Math.max(durationFilter.gte, filters.minDuration) : filters.minDuration;
    }
    if (filters?.maxDuration) {
      durationFilter.lte = durationFilter.lte !== undefined ? Math.min(durationFilter.lte, filters.maxDuration) : filters.maxDuration;
    }
    where.duration = durationFilter;
  }

  if (filters?.uploadDateFrom || filters?.uploadDateTo) {
    const uploadDateFilter: Prisma.DateTimeFilter = {};
    if (filters?.uploadDateFrom) {
      uploadDateFilter.gte = new Date(filters.uploadDateFrom);
    }
    if (filters?.uploadDateTo) {
      uploadDateFilter.lte = new Date(filters.uploadDateTo);
    }
    where.uploadDate = uploadDateFilter;
  }

  const [videos, total] = await prisma.$transaction([
    prisma.video.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { tags: { include: { tag: true } } },
      orderBy: { uploadDate: "desc" }
    }),
    prisma.video.count({ where })
  ]);

  return {
    results: videos,
    total,
    page,
    pageSize,
    tookMs: 0
  };
}

export async function searchVideos(params: SearchVideosParams): Promise<SearchResponse<{ video: VideoWithRelations; score: number; highlights: SearchResultHighlight }>> {
  const { query, filters, sort, page = 1, pageSize = 12, within } = params;
  const cacheKey = buildSearchCacheKey("/api/videos/search", {
    query,
    filters,
    sort,
    page,
    pageSize,
    within
  });

  try {
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as SearchResponse<{ video: VideoWithRelations; score: number; highlights: SearchResultHighlight }>;
      }
    }
  } catch (cacheErr) {
    console.warn("Redis cache read error", cacheErr);
  }

  const start = performance.now();

  try {
    await ensureIndex();

    const shouldSearch = Boolean(query || within);
    const mustQueries: estypes.QueryDslQueryContainer[] = [];

    if (query) {
      mustQueries.push({
        multi_match: {
          query,
          fields: ["title^3", "description^2", "tags^2", "uploaderName"],
          fuzziness: "AUTO",
          operator: "and"
        }
      });
    }

    if (within) {
      mustQueries.push({
        multi_match: {
          query: within,
          fields: ["title^2", "description", "tags^1.5"],
          fuzziness: "AUTO"
        }
      });
    }

    const filterClauses = buildFilterClauses(filters);
    const defaultMust: estypes.QueryDslQueryContainer[] = shouldSearch ? mustQueries : [{ match_all: {} as estypes.QueryDslMatchAllQuery }];

    const esQuery: estypes.QueryDslQueryContainer = {
      bool: {
        must: defaultMust,
        filter: filterClauses
      }
    };

    const response = await elasticClient.search({
      index: videoIndexName,
      from: (page - 1) * pageSize,
      size: pageSize,
      query: esQuery,
      sort: normalizeSort(sort),
      highlight: {
        pre_tags: ["<mark>"],
        post_tags: ["</mark>"],
        fields: {
          title: {},
          description: {},
          uploaderName: {},
          tags: {}
        }
      }
    });

    const tookMs = response.took ?? Math.round(performance.now() - start);
    const hits = response.hits.hits as Array<estypes.SearchHit<IndexVideoPayload>>;

    const searchResults: SearchResultItem[] = hits.map((hit) => ({
      id: Number(hit._source?.id ?? hit._id),
      score: hit._score ?? 0,
      highlights: extractHighlights(hit)
    }));

    const videoIds = searchResults.map((item) => item.id);
    const videos = await fetchVideosByIds(videoIds);
    const hydrated = hydrateResults(videos, searchResults);

    const result: SearchResponse<{ video: VideoWithRelations; score: number; highlights: SearchResultHighlight }> = {
      results: hydrated,
      total: typeof response.hits.total === "number" ? response.hits.total : response.hits.total?.value ?? hydrated.length,
      page,
      pageSize,
      tookMs
    };

    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, 120, JSON.stringify(result));
      }
    } catch (cacheErr) {
      console.warn("Redis cache write error", cacheErr);
    }

    await recordSearch(
      query ?? "",
      {
        filters,
        sort,
        within
      },
      result.total,
      tookMs
    );

    return result;
  } catch (error) {
    console.warn("Elasticsearch search failed, falling back to Prisma", error);
    const fallback = await fallbackSearch(params);
    const tookMs = Math.round(performance.now() - start);
    await recordSearch(
      query ?? "",
      {
        filters,
        sort,
        within,
        fallback: true
      },
      fallback.total,
      tookMs
    );

    const resultWithMetadata: SearchResponse<{ video: VideoWithRelations; score: number; highlights: SearchResultHighlight }> = {
      ...fallback,
      results: fallback.results.map((video) => ({
        video,
        score: 1,
        highlights: {}
      })),
      tookMs
    };

    return resultWithMetadata;
  }
}

export async function getSearchSuggestions(prefix: string) {
  await ensureIndex();

  const response = await elasticClient.search({
    index: videoIndexName,
    size: 0,
    query: {
      multi_match: {
        query: prefix,
        type: "bool_prefix",
        fields: ["title.autocomplete^3", "tags.autocomplete^2", "uploaderName.autocomplete"]
      }
    },
    aggs: {
      popular_tags: {
        terms: {
          field: "tags",
          size: 10
        }
      }
    }
  });

  const popularSearches = await getPopularSearches(5);

  type TermsAggregation = estypes.AggregationsMultiBucketAggregateBase<estypes.AggregationsStringTermsBucketKeys>;
  const tagsAggregation = response.aggregations?.popular_tags as TermsAggregation | undefined;
  const tagBuckets: estypes.AggregationsStringTermsBucketKeys[] = Array.isArray(tagsAggregation?.buckets)
    ? (tagsAggregation?.buckets as estypes.AggregationsStringTermsBucketKeys[])
    : [];

  return {
    suggestions: popularSearches.map((item) => item.query),
    tags: tagBuckets.map((bucket) => String(bucket.key))
  };
}

export async function getRelatedVideos(video: VideoWithRelations, limit = 6) {
  await ensureIndex();

  const response = await elasticClient.search({
    index: videoIndexName,
    size: limit,
    query: {
      more_like_this: {
        fields: ["title", "description", "tags"],
        like: [
          {
            _id: video.id.toString()
          }
        ],
        min_term_freq: 1,
        max_query_terms: 12
      }
    }
  });

  const ids = (response.hits.hits as Array<estypes.SearchHit<IndexVideoPayload>>)
    .map((hit) => Number(hit._id))
    .filter((id) => id !== video.id);
  const related = await fetchVideosByIds(ids);
  const sourceTags = new Set(video.tags.map((tag) => tag.tag.name));

  return related
    .filter((item) => {
      if (item.id === video.id) {
        return false;
      }

      const candidateTags = item.tags.map((tag) => tag.tag.name);
      const sharesTags = candidateTags.some((tag) => sourceTags.has(tag));
      const sameCategory = item.category === video.category;

      return sharesTags || sameCategory;
    })
    .slice(0, limit);
}
