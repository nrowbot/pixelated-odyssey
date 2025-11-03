export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function normalizePagination(queryPage?: string | number, queryPageSize?: string | number): PaginationOptions {
  const pageInput = typeof queryPage === "number" ? queryPage : queryPage ? parseInt(queryPage, 10) : undefined;
  const pageSizeInput = typeof queryPageSize === "number" ? queryPageSize : queryPageSize ? parseInt(queryPageSize, 10) : undefined;

  const page = Math.max(1, Number.isFinite(pageInput) ? (pageInput as number) : 1);
  const rawPageSize = Number.isFinite(pageSizeInput) ? (pageSizeInput as number) : 12;
  const pageSize = Math.min(100, Math.max(1, rawPageSize));

  return { page, pageSize };
}
