import { FormEvent, useState } from "react";
import { useSearchStore } from "../../store/searchStore";

const resolutions = ["4K", "1440p", "1080p", "720p", "480p"];

export function FilterPanel() {
  const { filters, setFilters, clearFilters, search, popularTags, categories } = useSearchStore((state) => ({
    filters: state.filters,
    setFilters: state.setFilters,
    clearFilters: state.clearFilters,
    search: state.search,
    popularTags: state.popularTags,
    categories: state.categories
  }));
  const [expanded, setExpanded] = useState(true);

  const handleFiltersChanged = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void search({ filters, page: 1 });
  };

  return (
    <aside className={`filter-panel ${expanded ? "filter-panel--expanded" : ""}`}>
      <div className="filter-panel__header">
        <h2>Filters</h2>
        <div className="filter-panel__actions">
          <button
            type="button"
            className="link-button"
            onClick={() => {
              clearFilters();
              void search({ filters: {}, page: 1 });
            }}
          >
            Clear all
          </button>
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
                void search({ filters: { category: value }, page: 1 });
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
              <div className="filter-panel__tags">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-pill ${filters.tags?.includes(tag) ? "tag-pill--active" : ""}`}
                    onClick={() => {
                      const current = new Set(filters.tags ?? []);
                      if (current.has(tag)) {
                        current.delete(tag);
                      } else {
                        current.add(tag);
                      }
                      const nextTags = Array.from(current);
                      setFilters({ tags: nextTags });
                      void search({ filters: { ...filters, tags: nextTags }, page: 1 });
                    }}
                  >
                    #{tag}
                  </button>
                ))}
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
