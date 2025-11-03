import { useEffect } from "react";
import { useSearchStore } from "../../store/searchStore";

export function SavedSearches() {
  const { savedSearches, loadSavedSearches, applySavedSearch } = useSearchStore((state) => ({
    savedSearches: state.savedSearches,
    loadSavedSearches: state.loadSavedSearches,
    applySavedSearch: state.applySavedSearch
  }));

  useEffect(() => {
    void loadSavedSearches();
  }, [loadSavedSearches]);

  if (!savedSearches.length) {
    return null;
  }

  return (
    <div className="saved-searches">
      <h3>Saved searches</h3>
      <div className="saved-searches__list">
        {savedSearches.map((search) => (
          <button key={search.id} className="saved-searches__item" onClick={() => applySavedSearch(search.id)}>
            <strong>{search.name}</strong>
            <span>{search.query || "All videos"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
