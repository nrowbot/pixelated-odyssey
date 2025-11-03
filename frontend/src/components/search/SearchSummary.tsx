import { useSearchStore } from "../../store/searchStore";

export function SearchSummary() {
  const { summary, total, tookMs, query } = useSearchStore((state) => ({
    summary: state.summary,
    total: state.total,
    tookMs: state.tookMs,
    query: state.query
  }));

  if (!total && !query) {
    return null;
  }

  return (
    <div className="search-summary">
      <strong>{summary}</strong>
      {query && <span className="search-summary__query">for “{query}”</span>}
      <span className="search-summary__meta">({total} results · {(tookMs / 1000).toFixed(2)}s)</span>
    </div>
  );
}
