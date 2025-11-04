export interface Video {
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
  tags: string[];
}

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

export interface Highlight {
  title?: string[];
  description?: string[];
  uploaderName?: string[];
  tags?: string[];
}

export interface VideoSearchResult {
  video: Video;
  score: number;
  highlights: Highlight;
}

export interface PopularTag {
  name: string;
  count: number;
}

export interface CreateVideoInput {
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  category: string;
  tags?: string[];
  uploadDate?: string;
  uploaderName: string;
  fileSize: number;
  resolution: string;
}
