import { useRef } from "react";
import { Link } from "react-router-dom";

export const READY2COOK_SHOP_BANNERS = [
  {
    id: "rtc-banner-1",
    title: "Pre-Washed & Chopped",
    subtitle: "FLAT ₹50 OFF",
    btnText: "Order Cut Veggies",
    bgColor: "bg-[#7C2D12]",
    textColor: "text-white",
    subColor: "text-amber-200",
    btnBg: "bg-white text-[#7C2D12] hover:bg-orange-50",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Chopped&store=festive",
  },
  {
    id: "rtc-banner-2",
    title: "10-Minute Meal Prep",
    subtitle: "ZERO PREP TIME",
    btnText: "Quick Mixes",
    bgColor: "bg-[#9A3412]",
    textColor: "text-white",
    subColor: "text-orange-200",
    btnBg: "bg-white text-[#9A3412] hover:bg-amber-50",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Veggie%20Mix&store=festive",
  },
  {
    id: "rtc-banner-3",
    title: "Peeled Garlic & Herbs",
    subtitle: "CLEANED & HYGIENIC",
    btnText: "Shop Peeled",
    bgColor: "bg-[#C2410C]",
    textColor: "text-white",
    subColor: "text-amber-100",
    btnBg: "bg-white text-[#C2410C] hover:bg-orange-100",
    image: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Peeled%20%26%20Cleaned&store=festive",
  },
];

export function Ready2CookShopBanner() {
  const scrollRef = useRef(null);

  return (
    <div className="relative w-full mb-3">
      <div
        ref={scrollRef}
        className="hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5"
      >
        {READY2COOK_SHOP_BANNERS.map((banner) => (
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

export default Ready2CookShopBanner;
