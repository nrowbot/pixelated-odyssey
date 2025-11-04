import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Video, VideoSearchFilters, SearchSortOption, VideoSearchResult } from "../types/video";
import {
  fetchSearchSuggestions,
  getSavedSearches,
  getTrendingVideos,
  saveSearchCombination,
  searchVideosApi,
  SearchVideosParams,
  getVideoCategories,
  type SavedSearch
} from "../services/videoApi";

interface RecentSearch {
  query?: string;
  filters?: VideoSearchFilters;
  sort?: SearchSortOption;
  timestamp: number;
}

const sanitizeFilters = (filters: Partial<VideoSearchFilters>): VideoSearchFilters => {
  const result: VideoSearchFilters = {};

  if (filters.category) {
    result.category = filters.category;
  }

  if (filters.duration) {
    result.duration = filters.duration;
  }

  if (typeof filters.minDuration === "number" && Number.isFinite(filters.minDuration) && filters.minDuration >= 0) {
    result.minDuration = filters.minDuration;
  }

  if (typeof filters.maxDuration === "number" && Number.isFinite(filters.maxDuration) && filters.maxDuration >= 0) {
    result.maxDuration = filters.maxDuration;
  }

  if (filters.uploadDateFrom) {
    result.uploadDateFrom = filters.uploadDateFrom;
  }

  if (filters.uploadDateTo) {
    result.uploadDateTo = filters.uploadDateTo;
  }

  if (filters.resolution) {
    result.resolution = filters.resolution;
  }

  if (filters.tags) {
    const tags = filters.tags.filter(Boolean);
    if (tags.length) {
      result.tags = tags;
    }
  }

  return result;
};

interface SearchState {
  query: string;
  filters: VideoSearchFilters;
  sort: SearchSortOption;
  page: number;
  pageSize: number;
  results: VideoSearchResult[];
  total: number;
  tookMs: number;
  summary: string;
  trending: Video[];
  isLoading: boolean;
  suggestions: string[];
  popularTags: string[];
  categories: string[];
  recentSearches: RecentSearch[];
  savedSearches: SavedSearch[];
  viewMode: "grid" | "list";
  error?: string;
  search: (params?: Partial<SearchVideosParams>) => Promise<void>;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<VideoSearchFilters>) => void;
  clearFilters: () => void;
  setSort: (sort: SearchSortOption) => void;
  setPage: (page: number) => void;
  fetchTrending: () => Promise<void>;
  fetchSuggestions: (query: string) => Promise<void>;
  saveSearch: (name: string) => Promise<void>;
  loadSavedSearches: () => Promise<void>;
  applySavedSearch: (id: number) => Promise<void>;
  setViewMode: (mode: "grid" | "list") => void;
  loadCategories: () => Promise<void>;
}

const defaultFilters: VideoSearchFilters = {};

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      query: "",
      filters: defaultFilters,
      sort: "relevance",
      page: 1,
      pageSize: 12,
      results: [],
      total: 0,
      tookMs: 0,
      summary: "",
      trending: [],
      isLoading: false,
      suggestions: [],
      popularTags: [],
      recentSearches: [],
      savedSearches: [],
      viewMode: "grid",
      categories: [],
      error: undefined,
      search: async (params) => {
        const state = get();
        const query = params?.query ?? state.query;
        const sort = params?.sort ?? state.sort;
        const page = params?.page ?? state.page;
        const pageSize = params?.pageSize ?? state.pageSize;
        const within = params?.within;
        const nextFilters = params?.filters ? sanitizeFilters(params.filters) : state.filters;

        set({ isLoading: true, error: undefined });

        try {
          const response = await searchVideosApi({
            query,
            filters: nextFilters,
            sort,
            page,
            pageSize,
            within
          });

          const recent: RecentSearch = {
            query,
            filters: nextFilters,
            sort,
            timestamp: Date.now()
          };

          const updatedRecent = [recent, ...state.recentSearches.filter((item) => !(item.query === query && JSON.stringify(item.filters) === JSON.stringify(nextFilters)))]
            .slice(0, 5);

          set({
            query,
            filters: nextFilters,
            sort,
            page,
            pageSize,
            results: response.results,
            total: response.total,
            tookMs: response.tookMs,
            summary: response.summary,
            isLoading: false,
            recentSearches: updatedRecent
          });
        } catch (error) {
          console.error("Search failed", error);
          set({
            isLoading: false,
            error: "Search failed. Please try again.",
            results: [],
            total: 0,
            summary: "",
            tookMs: 0,
            filters: params?.filters ? nextFilters : state.filters
          });
        }
      },
      setQuery: (query) => set({ query }),
      setFilters: (filters) =>
        set((state) => ({
          filters: sanitizeFilters({ ...state.filters, ...filters })
        })),
      clearFilters: () => set({ filters: {} }),
      setSort: (sort) => set({ sort }),
      setPage: (page) => set({ page }),
      fetchTrending: async () => {
        try {
          const trending = await getTrendingVideos();
          set({ trending });
        } catch (error) {
          console.error("Failed to fetch trending videos", error);
        }
      },
      fetchSuggestions: async (query) => {
        if (!query) {
          set({ suggestions: [], popularTags: [] });
          return;
        }

        try {
          const { suggestions, tags } = await fetchSearchSuggestions(query);
          set({ suggestions, popularTags: tags });
        } catch (error) {
          console.error("Failed to fetch suggestions", error);
        }
      },
      saveSearch: async (name: string) => {
        const state = get();
        try {
          await saveSearchCombination(name, {
            query: state.query,
            filters: state.filters,
            sort: state.sort
          });
          await get().loadSavedSearches();
        } catch (error) {
          console.error("Failed to save search", error);
        }
      },
      loadSavedSearches: async () => {
        try {
          const saved = await getSavedSearches();
          set({ savedSearches: saved });
        } catch (error) {
          console.error("Failed to load saved searches", error);
        }
      },
      applySavedSearch: async (id: number) => {
        const state = get();
        const saved = state.savedSearches.find((item) => item.id === id);
        if (!saved) {
          return;
        }

        const filters = sanitizeFilters((saved.filters ?? {}) as VideoSearchFilters);
        set({
          query: saved.query ?? "",
          filters
        });
        await get().search({ page: 1 });
      },
      setViewMode: (mode) => set({ viewMode: mode }),
      loadCategories: async () => {
        try {
          const categories = await getVideoCategories();
          set({ categories });
        } catch (error) {
          console.error("Failed to load categories", error);
        }
      }
    }),
    {
      name: "search-store",
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        savedSearches: state.savedSearches,
        viewMode: state.viewMode
      })
    }
  )
);
