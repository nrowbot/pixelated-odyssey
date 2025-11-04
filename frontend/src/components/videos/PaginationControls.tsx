import { useMemo } from "react";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [12, 24, 48, 100];

export function PaginationControls({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationControlsProps) {
  const { totalPages, hasMultiplePages, start, end } = useMemo(() => {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const showMultiple = pages > 1;
    const currentStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const currentEnd = Math.min(total, page * pageSize);

    return {
      totalPages: pages,
      hasMultiplePages: showMultiple,
      start: currentStart,
      end: currentEnd
    };
  }, [page, pageSize, total]);

  if (total === 0) {
    return (
      <div className="pagination">
        <div className="pagination__meta">No videos found</div>
        <div className="pagination__spacer" />
        <label className="pagination__pagesize">
          <span>Per page</span>
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  return (
    <div className="pagination">
      <div className="pagination__meta">
        Showing {start}–{end} of {total}
      </div>
      <div className="pagination__actions">
        <button type="button" className="pagination__button" onClick={() => onPageChange(1)} disabled={page === 1}>
          « First
        </button>
        <button type="button" className="pagination__button" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          ‹ Prev
        </button>
        <span className="pagination__status">
          Page {page} of {totalPages}
        </span>
        <button type="button" className="pagination__button" onClick={() => onPageChange(page + 1)} disabled={!hasMultiplePages || page >= totalPages}>
          Next ›
        </button>
        <button type="button" className="pagination__button" onClick={() => onPageChange(totalPages)} disabled={!hasMultiplePages || page >= totalPages}>
          Last »
        </button>
      </div>
      <label className="pagination__pagesize">
        <span>Per page</span>
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
