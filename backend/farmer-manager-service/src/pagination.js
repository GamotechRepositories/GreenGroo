// Opt-in server pagination (same contract as legacy/utils/pagination.js): callers that omit `page`
// keep the legacy full-list response, because current panel/app screens compute totals from it.

const MAX_PAGE = 100000;

export const PAGE_LIMITS = {
  farmers: { defaultLimit: 25, maxLimit: 100 },
  products: { defaultLimit: 25, maxLimit: 100 },
  orders: { defaultLimit: 20, maxLimit: 100 },
  stockHistory: { defaultLimit: 50, maxLimit: 200 },
  // Each pickup row is enriched with farmer/driver/order/centre data, so keep pages smaller.
  pickups: { defaultLimit: 20, maxLimit: 50 },
};

export function isPaginationRequested(query = {}) {
  return query.page !== undefined && query.page !== null && String(query.page).trim() !== "";
}

export function getPageParams(query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.min(MAX_PAGE, Math.max(1, Number.parseInt(query.page, 10) || 1));
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginatedResponse(data, total, page, limit) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export function containsRegex(text) {
  return new RegExp(String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}
