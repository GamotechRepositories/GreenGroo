import { useRef } from "react";
import { Link } from "react-router-dom";

export const SUPERMALL_SHOP_BANNERS = [
  {
    id: "sm-banner-1",
    title: "Super Mall Mega Marketplace",
    subtitle: "UP TO 50% OFF BRANDS",
    btnText: "Explore Mall Deals",
    bgColor: "bg-[#1E1B4B]",
    textColor: "text-white",
    subColor: "text-indigo-200",
    btnBg: "bg-white text-[#1E1B4B] hover:bg-indigo-50",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Grocery&store=mall",
  },
  {
    id: "sm-banner-2",
    title: "Brand Atta & Cooking Oils",
    subtitle: "BEST PRICE GUARANTEE",
    btnText: "Shop Pantry",
    bgColor: "bg-[#312E81]",
    textColor: "text-white",
    subColor: "text-blue-200",
    btnBg: "bg-white text-[#312E81] hover:bg-blue-50",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Oils%20%26%20Ghee&store=mall",
  },
  {
    id: "sm-banner-3",
    title: "Snacks, Biscuits & Beverages",
    subtitle: "COMBO SAVINGS",
    btnText: "Order Snacks",
    bgColor: "bg-[#1E293B]",
    textColor: "text-white",
    subColor: "text-[#60A5FA]",
    btnBg: "bg-white text-[#1E293B] hover:bg-slate-100",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Snacks%20%26%20Munchies&store=mall",
  },
];

export function SuperMallShopBanner() {
  const scrollRef = useRef(null);

  return (
    <div className="relative w-full mb-3">
      <div
        ref={scrollRef}
        className="hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5"
      >
        {SUPERMALL_SHOP_BANNERS.map((banner) => (
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

export default SuperMallShopBanner;
