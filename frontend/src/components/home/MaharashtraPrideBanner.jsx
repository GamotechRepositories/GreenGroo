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
} from "lucide-react";

const MAHARASHTRA_PILLARS = [
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

export default function MaharashtraPrideBanner() {
  return (
    <section className="w-full bg-[#fcfdfd] border-t border-b border-emerald-950/10 overflow-hidden select-none">
      <div className="w-full flex flex-col lg:flex-row items-stretch">
        {/* ========================================================
            LEFT SIDE: Generated Maharashtra Farm Sunrise Hero Block
           ======================================================== */}
        <div className="relative w-full lg:w-[42%] min-h-[220px] sm:min-h-[260px] lg:min-h-[270px] flex items-center overflow-hidden shrink-0">
          {/* Generated AI image of lush Maharashtra terraced farm at sunrise */}
          <img
            src="/assets/payment/maharashtra_farm_sunrise.jpg"
            alt="Maharashtra Farmland at Sunrise"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
          />

          {/* Cinematic Dark/Emerald Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30 lg:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

          {/* Content Over Left Image */}
          <div className="relative z-10 p-5 sm:p-7 lg:p-8 flex flex-col justify-between h-full w-full max-w-xl text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-emerald-300 text-[11px] font-black tracking-wider">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span>GREENGROCC</span>
              </div>

              {/* Proudly Maharashtra Based Badge */}
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

          {/* Organic Curved Wave Divider into the right side on desktop */}
          <div className="hidden lg:block absolute -right-1 top-0 bottom-0 w-12 pointer-events-none z-10">
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

        {/* ========================================================
            RIGHT SIDE: 7 Maharashtra Trust Pillars
           ======================================================== */}
        <div className="w-full lg:w-[58%] bg-[#fcfdfd] flex items-center px-3 sm:px-6 py-5 lg:py-4">
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-2.5 sm:gap-3 xl:gap-0 xl:divide-x xl:divide-emerald-950/10">
            {MAHARASHTRA_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.id}
                  className="flex flex-col items-center text-center p-2.5 sm:p-3 xl:px-2.5 xl:py-1 rounded-xl sm:rounded-2xl xl:rounded-none bg-white xl:bg-transparent border border-emerald-900/5 xl:border-none shadow-xs xl:shadow-none hover:bg-emerald-50/40 transition-colors"
                >
                  {/* Round Mint Icon Chip */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 flex items-center justify-center mb-2 shadow-xs shrink-0">
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>

                  {/* Title & Marathi Subtitle */}
                  <h3 className="text-xs sm:text-[12.5px] font-black text-gray-900 leading-tight">
                    {pillar.title}
                  </h3>
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-emerald-800 leading-tight mt-0.5">
                    {pillar.subtitle}
                  </span>

                  {/* Detail */}
                  <p className="text-[9.5px] sm:text-[10px] text-gray-500 font-medium leading-snug mt-1.5 max-w-[125px]">
                    {pillar.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
