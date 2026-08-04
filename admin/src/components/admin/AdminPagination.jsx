export const ADMIN_PAGE_SIZE = 20;

function AdminPagination({ page, totalPages, total, onPageChange, loading = false }) {
  if (!total || totalPages <= 1) return null;

  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-600 sm:text-sm">
          Showing page {page} of {totalPages} · {total} total
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={loading || page <= 1}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 disabled:opacity-100"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={loading || page >= totalPages}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 disabled:opacity-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPagination;
