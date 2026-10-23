import React, { useState } from "react";
import { Link } from "react-router-dom";
import { X, Sparkles } from "lucide-react";

export default function FarmProduceDualBanners({ className = "" }) {
  const [openVideo, setOpenVideo] = useState(false);

  return (
    <>
      <section className={`w-full py-2 sm:py-3.5 px-3 sm:px-4 lg:px-0 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5">
          {/* Banner 1: आज शेतात काय आहे? (Single Banner - 2nd Image) */}
          <Link
            to="/categories"
            aria-label="आज शेतात काय आहे? - या आठवड्यातील ताजी उत्पादने"
            className="relative h-32 sm:h-44 md:h-52 lg:h-56 xl:h-60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group border border-[#cde8d5] block"
          >
            <img
              src="/assets/features/farm_fresh_slide_2.png"
              alt="आज शेतात काय आहे? - या आठवड्यातील ताजी उत्पादने"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* Subtle interactive hover highlight */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
          </Link>

          {/* Banner 2: Farmer Stories (Video / Real Farmer Story) */}
          <div
            onClick={() => setOpenVideo(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpenVideo(true);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Play farmer story video"
            className="relative h-32 sm:h-44 md:h-52 lg:h-56 xl:h-60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group border border-[#cde8d5] cursor-pointer bg-[#f3f9f4]"
          >
            <img
              src="/assets/features/farmer_stories_banner_complete.png"
              alt="Farmer Stories - शेतकऱ्यांच्या खऱ्या गोष्टी"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            {/* Subtle interactive hover highlight */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Video Player Modal */}
      {openVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-gray-900 border-b border-gray-800 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-sm sm:text-base leading-tight">शेतकऱ्यांची खरी गोष्ट (Farmer Story)</h4>
                  <p className="text-[11px] text-emerald-400">शेतापासून थेट तुमच्या स्वयंपाकघरापर्यंत</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenVideo(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                aria-label="Close video"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src="/10847026-hd_1920_1080_25fps.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-900 flex items-center justify-between text-xs text-gray-300">
              <span>स्थानिक शेतकरी: <strong>तुकाराम शिंदे</strong> (सातारा सेंद्रिय शेत)</span>
              <button
                type="button"
                onClick={() => setOpenVideo(false)}
                className="px-3.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
