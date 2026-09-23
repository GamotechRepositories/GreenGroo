import { Link, useSearchParams } from "react-router-dom";
import { sectionToStoreKey } from "../grocery/HomeMobileHeader";

const PREORDER_PROMOS = [
  {
    to: "/product?categoryName=Vegetables",
    eyebrow: "Farm fresh",
    title: "Fresh vegetables",
    subtitle: "From farm to your kitchen",
    className:
      "bg-[linear-gradient(145deg,#064E3B_0%,#047857_45%,#0C831F_100%)] text-white",
    chipClass: "bg-[#A7F3D0] text-[#064E3B]",
    art: "🥦",
  },
  {
    to: "/product?categoryName=Fruits",
    eyebrow: "Seasonal picks",
    title: "Juicy fruits",
    subtitle: "Picked at peak ripeness",
    className:
      "bg-[linear-gradient(145deg,#ECFDF5_0%,#D1FAE5_50%,#A7F3D0_100%)] text-[#064E3B]",
    chipClass: "bg-[#0C831F] text-[#ECFDF5]",
    art: "🍎",
  },
];

const READY2COOK_PROMOS = [
  {
    to: "/product?store=festive&categoryName=Chopped%20Vegies",
    eyebrow: "Prep-free",
    title: "Chopped & ready",
    subtitle: "Start cooking in minutes",
    className:
      "bg-[linear-gradient(145deg,#713F12_0%,#A16207_45%,#CA8A04_100%)] text-white",
    chipClass: "bg-[#FACC15] text-[#713F12]",
    art: "🥗",
  },
  {
    to: "/product?store=festive&categoryName=Veggie%20%26%20Bhaji%20Mix",
    eyebrow: "Kitchen kits",
    title: "Combo packs",
    subtitle: "Save on daily sabzi prep",
    className:
      "bg-[linear-gradient(145deg,#FEF9C3_0%,#FDE68A_50%,#FACC15_100%)] text-[#713F12]",
    chipClass: "bg-[#713F12] text-[#FDE68A]",
    art: "📦",
  },
];

const INSTANT_PROMOS = [
  {
    to: "/product?store=mall&categoryName=SuperMall%20Packaged%20Grocery",
    eyebrow: "Delivered fast",
    title: "Instant essentials",
    subtitle: "Pantry staples in minutes",
    className:
      "bg-[linear-gradient(145deg,#1E3A8A_0%,#1D4ED8_45%,#2563EB_100%)] text-white",
    chipClass: "bg-[#93C5FD] text-[#1E3A8A]",
    art: "⚡",
  },
  {
    to: "/product?store=mall&categoryName=SuperMall%20Snacks%20%26%20Munchies",
    eyebrow: "Tonight",
    title: "Snacks & munchies",
    subtitle: "Cravings, sorted instantly",
    className:
      "bg-[linear-gradient(145deg,#DBEAFE_0%,#BFDBFE_50%,#93C5FD_100%)] text-[#1E3A8A]",
    chipClass: "bg-[#1E3A8A] text-[#BFDBFE]",
    art: "🍿",
  },
];

function promosForStore(store) {
  if (store === "mall") return INSTANT_PROMOS;
  if (store === "festive") return READY2COOK_PROMOS;
  return PREORDER_PROMOS;
}

export default function Ready2CookHotPickBanners() {
  const [searchParams] = useSearchParams();
  const store = sectionToStoreKey(searchParams.get("store"));
  const promos = promosForStore(store);

  return (
    <section className="px-4 pb-1 pt-1 sm:px-6 lg:px-6">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
        {promos.map((promo) => (
          <Link
            key={promo.to + promo.title}
            to={promo.to}
            className={`group relative flex min-h-[88px] flex-col justify-between overflow-hidden rounded-2xl p-3.5 transition duration-200 hover:-translate-y-0.5 sm:min-h-[104px] sm:rounded-[1.35rem] sm:p-4 ${promo.className}`}
          >
            <div className="pointer-events-none absolute -right-3 -top-4 text-5xl opacity-[0.18] transition duration-300 group-hover:scale-110 group-hover:opacity-25 sm:text-6xl">
              {promo.art}
            </div>
            <div className="relative z-10">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] sm:text-[10px] ${promo.chipClass}`}
              >
                {promo.eyebrow}
              </span>
              <h3 className="mt-2 text-[15px] font-bold leading-tight tracking-tight sm:text-lg">
                {promo.title}
              </h3>
              <p className="mt-1 text-[11px] font-medium leading-snug opacity-80 sm:text-xs">
                {promo.subtitle}
              </p>
            </div>
            <span className="relative z-10 mt-3 inline-flex items-center gap-1 text-[11px] font-bold sm:text-xs">
              Shop now
              <svg className="h-3 w-3 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
