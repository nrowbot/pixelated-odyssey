import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchStore } from "../../store/searchStore";

const resolutions = ["4K", "1440p", "1080p", "720p", "480p"];

export function FilterPanel() {
  const { filters, setFilters, clearFilters, search, popularTags, categories, loadPopularTags } = useSearchStore((state) => ({
    filters: state.filters,
    setFilters: state.setFilters,
    clearFilters: state.clearFilters,
    search: state.search,
    popularTags: state.popularTags,
    categories: state.categories,
    loadPopularTags: state.loadPopularTags
  }));
  const [expanded, setExpanded] = useState(true);

  const handleFiltersChanged = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void search({ page: 1 });
  };

  useEffect(() => {
    if (popularTags.length === 0) {
      void loadPopularTags();
    }
  }, [popularTags.length, loadPopularTags]);

  const sortedTags = useMemo(() => {
    if (!popularTags.length) {
      return [];
    }
    return [...popularTags].sort((a, b) => b.count - a.count);
  }, [popularTags]);

  const { minCount, maxCount } = useMemo(() => {
    if (!sortedTags.length) {
      return { minCount: 0, maxCount: 0 };
    }
    const counts = sortedTags.map((item) => item.count);
    return {
      minCount: Math.min(...counts),
      maxCount: Math.max(...counts)
    };
  }, [sortedTags]);

  const normalizeSize = (count: number) => {
    if (maxCount === minCount) {
      return 1;
    }
    const ratio = (count - minCount) / (maxCount - minCount);
    return 0.9 + ratio * 0.8;
  };

  return (
    <aside className={`filter-panel ${expanded ? "filter-panel--expanded" : ""}`}>
      <div className="filter-panel__header">
        <h2>Filters</h2>
        <div className="filter-panel__actions">
          <button type="button" className="tag-pill" onClick={() => clearFilters()}>
            Clear all
          </button> &nbsp;
          <button type="button" className="link-button" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {expanded && (
        <form className="filter-panel__form" onSubmit={handleFiltersChanged}>
          <label className="filter-panel__group">
            <span>Category</span>
            <select
              value={filters.category ?? ""}
              onChange={(event) => {
                const value = event.target.value || undefined;
                setFilters({ category: value });
                void search({ page: 1 });
              }}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="filter-panel__group">
            <legend>Duration</legend>
            <div className="filter-panel__options">
              <label>
                <input
                  type="radio"
                  name="duration"
                  value=""
                  checked={!filters.duration}
                  onChange={() => setFilters({ duration: undefined })}
                />
                Any
              </label>
              <label>
                <input
                  type="radio"
                  name="duration"
                  value="short"
                  checked={filters.duration === "short"}
                  onChange={() => setFilters({ duration: "short" })}
                />
                &lt; 5 min
              </label>
              <label>
                <input
                  type="radio"
                  name="duration"
                  value="medium"
                  checked={filters.duration === "medium"}
                  onChange={() => setFilters({ duration: "medium" })}
                />
                5-20 min
              </label>
              <label>
                <input
                  type="radio"
                  name="duration"
                  value="long"
                  checked={filters.duration === "long"}
                  onChange={() => setFilters({ duration: "long" })}
                />
                &gt; 20 min
              </label>
            </div>
          </fieldset>

          <label className="filter-panel__group">
            <span>Upload date from</span>
            <input
              type="date"
              value={filters.uploadDateFrom ?? ""}
              onChange={(event) => setFilters({ uploadDateFrom: event.target.value || undefined })}
            />
          </label>

          <label className="filter-panel__group">
            <span>Upload date to</span>
            <input
              type="date"
              value={filters.uploadDateTo ?? ""}
              onChange={(event) => setFilters({ uploadDateTo: event.target.value || undefined })}
            />
          </label>

          <label className="filter-panel__group">
            <span>Resolution</span>
            <select
              value={filters.resolution ?? ""}
              onChange={(event) => setFilters({ resolution: event.target.value || undefined })}
            >
              <option value="">All resolutions</option>
              {resolutions.map((resolution) => (
                <option key={resolution} value={resolution}>
                  {resolution}
                </option>
              ))}
            </select>
          </label>

          {popularTags.length > 0 && (
            <div className="filter-panel__group">
              <span>Popular tags</span>
              <div className="tag-cloud" aria-label="Popular tags">
                {sortedTags.map((tag) => {
                  const isActive = filters.tags?.includes(tag.name) ?? false;
                  const fontSize = normalizeSize(tag.count);
                  return (
                    <button
                      key={tag.name}
                      type="button"
                      className={`tag-cloud__tag ${isActive ? "tag-cloud__tag--active" : ""}`}
                      onClick={() => {
                        const current = new Set(filters.tags ?? []);
                        if (current.has(tag.name)) {
                          current.delete(tag.name);
                        } else {
                          current.add(tag.name);
                        }
                        const nextTags = Array.from(current);
                        setFilters({ tags: nextTags });
                        void search({ page: 1 });
                      }}
                      style={{ fontSize: `${fontSize}rem` }}
                      title={`${tag.name} (${tag.count} videos)`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button type="submit" className="primary-button">
            Apply filters
          </button>
        </form>
      )}
    </aside>
  );
}
