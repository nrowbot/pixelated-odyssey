import { prisma } from "../config/database";

type SearchHistoryCreateInput = Parameters<typeof prisma.searchHistory.create>[0]["data"];
type SearchMetricCreateInput = Parameters<typeof prisma.searchMetric.create>[0]["data"];
type SavedSearchCreateInput = Parameters<typeof prisma.savedSearch.create>[0]["data"];

export async function recordSearch(query: string, filters: Record<string, unknown>, resultCount: number, durationMs: number) {
  const historyData: SearchHistoryCreateInput = {
    query,
    filters: (filters ?? null) as SearchHistoryCreateInput["filters"]
  };

  const metricData: SearchMetricCreateInput = {
    query,
    durationMs,
    resultCount
  };

  await prisma.$transaction([
    prisma.searchHistory.create({
      data: historyData
    }),
    prisma.searchMetric.create({
      data: metricData
    })
  ]);
}

export async function getPopularSearches(limit: number) {
  return prisma.searchMetric.groupBy({
    by: ["query"],
    _count: { query: true },
    orderBy: {
      _count: {
        query: "desc"
      }
    },
    take: limit
  });
}

export async function saveSearch(name: string, query: string | undefined, filters: Record<string, unknown> | undefined) {
  const data: SavedSearchCreateInput = {
    name,
    query: query ?? "",
    filters: (filters ?? null) as SavedSearchCreateInput["filters"]
  };

  return prisma.savedSearch.create({
    data
  });
}

export async function listSavedSearches() {
  return prisma.savedSearch.findMany({
    orderBy: { updatedAt: "desc" }
  });
}

export async function getSavedSearchById(id: number) {
  return prisma.savedSearch.findUnique({
    where: { id }
  });
}
