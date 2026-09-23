import { useRef } from "react";
import { Link } from "react-router-dom";

export const SUPERMALL_SHOP_BANNERS = [
  {
    id: "sm-banner-1",
    title: "Instant essentials",
    subtitle: "UP TO 50% OFF",
    btnText: "Shop now",
    bgColor: "bg-[#1E3A8A]",
    textColor: "text-white",
    subColor: "text-blue-200",
    btnBg: "bg-[#93C5FD] text-[#1E3A8A] hover:bg-blue-200",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Grocery&store=mall",
  },
  {
    id: "sm-banner-2",
    title: "Atta, oils & pantry",
    subtitle: "BEST PRICE",
    btnText: "Shop pantry",
    bgColor: "bg-[#2563EB]",
    textColor: "text-white",
    subColor: "text-blue-100",
    btnBg: "bg-white text-[#1D4ED8] hover:bg-blue-50",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Oils%20%26%20Ghee&store=mall",
  },
  {
    id: "sm-banner-3",
    title: "Snacks & beverages",
    subtitle: "COMBO SAVINGS",
    btnText: "Order snacks",
    bgColor: "bg-[#1D4ED8]",
    textColor: "text-white",
    subColor: "text-sky-200",
    btnBg: "bg-[#93C5FD] text-[#1E3A8A] hover:bg-blue-200",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Snacks%20%26%20Munchies&store=mall",
  },
];

export function SuperMallShopBanner() {
  const scrollRef = useRef(null);

  return (
    <div className="relative mb-3 w-full">
      <div
        ref={scrollRef}
        className="hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory px-0.5 py-1"
      >
        {SUPERMALL_SHOP_BANNERS.map((banner) => (
          <Link
            key={banner.id}
            to={banner.link}
            className={`group relative flex h-[120px] min-w-[260px] max-w-[320px] shrink-0 flex-1 snap-start overflow-hidden rounded-2xl ${banner.bgColor} transition hover:-translate-y-0.5 sm:min-w-[290px]`}
          >
            <div className="z-10 flex flex-1 flex-col justify-between p-3.5 pr-1">
              <div>
                <h3 className={`text-base font-bold leading-tight tracking-tight sm:text-lg ${banner.textColor}`}>
                  {banner.title}
                </h3>
                <p className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider ${banner.subColor}`}>
                  {banner.subtitle}
                </p>
              </div>
              <span className={`inline-block rounded-lg px-3 py-1 text-xs font-bold transition group-hover:scale-[1.02] ${banner.btnBg}`}>
                {banner.btnText}
              </span>
            </div>
            <div className="relative w-[42%] shrink-0 overflow-hidden">
              <img
                src={banner.image}
                alt=""
                className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-transparent" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default SuperMallShopBanner;
