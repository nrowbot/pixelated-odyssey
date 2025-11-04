const SQL_COMMENT_PATTERN = /(--|#).*/g;
const SQL_BLOCK_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g;

function stripDangerousPatterns(value: string): string {
  const withoutComments = value.replace(SQL_BLOCK_COMMENT_PATTERN, "").replace(SQL_COMMENT_PATTERN, "");
  const withoutSpecialChars = withoutComments.replace(/[;'"\\]/g, "");
  const withoutNulls = withoutSpecialChars.split("\u0000").join("");
  return withoutNulls.trim();
}

export function sanitizeSearchInput(value?: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = stripDangerousPatterns(value);
  return cleaned.length > 0 ? cleaned : undefined;
}

export function sanitizeStringArray(values?: string[] | null): string[] | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const sanitized = values
    .map((value) => sanitizeSearchInput(value))
    .filter((value): value is string => Boolean(value));

  return sanitized.length ? sanitized : undefined;
}
