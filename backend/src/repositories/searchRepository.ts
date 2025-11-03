import { prisma } from "../config/database";

export async function recordSearch(query: string, filters: Record<string, unknown>, resultCount: number, durationMs: number) {
  await prisma.$transaction([
    prisma.searchHistory.create({
      data: {
        query,
        filters
      }
    }),
    prisma.searchMetric.create({
      data: {
        query,
        durationMs,
        resultCount
      }
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
  return prisma.savedSearch.create({
    data: {
      name,
      query: query ?? "",
      filters
    }
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
