export const DEFAULT_PAGE_SIZE = 20;

export function getPaginationParams(query, defaultLimit = DEFAULT_PAGE_SIZE) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginatedResponse(data, total, page, limit) {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
