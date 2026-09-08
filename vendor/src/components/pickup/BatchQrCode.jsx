import { batchQrLabel, batchScanUrl, parseBatchQrPayload } from "../../utils/batchQr";

export default function BatchQrCode({ value, label = "Batch QR", compact = false }) {
  const id = parseBatchQrPayload(value);
  const qrValue = id ? batchScanUrl(id) : value || "";
  const caption = id ? batchQrLabel(id) : value;
  const payload = encodeURIComponent(qrValue);
  const imgSize = compact
    ? "h-[7.25rem] w-[7.25rem] sm:h-40 sm:w-40 lg:h-44 lg:w-44"
    : "h-40 w-40 sm:h-44 sm:w-44";

  return (
    <div className={`flex w-full flex-col items-center gap-1.5 border border-gray-200 bg-white ${compact ? "p-2 sm:p-3" : "p-3 sm:p-4"}`}>
      {qrValue ? (
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${payload}`}
          alt={label}
          className={`${imgSize} border border-gray-100 bg-white p-1`}
        />
      ) : (
        <div className={`flex ${imgSize} items-center justify-center bg-gray-50 text-[11px] text-gray-400`}>No QR</div>
      )}
      <p className="max-w-full break-all px-0.5 text-center font-mono text-[9px] font-semibold leading-tight text-gray-600 sm:text-[10px]">
        {caption}
      </p>
      <p className="hidden text-center text-[10px] text-gray-400 sm:block">Scan to view all batch details</p>
    </div>
  );
}
