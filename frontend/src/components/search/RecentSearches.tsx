import { formatDistanceToNow } from "date-fns";
import { useSearchStore } from "../../store/searchStore";

export function RecentSearches() {
  const { recentSearches, search } = useSearchStore((state) => ({
    recentSearches: state.recentSearches,
    search: state.search
  }));

  if (!recentSearches.length) {
    return null;
  }

  return (
    <div className="recent-searches">
      <h3>Recent searches</h3>
      <ul>
        {recentSearches.map((item) => (
          <li key={`${item.query}-${item.timestamp}`}>
            <button
              className="link-button"
              onClick={() =>
                search({
                  query: item.query,
                  filters: item.filters,
                  sort: item.sort,
                  page: 1
                })
              }
            >
              {item.query || "All videos"} · {formatDistanceToNow(item.timestamp, { addSuffix: true })}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
