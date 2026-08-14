import { Link } from "react-router-dom";

export default function Ready2CookHotPickBanners() {
  return (
    <section className="px-4 sm:px-6 pt-0 pb-1">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        
        {/* Card 1: ZERO Platform fee (Matching Left Yellow/Pink Banner in Photo 1:1) */}
        <Link
          to="/product?store=festive"
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-[linear-gradient(135deg,#FFFDE7_0%,#FFF59D_55%,#FEE140_100%)] border border-amber-200/70 shadow-2xs flex items-center justify-between min-h-[76px] sm:min-h-[92px] group cursor-pointer transition hover:scale-[1.02]"
        >
          {/* Subtle Warm Diagonal Shine */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-white/60 pointer-events-none" />

          {/* Left Flying Pink Money Box Graphic */}
          <div className="relative z-10 flex h-10 w-10 sm:h-13 sm:w-13 shrink-0 items-center justify-center">
            <div className="relative flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#E91E63] to-[#C2185B] shadow-sm rotate-[-8deg]">
              <span className="text-white font-black text-sm sm:text-lg drop-shadow-xs">₹</span>
              {/* Left Wing */}
              <div className="absolute -left-2 -top-1 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-pink-200/80 blur-[0.2px] rotate-[-20deg]" />
              {/* Right Wing */}
              <div className="absolute -right-2 -top-1 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-pink-200/80 blur-[0.2px] rotate-[20deg]" />
            </div>
          </div>

          {/* Right Text Column: ZERO Platform fee */}
          <div className="relative z-10 flex flex-col justify-center text-left pl-1">
            <h3 className="text-sm sm:text-xl font-black text-[#C2185B] tracking-tight leading-none uppercase drop-shadow-2xs">
              ZERO
            </h3>
            <span className="text-[10.5px] sm:text-sm font-black text-[#C2185B] leading-tight mt-0.5">
              Platform fee
            </span>
          </div>
        </Link>

        {/* Card 2: Free delivery at ₹99 (Matching Right Light Green Banner in Photo 1:1) */}
        <Link
          to="/product?store=festive"
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 bg-[linear-gradient(135deg,#F0FDF4_0%,#DCFCE7_50%,#A7F3D0_100%)] border border-emerald-200/70 shadow-2xs flex flex-col items-center justify-center text-center min-h-[76px] sm:min-h-[92px] group cursor-pointer transition hover:scale-[1.02]"
        >
          {/* Subtle Green Diagonal Shine */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/50 pointer-events-none" />

          {/* Top Green Ticket Ribbon Badge: "Free delivery" */}
          <div className="relative z-10">
            <div className="relative inline-flex items-center justify-center rounded-full bg-[#15803D] px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black text-white shadow-2xs tracking-wide">
              {/* Ticket Notches */}
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#DCFCE7]" />
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#DCFCE7]" />
              Free delivery
            </div>
          </div>

          {/* Center Text: "at ₹99" */}
          <div className="relative z-10 text-xs sm:text-sm font-black text-slate-900 leading-none mt-1">
            at ₹99
          </div>

          {/* Bottom Subtext: "Zero platform fee" */}
          <div className="relative z-10 text-[8.5px] sm:text-[10px] font-bold text-slate-700 leading-tight mt-0.5">
            Zero platform fee
          </div>
        </Link>

      </div>
    </section>
  );
}
