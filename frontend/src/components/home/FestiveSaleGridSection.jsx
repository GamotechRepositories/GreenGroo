import { Link } from "react-router-dom";

const GRID_CARDS = [
  {
    title: "Daily Veggies",
    offer: "Up To 40% Off",
    link: "/product?categoryName=Vegetables",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    title: "Fresh Fruits",
    offer: "Flat 30% Off",
    link: "/product?categoryName=Fruits",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    title: "Green Leafy Bhaji",
    offer: "Up To 50% Off",
    link: "/product?categoryName=Vegetables",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    title: "Cut & Chopped",
    offer: "Flat ₹50 Off",
    link: "/?store=festive",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    title: "Nashik Organic",
    offer: "Up To 25% Off",
    link: "/product?categoryName=Organic",
    image: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    title: "Exotic Produce",
    offer: "Up To 35% Off",
    link: "/product?categoryName=Vegetables",
    image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    title: "Sweet Mangoes",
    offer: "Flat 20% Off",
    link: "/product?categoryName=Fruits",
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    title: "Kitchen Combos",
    offer: "Save Up To ₹150",
    link: "/product?categoryName=Vegetables",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&h=300&q=80",
  },
];

export default function FestiveSaleGridSection() {
  return (
    <section className="px-4 sm:px-6 py-3">
      {/* Blue Banner Box Wrapper */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#3CA5F6] via-[#4BB0FF] to-[#67BDFF] p-3.5 sm:p-5 shadow-md border border-blue-200">
        
        {/* Layout: Always Left Hero Card + Right 2-Row Horizontal Scroll Grid */}
        <div className="flex flex-row flex-nowrap gap-2.5 sm:gap-4 items-stretch">
          
          {/* Left Tall Hero Offer Card */}
          <Link
            to="/product?categoryName=Vegetables"
            className="w-[145px] sm:w-[220px] md:w-[240px] shrink-0 rounded-2xl bg-white p-2.5 sm:p-3.5 shadow-sm border border-white/60 flex flex-col justify-between items-center text-center group cursor-pointer transition hover:scale-[1.01] min-h-[230px] sm:min-h-[250px]"
          >
            <h3 className="text-xs sm:text-base font-black text-slate-900 leading-tight">
              Independence Day Specials
            </h3>
            
            <div className="my-1.5 sm:my-2 h-28 sm:h-44 w-full overflow-hidden rounded-xl flex items-center justify-center bg-sky-50 relative">
              <img
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&h=400&q=80"
                alt="Festive Specials"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                FARM FRESH
              </div>
            </div>

            <div className="w-full rounded-xl bg-[#E0F2FE] py-1 sm:py-1.5 px-1 text-[11px] sm:text-xs font-black text-[#0066CC]">
              Up To 55% Off
            </div>
          </Link>

          {/* Right Side: 2-Row Horizontal Scroll Grid (2.5 Cards visible per screen) */}
          <div className="flex-1 min-w-0 flex items-center">
            <div className="w-full grid grid-rows-2 auto-cols-[98px] sm:auto-cols-[135px] grid-flow-col gap-2 sm:gap-2.5 overflow-x-auto snap-x snap-mandatory hide-scrollbar py-1">
              {GRID_CARDS.map((card) => (
                <Link
                  key={card.title}
                  to={card.link}
                  className="w-full shrink-0 snap-center rounded-2xl bg-white p-1.5 sm:p-2.5 shadow-sm border border-white/60 flex flex-col justify-between items-center text-center group cursor-pointer transition hover:scale-[1.02] h-[105px] sm:h-[130px]"
                >
                  <h4 className="text-[9.5px] sm:text-xs font-black text-slate-900 leading-tight line-clamp-2 min-h-[22px] sm:min-h-[26px] flex items-center justify-center">
                    {card.title}
                  </h4>

                  <div className="my-0.5 sm:my-1 h-9 sm:h-13 w-9 sm:w-13 overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  <div className="w-full rounded-lg bg-[#E0F2FE] py-0.5 px-0.5 text-[9px] sm:text-xs font-black text-[#0066CC] truncate">
                    {card.offer}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Horizontal Scroll Deal Cards (1.5 Cards visible per screen) */}
        <div className="mt-3 flex gap-2.5 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-1">
          {/* Card 1 */}
          <Link
            to="/product"
            className="w-[68vw] sm:w-[270px] shrink-0 snap-center rounded-2xl bg-white p-2.5 flex items-center justify-between shadow-sm cursor-pointer transition hover:bg-slate-50 border border-white/80"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-1">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-amber-100 flex items-center justify-center text-lg">
                📺
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">
                  Shop &amp; win prizes
                </p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5 truncate">
                  Min Order ₹299
                </p>
              </div>
            </div>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-black text-[10px]">
              &gt;
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            to="/product?categoryName=Pantry"
            className="w-[68vw] sm:w-[270px] shrink-0 snap-center rounded-2xl bg-white p-2.5 flex items-center justify-between shadow-sm cursor-pointer transition hover:bg-slate-50 border border-white/80"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-1">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">
                🌾
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">
                  Buy Rice &amp; get 1kg Free
                </p>
                <p className="text-[10px] font-bold text-emerald-700 mt-0.5 truncate">
                  Limited Offer
                </p>
              </div>
            </div>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-black text-[10px]">
              &gt;
            </div>
          </Link>

          {/* Card 3 */}
          <Link
            to="/product?categoryName=Vegetables"
            className="w-[68vw] sm:w-[270px] shrink-0 snap-center rounded-2xl bg-white p-2.5 flex items-center justify-between shadow-sm cursor-pointer transition hover:bg-slate-50 border border-white/80"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-1">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-green-100 flex items-center justify-center text-lg">
                🌿
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">
                  Free Coriander &amp; Chillies
                </p>
                <p className="text-[10px] font-bold text-emerald-700 mt-0.5 truncate">
                  Above ₹149
                </p>
              </div>
            </div>
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-black text-[10px]">
              &gt;
            </div>
          </Link>
        </div>

      </div>
    </section>
  );
}
