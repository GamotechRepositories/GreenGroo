import { useRef } from "react";
import { Link } from "react-router-dom";

const SHOP_BANNERS = [
  {
    id: "freshly-launched",
    title: "Freshly Launched",
    subtitle: "UP TO 50% OFF",
    btnText: "Explore",
    bgColor: "bg-[#F7E6CA]",
    textColor: "text-[#166534]",
    subColor: "text-[#15803D]",
    btnBg: "bg-white text-black hover:bg-neutral-100",
    image: "/banner_freshly_launched.jpg",
    link: "/product?categoryName=Fresh%20Fruits",
  },
  {
    id: "flower-bouquet",
    title: "Fresh Flowers & Gifts",
    subtitle: "UP TO 40% OFF",
    btnText: "Shop Now",
    bgColor: "bg-[#831843]",
    textColor: "text-white",
    subColor: "text-pink-200",
    btnBg: "bg-white text-[#831843] hover:bg-pink-50",
    image: "/banner_flowers.jpg",
    link: "/product?categoryName=Season's%20best",
  },
  {
    id: "farm-fresh",
    title: "Farm Fresh Organic",
    subtitle: "EXTRA 20% OFF",
    btnText: "Order Fresh",
    bgColor: "bg-[#14532D]",
    textColor: "text-white",
    subColor: "text-green-200",
    btnBg: "bg-white text-[#14532D] hover:bg-green-50",
    image: "/vegetables.png",
    link: "/product?categoryName=Fresh%20Vegetables",
  },
];

export default function ShopTopSlidingBanners() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction * 280,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative w-full mb-3">
      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5"
      >
        {SHOP_BANNERS.map((banner) => (
          <Link
            key={banner.id}
            to={banner.link}
            className={`group relative flex h-[120px] min-w-[260px] max-w-[320px] shrink-0 flex-1 snap-start overflow-hidden rounded-2xl ${banner.bgColor} shadow-sm transition hover:shadow-md sm:min-w-[290px]`}
          >
            {/* Left Content */}
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

            {/* Right Image */}
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
