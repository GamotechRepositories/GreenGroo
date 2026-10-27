import React from "react";
import {
  Sprout,
  Users,
  QrCode,
  FlaskConical,
  UserCheck,
  Heart,
  MapPin,
  Sparkles,
  ShieldCheck,
  Leaf,
} from "lucide-react";
import OptimizedImg from "../common/OptimizedImg";

const MAHARASHTRA_PILLARS_DESKTOP = [
  {
    id: "farmer-direct",
    icon: Users,
    title: "Farmer Direct",
    subtitle: "(दलालीमुक्त थेट)",
    detail: "मध्ये दलाल नाहीत, थेट शेतकऱ्यांकडून",
  },
  {
    id: "organic-certified",
    icon: Sprout,
    title: "100% Organic",
    subtitle: "(सेंद्रिय खात्री)",
    detail: "रसायनमुक्त आणि नैसर्गिक उत्पादन",
  },
  {
    id: "full-traceability",
    icon: QrCode,
    title: "Full Traceability",
    subtitle: "(पूर्ण पारदर्शकता)",
    detail: "शेतापासून तुमच्या घरापर्यंत",
  },
  {
    id: "lab-tested",
    icon: FlaskConical,
    title: "Lab Tested",
    subtitle: "(चाचणीकृत गुणवत्ता)",
    detail: "प्रत्येक उत्पादनाची प्रयोगशाळा चाचणी",
  },
  {
    id: "farmer-profile",
    icon: UserCheck,
    title: "Farmer Profile",
    subtitle: "(शेतकऱ्यांची ओळख)",
    detail: "शेतकऱ्यांची माहिती, फोटो, शेती तपशील",
  },
  {
    id: "organic-lifestyle",
    icon: Heart,
    title: "Organic Lifestyle",
    subtitle: "(आरोग्यासाठी पर्याय)",
    detail: "भाज्या, फळे, डाळी, सेंद्रिय उत्पादने",
  },
  {
    id: "maharashtra-focus",
    icon: MapPin,
    title: "Maharashtra Focus",
    subtitle: "(आपला अभिमान)",
    detail: "स्थानिक शेतकरी, स्थानिक अर्थव्यवस्था",
  },
];

const MAHARASHTRA_PILLARS_MOBILE = [
  {
    id: "farmer-direct",
    title: "Farmer Direct",
    subtitle: "(दलालीशिवाय थेट)",
    detail: "ताजे उत्पादन थेट शेतकऱ्यांकडून",
    icon: (
      <svg className="w-6 h-6 text-emerald-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 11h20M7 11c0-2.8 2.2-4.8 5-4.8s5 2 5 4.8" />
        <circle cx="12" cy="14" r="2.4" />
        <path d="M6.5 21v-1.5a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4V21" />
      </svg>
    ),
  },
  {
    id: "organic-certified",
    title: "100% Organic",
    subtitle: "(सेंद्रिय शेती)",
    detail: "रसायनमुक्त आणि नैसर्गिक उत्पादन",
    icon: <Sprout className="w-6 h-6 text-emerald-800" strokeWidth={1.9} />,
  },
  {
    id: "full-traceability",
    title: "Full Traceability",
    subtitle: "(पूर्ण पारदर्शकता)",
    detail: "शेतापासून तुमच्या घरापर्यंत",
    icon: <QrCode className="w-5.5 h-5.5 text-emerald-800" strokeWidth={1.9} />,
  },
  {
    id: "lab-tested",
    title: "Lab Tested",
    subtitle: "(गुणवत्ता चाचणी)",
    detail: "प्रत्येक उत्पादनाची प्रमाणित तपासणी",
    icon: <FlaskConical className="w-5.5 h-5.5 text-emerald-800" strokeWidth={1.9} />,
  },
  {
    id: "farmer-profile",
    title: "Farmer Profile",
    subtitle: "(शेतकऱ्यांची ओळख)",
    detail: "शेतकऱ्यांची माहिती, फोटो, शेती तपशील",
    icon: <UserCheck className="w-6 h-6 text-emerald-800" strokeWidth={1.9} />,
  },
  {
    id: "organic-lifestyle",
    title: "Organic Lifestyle",
    subtitle: "(आरोग्यासाठी पर्याय)",
    detail: "ताजे, पौष्टिक, रसायनमुक्त उत्पादने",
    icon: <Heart className="w-5.5 h-5.5 text-emerald-800" strokeWidth={1.9} />,
  },
];

