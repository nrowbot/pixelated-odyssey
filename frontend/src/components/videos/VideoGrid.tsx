import { VideoSearchResult } from "../../types/video";
import { useSearchStore } from "../../store/searchStore";
import { VideoCard } from "./VideoCard";

interface VideoGridProps {
  results: VideoSearchResult[];
  viewMode: "grid" | "list";
}

export function VideoGrid({ results, viewMode }: VideoGridProps) {
  const { didYouMean, search } = useSearchStore((state) => ({
    didYouMean: state.didYouMean,
    search: state.search
  }));

  if (!results.length) {
    return (
      <div className="video-grid__empty">
        <h3>No results found</h3>
        <p>Try broadening your search or clearing filters.</p>
        {didYouMean && (
          <div className="video-grid__suggestion">
            Did you mean
            <button
              type="button"
              onClick={() => {
                void search({ query: didYouMean, page: 1 });
              }}
            >
              {didYouMean}
            </button>
            ?
          </div>
        )}
        <ul>
          <li>Remove some filters such as duration or resolution.</li>
          <li>Search by tag (e.g. <code>react</code>) or uploader name.</li>
          <li>Check your spelling or try related keywords.</li>
        </ul>
      </div>
    );
  }

  return (
    <div className={`video-grid video-grid--${viewMode}`}>
      {results.map((result) => (
        <VideoCard key={result.video.id} result={result} />
      ))}
    </div>
  );
}
