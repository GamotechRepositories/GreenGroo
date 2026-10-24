import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

function LeafMark({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.5 4.5c-6.2.4-10.8 3.2-13.2 8.1-.7 1.4-1.1 2.9-1.2 4.4 2.2-.2 4.3-.9 6.1-2.2 4.2-3 6.6-7.2 8.3-10.3Z" />
      <path d="M5.2 17.8c2.4-4.6 6.4-7.4 11.6-8.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

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

const BANNERS = [
  {
    id: "summer",
    image: "/offers/summer.jpg",
    position: "object-[70%_center]",
    tag: "Farm Fresh",
    title: "Gentle Summer\nOrganic Care",
    subtitle: "Farm Fresh Vegetables & Fruits",
    offer: "Up to 30% Off",
    link: "/product?categoryName=Vegetables",
  },
  {
    id: "harvest",
    image: "/offers/harvest.jpg",
    position: "object-center",
    tag: "Direct Farm",
    title: "Nashik Co-op\nDirect Harvest",
    subtitle: "Fresh vegetable combos from the farm",
    offer: "Flat 40% Off",
    link: "/product?categoryName=Vegetables",
  },
];

const TRUST_POINTS = [
  { id: "natural", label: "100% Natural" },
  { id: "farmers", label: "Direct from Farmers" },
  { id: "quality", label: "Trusted Quality" },
];

export default function TopPaymentOffersSection() {
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[activeBanner];

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

      <div className="relative mt-4">
        <Link
          to={banner.link}
          className="relative block aspect-[1024/342] w-full overflow-hidden rounded-xl sm:rounded-2xl"
        >
          <img src={banner.image} alt="" className={`absolute inset-0 h-full w-full object-cover ${banner.position}`} />
          <div className="absolute inset-y-0 left-0 w-[68%] bg-gradient-to-r from-[#f4fbf2] via-[#f4fbf2]/80 to-transparent" />
          <div className="relative z-10 flex h-full max-w-[68%] flex-col justify-center px-3 py-3 sm:max-w-[58%] sm:px-7">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#1f8a3b] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[10px]">
              <LeafMark className="h-3 w-3" />
              {banner.tag}
            </span>
            <h3 className="mt-1 whitespace-pre-line text-[16px] font-extrabold leading-[1.05] text-[#145c32] sm:mt-2 sm:text-[30px] lg:text-[36px]">
              {banner.title}
            </h3>
            <p className="mt-0.5 text-[10px] font-medium text-slate-700 sm:mt-1 sm:text-[15px]">{banner.subtitle}</p>
            <p className="text-[12px] font-extrabold text-slate-900 sm:text-[18px]">{banner.offer}</p>
            <div className="mt-2 hidden flex-wrap gap-2 sm:flex">
              {TRUST_POINTS.map((point) => (
                <span
                  key={point.id}
                  className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-700"
                >
                  <span className="text-[#1f8a3b]">
                    <LeafMark className="h-3 w-3" />
                  </span>
                  {point.label}
                </span>
              ))}
            </div>
            <span className="mt-2 inline-flex w-fit items-center rounded-full bg-[#145c32] px-3 py-1 text-[10px] font-bold text-white sm:mt-3 sm:px-4 sm:py-2 sm:text-[13px]">
              Shop Now →
            </span>
          </div>
          <span className="absolute bottom-2 right-2 z-10 flex h-[52px] w-[52px] flex-col items-center justify-center rounded-full bg-[#1f8a3b] text-center text-[8px] font-extrabold leading-tight text-white shadow-md sm:bottom-4 sm:right-4 sm:h-[84px] sm:w-[84px] sm:text-[11px]">
            Fresh
            <br />
            Healthy
            <br />
            Trusted
          </span>
        </Link>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {BANNERS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveBanner(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeBanner ? "w-8 bg-[#1f8a3b]" : "w-1.5 bg-slate-300"
              }`}
              aria-label={`Go to offer banner ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
