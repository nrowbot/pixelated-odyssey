import crypto from "crypto";

function normalizeValue(value: unknown): unknown | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    return value === "" ? undefined : value;
  }

  if (Array.isArray(value)) {
    const normalizedArray = value.map(normalizeValue).filter((item) => item !== undefined);
    return normalizedArray.length ? normalizedArray : undefined;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, entryValue]) => [key, normalizeValue(entryValue)] as const)
      .filter(([, normalizedEntry]) => normalizedEntry !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));

    if (!entries.length) {
      return undefined;
    }

    return entries.reduce<Record<string, unknown>>((acc, [key, normalizedEntry]) => {
      acc[key] = normalizedEntry;
      return acc;
    }, {});
  }

  return value;
}

export function buildSearchCacheKey(path: string, query: Record<string, unknown>): string {
  const normalizedQueryEntries = Object.entries(query)
    .map(([key, value]) => [key, normalizeValue(value)] as const)
    .filter(([, normalizedValue]) => normalizedValue !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));

  const normalizedQuery = normalizedQueryEntries.reduce<Record<string, unknown>>((acc, [key, normalizedValue]) => {
    acc[key] = normalizedValue;
    return acc;
  }, {});

  const serialized = JSON.stringify(normalizedQuery);
  const hash = crypto.createHash("sha1").update(`${path}?${serialized}`).digest("hex");

  return `search:${hash}`;
}
