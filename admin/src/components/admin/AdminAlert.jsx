function AdminAlert({ error, success, onClear }) {
  if (!error && !success) return null;

  return (
    <div className="mb-4 space-y-2">
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          {onClear && (
            <button type="button" onClick={onClear} className="shrink-0 font-bold">
              ×
            </button>
          )}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}
    </div>
  );
}

export default AdminAlert;
