import { useRef } from "react";
import { Link } from "react-router-dom";

export const READY2COOK_SHOP_BANNERS = [
  {
    id: "rtc-banner-1",
    title: "Pre-washed & chopped",
    subtitle: "FLAT ₹50 OFF",
    btnText: "Order cut veggies",
    bgColor: "bg-[#A16207]",
    textColor: "text-white",
    subColor: "text-amber-100",
    btnBg: "bg-[#FACC15] text-[#713F12] hover:bg-amber-200",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Chopped&store=festive",
  },
  {
    id: "rtc-banner-2",
    title: "10-minute meal prep",
    subtitle: "ZERO PREP TIME",
    btnText: "Quick mixes",
    bgColor: "bg-[#CA8A04]",
    textColor: "text-white",
    subColor: "text-yellow-100",
    btnBg: "bg-white text-[#A16207] hover:bg-amber-50",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Veggie%20Mix&store=festive",
  },
  {
    id: "rtc-banner-3",
    title: "Peeled garlic & herbs",
    subtitle: "CLEANED & HYGIENIC",
    btnText: "Shop peeled",
    bgColor: "bg-[#713F12]",
    textColor: "text-white",
    subColor: "text-amber-200",
    btnBg: "bg-[#FACC15] text-[#713F12] hover:bg-amber-200",
    image: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=500&h=300&q=80",
    link: "/product?categoryName=Peeled%20%26%20Cleaned&store=festive",
  },
];

export function Ready2CookShopBanner() {
  const scrollRef = useRef(null);

  return (
    <div className="relative mb-3 w-full">
      <div
        ref={scrollRef}
        className="hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory px-0.5 py-1"
      >
        {READY2COOK_SHOP_BANNERS.map((banner) => (
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

export default Ready2CookShopBanner;
