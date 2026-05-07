export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const rawPageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

  return {
    page: Math.max(1, isNaN(rawPage) ? 1 : rawPage),
    pageSize: Math.min(100, Math.max(1, isNaN(rawPageSize) ? 20 : rawPageSize)),
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  { page, pageSize }: PaginationParams
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export function buildSearchWhere(search: string | null, fields: string[]): Record<string, unknown> {
  if (!search) return {};
  return {
    OR: fields.map((field) => ({ [field]: { contains: search } })),
  };
}
