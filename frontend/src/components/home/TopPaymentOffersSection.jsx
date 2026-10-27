import { ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import OfferBannerCarousel, { LeafMark } from "./OfferBannerCarousel";
import { useSectionBanners } from "../../hooks/queries/useSectionBanners";

function SbiLogo() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00A3E0]">
        <span className="h-3 w-3 rounded-full border-2 border-white" />
      </span>
      <span className="text-[13px] font-extrabold leading-none text-[#1e293b]">
        SBI <span className="font-bold text-[#00A3E0]">card</span>
      </span>
    </span>
  );
}

function FlipkartLogo() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FFE11B] text-[16px] font-black text-[#2874F0]">
        f
      </span>
      <span className="text-[12px] font-extrabold leading-tight text-slate-900">
        Flipkart
        <span className="block text-[10px] font-bold text-slate-600">Axis</span>
      </span>
    </span>
  );
}

function HdfcLogo() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E31E24] text-[9px] font-black text-white">
        HDFC
      </span>
      <span className="text-[11px] font-extrabold leading-tight tracking-wide text-[#004C8F]">
        HDFC
        <span className="block text-[10px]">BANK</span>
      </span>
    </span>
  );
}

function PaytmLogo() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex h-7 flex-col items-center justify-center rounded-md bg-[#00B9F1] px-1.5 leading-none text-white">
        <span className="text-[10px] font-black">pay</span>
        <span className="text-[8px] font-bold">UPI</span>
      </span>
    </span>
  );
}

const PAYMENT_OFFERS = [
  {
    id: "sbi",
    logo: <SbiLogo />,
    discount: "10% Instant Discount*",
    desc: "with SBI Credit Card & EMI Txns",
    cardBg: "bg-[#E7F6FF]",
    border: "border-[#C5E6F8]",
  },
  {
    id: "flipkart",
    logo: <FlipkartLogo />,
    discount: "Get 10% Savings*",
    desc: "with Flipkart Axis Bank Credit Card",
    cardBg: "bg-[#FFF6DE]",
    border: "border-[#F3E2A8]",
  },
  {
    id: "hdfc",
    logo: <HdfcLogo />,
    discount: "Flat ₹100 Cashback*",
    desc: "on HDFC Bank PayZapp & Cards",
    cardBg: "bg-[#F7F2FF]",
    border: "border-[#E4D7F5]",
  },
  {
    id: "paytm",
    logo: <PaytmLogo />,
    discount: "Up to ₹75 Cashback*",
    desc: "on Paytm UPI transactions",
    cardBg: "bg-[#E7F7FF]",
    border: "border-[#C9E8F6]",
  },
];

export default function TopPaymentOffersSection() {
  const [searchParams] = useSearchParams();
  const banners = useSectionBanners(searchParams.get("store"), "offer");

  return (
    <section className="px-2 py-2 sm:px-3 lg:px-0 lg:py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[#1f8a3b]">
            <LeafMark className="h-5 w-5" />
          </span>
          <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900 sm:text-[22px]">Top Offers</h2>
        </div>
      </div>

      <div className="mt-4 flex gap-2.5 overflow-x-auto hide-scrollbar pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {PAYMENT_OFFERS.map((offer) => (
          <div
            key={offer.id}
            className={`flex min-w-[250px] items-center gap-2 rounded-2xl border px-3 py-2.5 lg:min-w-0 ${offer.cardBg} ${offer.border}`}
          >
            <div className="shrink-0">{offer.logo}</div>
            <div className="min-w-0 flex-1 border-l border-black/10 pl-2.5">
              <p className="truncate text-[12.5px] font-bold leading-tight text-slate-900">{offer.discount}</p>
              <p className="mt-0.5 truncate text-[10.5px] leading-tight text-slate-500">{offer.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </div>
        ))}
      </div>

      <OfferBannerCarousel banners={banners.desktop} className="mt-4 hidden lg:block" />
      <OfferBannerCarousel banners={banners.mobile} className="mt-4 lg:hidden" />
    </section>
  );
}
