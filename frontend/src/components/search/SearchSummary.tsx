import { useSearchStore } from "../../store/searchStore";
import { buildCsv, buildM3u, triggerDownload } from "../../utils/export";

export function SearchSummary() {
  const { summary, total, tookMs, query, results } = useSearchStore((state) => ({
    summary: state.summary,
    total: state.total,
    tookMs: state.tookMs,
    query: state.query,
    results: state.results
  }));

  if (!total && !query) {
    return null;
  }

  const hasExportableResults = results.length > 0;

  const sanitizedQuery = query ? query.replace(/\s+/g, "-").replace(/[^a-z0-9-]/gi, "").toLowerCase() : "pixelated-odyssey";
  const timestamp = new Date().toISOString().split("T")[0];
  const baseFilename = `${sanitizedQuery || "pixelated-odyssey"}-${timestamp}`;

  const handleExportCsv = () => {
    const csv = buildCsv(results);
    const filename = `${baseFilename}.csv`;
    triggerDownload(csv, filename, "text/csv;charset=utf-8;");
  };

  const handleExportPlaylist = () => {
    const m3u = buildM3u(results);
    const filename = `${baseFilename}.m3u`;
    triggerDownload(m3u, filename, "audio/x-mpegurl");
  };

  return (
    <div className="search-summary">
      <div className="search-summary__details">
        <strong>{summary}</strong>
        {query && <span className="search-summary__query">for “{query}”</span>}
        <span className="search-summary__meta">({total} results · {(tookMs / 1000).toFixed(2)}s)</span>
      </div>
      {hasExportableResults && (
        <div className="search-summary__actions">
          <button type="button" className="chip-button" onClick={handleExportCsv}>
            Export CSV
          </button>
          <button type="button" className="chip-button" onClick={handleExportPlaylist}>
            Export playlist
          </button>
        </div>
      )}
    </div>
  );
}
