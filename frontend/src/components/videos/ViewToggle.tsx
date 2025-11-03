import { useSearchStore } from "../../store/searchStore";

export function ViewToggle() {
  const { viewMode, setViewMode } = useSearchStore((state) => ({
    viewMode: state.viewMode,
    setViewMode: state.setViewMode
  }));

  return (
    <div className="view-toggle">
      <button
        type="button"
        className={`view-toggle__button ${viewMode === "grid" ? "is-active" : ""}`}
        onClick={() => setViewMode("grid")}
      >
        Grid
      </button>
      <button
        type="button"
        className={`view-toggle__button ${viewMode === "list" ? "is-active" : ""}`}
        onClick={() => setViewMode("list")}
      >
        List
      </button>
    </div>
  );
}
