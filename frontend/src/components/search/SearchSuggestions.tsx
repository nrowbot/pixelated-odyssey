import { PopularTag } from "../../types/video";

interface SearchSuggestionsProps {
  suggestions: string[];
  suggestedTags: string[];
  popularTags: PopularTag[];
  onSelect: (value: string) => void;
}

export function SearchSuggestions({ suggestions, suggestedTags, popularTags, onSelect }: SearchSuggestionsProps) {
  const trendingTags = popularTags.slice(0, 12);

  return (
    <div className="search-suggestions">
      {suggestions.length > 0 && (
        <div>
          <div className="search-suggestions__header">Suggestions</div>
          <ul className="search-suggestions__list">
            {suggestions.map((item) => (
              <li key={item}>
                <button className="search-suggestions__item" onMouseDown={() => onSelect(item)}>
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {suggestedTags.length > 0 && (
        <div>
          <div className="search-suggestions__header">Matching tags</div>
          <div className="search-suggestions__tags">
            {suggestedTags.map((tag) => (
              <button key={tag} className="search-suggestions__tag" onMouseDown={() => onSelect(tag)}>
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
      {trendingTags.length > 0 && (
        <div>
          <div className="search-suggestions__header">Trending tags</div>
          <div className="search-suggestions__tags">
            {trendingTags.map((tag) => (
              <button key={tag.name} className="search-suggestions__tag" onMouseDown={() => onSelect(tag.name)}>
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
