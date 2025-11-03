export function normalizeTags(tags?: string[]): string[] {
  if (!tags) {
    return [];
  }

  const trimmed = tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  return Array.from(new Set(trimmed));
}
