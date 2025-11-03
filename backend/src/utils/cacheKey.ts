import crypto from "crypto";

export function buildSearchCacheKey(path: string, query: Record<string, unknown>): string {
  const sortedEntries = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));

  const serialized = new URLSearchParams(sortedEntries as [string, string][]).toString();
  const hash = crypto.createHash("sha1").update(`${path}?${serialized}`).digest("hex");

  return `search:${hash}`;
}
