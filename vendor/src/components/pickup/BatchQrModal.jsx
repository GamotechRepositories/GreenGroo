import BatchQrCode from "./BatchQrCode";

export default function BatchQrModal({ batchId, onClose }) {
  if (!batchId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white p-4 sm:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-gray-900">Batch QR</p>
          <button type="button" className="min-h-9 px-2 text-xs font-semibold text-gray-500" onClick={onClose}>
            Close
          </button>
        </div>
        <BatchQrCode value={batchId} />
      </div>
    </div>
  );
}
