export const DEFAULT_STORE_SETTINGS = {
  minimumOrderValue: 3000,
  minimumShippingCharge: 280,
  shippingSlabs: [
    { orderAmount: 3000, shippingCharge: 280 },
    { orderAmount: 5000, shippingCharge: 350 },
    { orderAmount: 8000, shippingCharge: 550 },
    { orderAmount: 12000, shippingCharge: 800 },
  ],
  cartNoticeEn: [
    "Please Verify Your Address Before Placing Your Order.",
    "Minimum order value ₹{{minOrder}}",
    "Parcel opening video is must for return.",
    "Shipping depends on parcel weight minimum Rs {{minShipping}}.",
    "User have to pay shipping charges in advance.",
  ],
  cartNoticeHi: [
    "कृपया अपना पूरा पता ठीक से लिखें ऑर्डर करने से पहले। इसके बाद ऑर्डर करें।",
    "न्यूनतम ऑर्डर मूल्य {{minOrder}}.",
    "पार्सल वापसी के लिए पार्सल खोलने का वीडियो अनिवार्य है।",
    "शिपिंग पार्सल के वजन पर निर्भर करता है न्यूनतम {{minShipping}}/",
    "उपयोगकर्ता को शिपिंग शुल्क अग्रिम रूप से देना होगा।",
  ],
};

const formatAmount = (amount) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export function normalizeShippingSlabs(slabs = []) {
  return [...slabs]
    .map((slab) => ({
      orderAmount: Number(slab.orderAmount),
      shippingCharge: Number(slab.shippingCharge),
    }))
    .filter(
      (slab) =>
        Number.isFinite(slab.orderAmount) &&
        Number.isFinite(slab.shippingCharge) &&
        slab.orderAmount >= 0 &&
        slab.shippingCharge >= 0
    )
    .sort((a, b) => a.orderAmount - b.orderAmount);
}

export function mergeStoreSettings(settings) {
  const source = settings || {};
  return {
    minimumOrderValue:
      Number(source.minimumOrderValue) || DEFAULT_STORE_SETTINGS.minimumOrderValue,
    minimumShippingCharge:
      Number(source.minimumShippingCharge) ||
      DEFAULT_STORE_SETTINGS.minimumShippingCharge,
    shippingSlabs: normalizeShippingSlabs(
      source.shippingSlabs?.length
        ? source.shippingSlabs
        : DEFAULT_STORE_SETTINGS.shippingSlabs
    ),
    cartNoticeEn:
      source.cartNoticeEn?.length > 0
        ? source.cartNoticeEn
        : DEFAULT_STORE_SETTINGS.cartNoticeEn,
    cartNoticeHi:
      source.cartNoticeHi?.length > 0
        ? source.cartNoticeHi
        : DEFAULT_STORE_SETTINGS.cartNoticeHi,
  };
}

export function calculateShippingCharge(subtotal, settings) {
  const amount = Number(subtotal) || 0;
  const merged = mergeStoreSettings(settings);
  const minShipping = merged.minimumShippingCharge;
  const slabs = merged.shippingSlabs;

  if (!slabs.length) {
    return minShipping;
  }

  let charge = minShipping;
  for (const slab of slabs) {
    if (amount >= slab.orderAmount) {
      charge = slab.shippingCharge;
    }
  }

  return charge;
}

export function meetsMinimumOrder(subtotal, settings) {
  const amount = Number(subtotal) || 0;
  const merged = mergeStoreSettings(settings);
  return amount >= merged.minimumOrderValue;
}

export function getMinimumOrderShortfall(subtotal, settings) {
  const merged = mergeStoreSettings(settings);
  return Math.max(0, merged.minimumOrderValue - (Number(subtotal) || 0));
}

function interpolateNoticeLine(line, settings) {
  const merged = mergeStoreSettings(settings);
  return String(line || "")
    .replaceAll("{{minOrder}}", formatAmount(merged.minimumOrderValue))
    .replaceAll("{{minShipping}}", formatAmount(merged.minimumShippingCharge));
}

export function buildCartNoticeBullets(settings, language = "en") {
  const merged = mergeStoreSettings(settings);
  const lines = language === "hi" ? merged.cartNoticeHi : merged.cartNoticeEn;
  return lines.map((line) => interpolateNoticeLine(line, merged));
}
