import { orderQrEncodeValue, orderQrFacts, orderQrLabel } from "../../utils/orderQr";

function OrderQrCode({ value, record, label = "Order QR" }) {
  const qrValue = orderQrEncodeValue(value, record);
  const caption = orderQrLabel(qrValue || value);
  const facts = orderQrFacts(record || qrValue);
  const payload = encodeURIComponent(qrValue);

  return (
    <div className="flex flex-col items-center gap-2 border border-[#D4D4D4] bg-white p-3">
      {qrValue ? (
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&ecc=M&data=${payload}`}
          alt={label}
          className="h-40 w-40 border border-[#E5E7EB] bg-white p-1"
        />
      ) : (
        <div className="flex h-40 w-40 items-center justify-center bg-[#F2F2F2] text-[11px] text-[#6B7280]">No QR</div>
      )}
      <p className="break-all text-center text-[10px] font-semibold text-[#6B7280]">{caption}</p>
      {facts ? <p className="text-center text-[10px] leading-snug text-[#6B7280]">{facts}</p> : null}
      <p className="text-center text-[10px] text-[#9CA3AF]">Scan to view full order</p>
    </div>
  );
}

export default OrderQrCode;
