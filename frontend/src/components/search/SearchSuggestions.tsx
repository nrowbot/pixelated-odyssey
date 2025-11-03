interface SearchSuggestionsProps {
  suggestions: string[];
  popularTags: string[];
  onSelect: (value: string) => void;
}

export function SearchSuggestions({ suggestions, popularTags, onSelect }: SearchSuggestionsProps) {
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
      {popularTags.length > 0 && (
        <div>
          <div className="search-suggestions__header">Popular tags</div>
          <div className="search-suggestions__tags">
            {popularTags.map((tag) => (
              <button key={tag} className="search-suggestions__tag" onMouseDown={() => onSelect(tag)}>
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
