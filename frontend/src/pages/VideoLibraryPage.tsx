import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SearchBar } from "../components/search/SearchBar";
import { FilterPanel } from "../components/filters/FilterPanel";
import { VideoGrid } from "../components/videos/VideoGrid";
import { ViewToggle } from "../components/videos/ViewToggle";
import { SearchSummary } from "../components/search/SearchSummary";
import { RecentSearches } from "../components/search/RecentSearches";
import { SavedSearches } from "../components/search/SavedSearches";
import { PaginationControls } from "../components/videos/PaginationControls";
import { useSearchStore } from "../store/searchStore";

export function VideoLibraryPage() {
  const { results, viewMode, isLoading, search, fetchTrending, trending, saveSearch, loadCategories, loadPopularTags, page, pageSize, total, setPage, setPageSize } = useSearchStore((state) => ({
    results: state.results,
    viewMode: state.viewMode,
    isLoading: state.isLoading,
    search: state.search,
    fetchTrending: state.fetchTrending,
    trending: state.trending,
    saveSearch: state.saveSearch,
    loadCategories: state.loadCategories,
    loadPopularTags: state.loadPopularTags,
    page: state.page,
    pageSize: state.pageSize,
    total: state.total,
    setPage: state.setPage,
    setPageSize: state.setPageSize
  }));

  useEffect(() => {
    void fetchTrending();
    void search({ page: 1 });
    void loadCategories();
    void loadPopularTags();
  }, [fetchTrending, search, loadCategories, loadPopularTags]);

  const handlePageChange = (nextPage: number) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const targetPage = Math.min(Math.max(nextPage, 1), totalPages);
    if (targetPage === page) {
      return;
    }
    setPage(targetPage);
    void search({ page: targetPage });
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    if (nextPageSize === pageSize) {
      return;
    }
    setPageSize(nextPageSize);
    setPage(1);
    void search({ page: 1, pageSize: nextPageSize });
  };

  return (
    <div className="layout">
      <header className="layout__header">
        <h1>Pixelated Odyssey Library</h1>
        <p>Search across tutorials, documentaries, and more with real-time results.</p>
        <SearchBar />
        <SearchSummary />
        <div className="layout__header-actions">
          <Link to="/upload" className="secondary-button secondary-button--inverted">
            Add video
          </Link>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              const name = window.prompt("Save current search as:");
              if (name) {
                void saveSearch(name);
              }
            }}
          >
            Save search
          </button>
          <ViewToggle />
        </div>
      </header>
      <main className="layout__content">
        <FilterPanel />
        <section className="layout__results">
          {!isLoading && (
            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
          {isLoading ? <div className="loading">Searching…</div> : <VideoGrid results={results} viewMode={viewMode} />}
          {!isLoading && total > 0 && (
            <PaginationControls
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </section>
        <aside className="layout__aside">
          <SavedSearches />
          <RecentSearches />
          {trending.length > 0 && (
            <div className="trending">
              <h3>Trending this week</h3>
              <ul>
                {trending.map((video) => (
                  <li key={video.id}>
                    <span>{video.title}</span>
                    <span className="trending__views">{video.viewCount.toLocaleString()} views</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
