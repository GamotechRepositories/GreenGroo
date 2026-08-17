import { useRef } from "react";
import { Link } from "react-router-dom";

export const GREENGROCC_SHOP_BANNERS = [
  {
    id: "gg-banner-1",
    title: "Farm Fresh Veggies",
    subtitle: "UP TO 40% OFF",
    btnText: "Shop Veggies",
    bgColor: "bg-[#14532D]",
    textColor: "text-white",
    subColor: "text-emerald-200",
    btnBg: "bg-white text-[#14532D] hover:bg-emerald-50",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Vegetables",
  },
  {
    id: "gg-banner-2",
    title: "Freshly Harvested Fruits",
    subtitle: "FLAT 30% OFF",
    btnText: "Explore Fruits",
    bgColor: "bg-[#7C2D12]",
    textColor: "text-white",
    subColor: "text-orange-200",
    btnBg: "bg-white text-[#7C2D12] hover:bg-amber-50",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Fruits",
  },
  {
    id: "gg-banner-3",
    title: "100% Organic Produce",
    subtitle: "DIRECT FROM NASHIK FARMERS",
    btnText: "Shop Organic",
    bgColor: "bg-[#064E3B]",
    textColor: "text-white",
    subColor: "text-emerald-300",
    btnBg: "bg-white text-[#064E3B] hover:bg-emerald-100",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Organic",
  },
];

export function GreenGroccShopBanner() {
  const scrollRef = useRef(null);

  return (
    <div className="relative w-full mb-3">
      <div
        ref={scrollRef}
        className="hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5"
      >
        {GREENGROCC_SHOP_BANNERS.map((banner) => (
          <Link
            key={banner.id}
            to={banner.link}
            className={`group relative flex h-[120px] min-w-[260px] max-w-[320px] shrink-0 flex-1 snap-start overflow-hidden rounded-2xl ${banner.bgColor} shadow-sm transition hover:shadow-md sm:min-w-[290px]`}
          >
            <div className="z-10 flex flex-1 flex-col justify-between p-3.5 pr-1">
              <div>
                <h3 className={`text-base font-extrabold leading-tight tracking-tight ${banner.textColor} sm:text-lg`}>
                  {banner.title}
                </h3>
                <p className={`mt-0.5 text-[10px] font-black uppercase tracking-wider ${banner.subColor}`}>
                  {banner.subtitle}
                </p>
              </div>
              <div>
                <span className={`inline-block rounded-lg px-3 py-1 text-xs font-bold shadow-sm transition group-hover:scale-105 ${banner.btnBg}`}>
                  {banner.btnText}
                </span>
              </div>
            </div>
            <div className="relative w-[42%] shrink-0 overflow-hidden">
              <img
                src={banner.image}
                alt={banner.title}
                className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default GreenGroccShopBanner;
