import { FormEvent, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useSearchStore } from "../../store/searchStore";
import { SearchSuggestions } from "./SearchSuggestions";

export function SearchBar() {
  const { query, setQuery, search, fetchSuggestions, suggestions, popularTags } = useSearchStore((state) => ({
    query: state.query,
    setQuery: state.setQuery,
    search: state.search,
    fetchSuggestions: state.fetchSuggestions,
    suggestions: state.suggestions,
    popularTags: state.popularTags
  }));
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    void search({ query: value, page: 1 });
  }, 300);

  const debouncedSuggestions = useDebouncedCallback((value: string) => {
    void fetchSuggestions(value);
  }, 200);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void search({ query, page: 1 });
    setShowSuggestions(false);
  };

  const hasDropdown = useMemo(() => suggestions.length > 0 || popularTags.length > 0, [suggestions, popularTags]);

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-bar__form">
        <input
          className="search-bar__input"
          type="search"
          placeholder="Search videos, tags, creators..."
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            debouncedSearch(value);
            debouncedSuggestions(value);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        <button className="search-bar__submit" type="submit">
          Search
        </button>
      </form>
      {showSuggestions && hasDropdown && (
        <SearchSuggestions
          suggestions={suggestions}
          popularTags={popularTags}
          onSelect={(value) => {
            setQuery(value);
            void search({ query: value, page: 1 });
          }}
        />
      )}
    </div>
  );
}
