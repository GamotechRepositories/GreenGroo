import { orderQrLabel, parseOrderQrPayload } from "../../utils/orderQr";

export default function OrderQrCode({ value, label = "Order QR", compact = false }) {
  const id = parseOrderQrPayload(value);
  const qrValue = id ? orderQrLabel(id) : String(value || "").trim();
  const caption = id ? orderQrLabel(id) : qrValue;
  const payload = encodeURIComponent(qrValue);
  const imgSize = compact
    ? "h-[6.5rem] w-[6.5rem] sm:h-36 sm:w-36"
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
        {caption || "—"}
      </p>
      <p className="text-center text-[10px] text-gray-400">Scan to verify this order</p>
    </div>
  );
}
