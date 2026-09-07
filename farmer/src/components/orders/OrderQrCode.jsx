import { orderQrLabel, orderScanUrl, parseOrderQrPayload } from "../../utils/orderQr";

function OrderQrCode({ value, label = "Order QR" }) {
  const id = parseOrderQrPayload(value);
  const qrValue = id ? orderScanUrl(id) : value || "";
  const caption = id ? orderQrLabel(id) : value;
  const payload = encodeURIComponent(qrValue);

  return (
    <div className="flex flex-col items-center gap-2 border border-[#D4D4D4] bg-white p-3">
      {qrValue ? (
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${payload}`}
          alt={label}
          className="h-40 w-40 border border-[#E5E7EB] bg-white p-1"
        />
      ) : (
        <div className="flex h-40 w-40 items-center justify-center bg-[#F2F2F2] text-[11px] text-[#6B7280]">No QR</div>
      )}
      <p className="break-all text-center text-[10px] font-semibold text-[#6B7280]">{caption}</p>
      <p className="text-center text-[10px] text-[#9CA3AF]">Scan to view full order</p>
    </div>
  );
}

export default OrderQrCode;
