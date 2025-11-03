export interface VideoSearchFilters {
  category?: string;
  duration?: "short" | "medium" | "long";
  minDuration?: number;
  maxDuration?: number;
  uploadDateFrom?: string;
  uploadDateTo?: string;
  resolution?: string;
  tags?: string[];
}

export type SearchSortOption = "relevance" | "uploadDate" | "viewCount" | "duration";

export interface SearchResultHighlight {
  title?: string[];
  description?: string[];
  tags?: string[];
  uploaderName?: string[];
}

export interface SearchResultItem {
  id: number;
  score: number;
  highlights: SearchResultHighlight;
}

export interface SearchResponse<T> {
  results: T[];
  total: number;
  page: number;
  pageSize: number;
  tookMs: number;
}