export default function MaharashtraPrideBanner() {
  return (
    <section className="w-full bg-[#fcfdfd] border-t-0 lg:border-t border-b border-emerald-950/10 overflow-hidden select-none">
      {/* =========================================================================
          1. DESKTOP VIEW: EXACT ORIGINAL SPLIT BANNER (UNTOUCHED AS IN IMAGE 1)
         ========================================================================= */}
      <div className="hidden lg:flex w-full flex-row items-stretch">
        {/* Left Side: Generated Maharashtra Farm Sunrise Hero Block */}
        <div className="relative w-[42%] min-h-[270px] flex items-center overflow-hidden shrink-0">
          <OptimizedImg
            src="/assets/payment/maharashtra_farm_sunrise.jpg"
            alt="Maharashtra Farmland at Sunrise"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

          {/* Content Over Left Image */}
          <div className="relative z-10 p-8 flex flex-col justify-between h-full w-full max-w-xl text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-emerald-300 text-[11px] font-black tracking-wider">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span>GREENGROCC</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-[10px] font-black shadow-sm">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Proudly Maharashtra Based</span>
              </div>
            </div>

            <div className="my-auto py-3">
              <h2 className="text-xl sm:text-2xl lg:text-[25px] font-black tracking-tight leading-snug drop-shadow-md text-white">
                माती, महाराष्ट्राचा अभिमान
              </h2>
              <p className="mt-2 text-xs sm:text-[13px] text-emerald-100/90 font-medium leading-relaxed drop-shadow max-w-md">
                फक्त डिलिव्हरी नाही... ही आहे शेतकऱ्यांची, तुमच्या आरोग्याची आणि आपल्या भविष्यातील गुंतवणुकीची कहाणी!
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10.5px] font-bold text-emerald-300/90 pt-1">
              <span>स्थानिक शेती</span>
              <span>•</span>
              <span>सेंद्रिय जीवनशैली</span>
              <span>•</span>
              <span>१००% शुद्धता</span>
            </div>
          </div>

          {/* Organic Curved Wave Divider into right side on desktop */}
          <div className="absolute -right-1 top-0 bottom-0 w-12 pointer-events-none z-10">
            <svg
              className="w-full h-full text-[#fcfdfd] fill-current"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path d="M0 0 C 40 30, 80 70, 100 100 L 100 0 Z" fill="none" />
              <path d="M70 0 Q 15 50 70 100 L 100 100 L 100 0 Z" />
            </svg>
          </div>
        </div>

        {/* Right Side: 7 Maharashtra Trust Pillars */}
        <div className="w-[58%] bg-[#fcfdfd] flex items-center px-6 py-4">
          <div className="w-full grid grid-cols-7 divide-x divide-emerald-950/10">
            {MAHARASHTRA_PILLARS_DESKTOP.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.id}
                  className="flex flex-col items-center text-center px-2.5 py-1 hover:bg-emerald-50/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 flex items-center justify-center mb-2 shadow-xs shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </div>

                  <h3 className="text-[12.5px] font-black text-gray-900 leading-tight">
                    {pillar.title}
                  </h3>
                  <span className="text-[10.5px] font-bold text-emerald-800 leading-tight mt-0.5">
                    {pillar.subtitle}
                  </span>

                  <p className="text-[10px] text-gray-500 font-medium leading-snug mt-1.5 max-w-[125px]">
                    {pillar.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. MOBILE VIEW: EXACT DESIGN AS SHOWN IN USER'S 2ND IMAGE (SAME TO SAME)
         ========================================================================= */}
      <div className="block lg:hidden w-full relative">
        {/* Top Hero Banner with Farm Photo */}
        <div className="relative w-full min-h-[310px] sm:min-h-[340px] flex flex-col justify-between overflow-hidden">
          <OptimizedImg
            src="/assets/payment/maharashtra_farm_sunrise.jpg"
            alt="Maharashtra Farmland at Sunrise"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
          />

          {/* Gradients for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />

          {/* Content inside Mobile Hero Banner */}
          <div className="relative z-10 p-4 sm:p-5 flex flex-col justify-between h-full text-white">
            {/* Top Pill Badges Row */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {/* GreenGrocc Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-[11px] font-extrabold tracking-wider shadow-sm">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span>GREENGROCC</span>
              </div>

              {/* Proudly Maharashtra Based Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/75 backdrop-blur-md border border-emerald-400/50 text-emerald-200 text-[10.5px] font-extrabold shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Proudly Maharashtra Based</span>
              </div>
            </div>

            {/* Headline and Narrative Paragraph */}
            <div className="pt-6 pb-2">
              <h2 className="text-[25px] sm:text-[28px] font-black tracking-tight leading-tight text-white drop-shadow-md">
                माती, महाराष्ट्राचा <br />
                <span className="text-[#38e275] drop-shadow-[0_2px_12px_rgba(34,197,94,0.45)]">
                  अभिमान
                </span>
              </h2>

              <p className="mt-2 text-[12px] sm:text-[13px] text-white/95 font-medium leading-relaxed drop-shadow max-w-sm">
                फक्त डिलिव्हरी नाही... ही आहे शेतकऱ्यांची, तुमच्या आरोग्याची आणि आपल्या भविष्यासाठी गुंतवणुकीची कहाणी!
              </p>
            </div>

            {/* Bottom Bullet Tags and Carousel Dots */}
            <div className="pt-2 pb-5">
              <div className="flex items-center justify-start gap-2.5 text-[11px] font-bold text-white/95">
                <div className="flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  <span>स्वाभाविक शेती</span>
                </div>
                <span className="text-white/40">|</span>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>सुरक्षित पोषणमूल्ये</span>
                </div>
                <span className="text-white/40">|</span>
                <div className="flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                  <span>१००% शुद्धता</span>
                </div>
              </div>

              {/* 3 Pagination Dots */}
              <div className="flex items-center justify-center gap-1.5 pt-3">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-xs" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Floating White Container with 2-Column Grid (Exactly as in 2nd Image) */}
        <div className="relative z-20 -mt-5 bg-white rounded-t-[30px] shadow-[0_-8px_25px_rgba(0,0,0,0.08)] px-3.5 pt-4 pb-5 border-t border-emerald-50">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {MAHARASHTRA_PILLARS_MOBILE.map((pillar) => (
              <div
                key={pillar.id}
                className="flex items-start gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-white border border-emerald-100/70 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-emerald-200 transition-colors"
              >
                {/* Round Mint Icon Container on Left */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#dcf4e4] border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {pillar.icon}
                </div>

                {/* Text Details on Right */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-[12px] sm:text-[13px] font-black text-gray-900 leading-tight">
                    {pillar.title}
                  </h3>
                  <span className="text-[10.5px] sm:text-[11px] font-bold text-[#075e34] leading-tight block mt-0.5">
                    {pillar.subtitle}
                  </span>
                  <p className="text-[9.5px] sm:text-[10px] text-gray-500 font-medium leading-snug mt-1 line-clamp-2">
                    {pillar.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
