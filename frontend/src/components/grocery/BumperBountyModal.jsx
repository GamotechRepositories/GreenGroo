import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function BumperBountyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show offer popup automatically on page load
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOrderNow = () => {
    setIsOpen(false);
    navigate("/product?categoryName=Vegetables");
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-[330px] sm:max-w-[350px] bg-white rounded-[28px] overflow-hidden shadow-2xl transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative bg-white pt-6 pb-4 px-6 text-center">
          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close offer modal"
            className="absolute top-4 right-4 w-7 h-7 bg-[#78C25B] hover:bg-[#66b349] text-white rounded-full flex items-center justify-center shadow-sm transition active:scale-90"
          >
            <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* BUMPER BOUNTY Title */}
          <h2 className="text-3xl sm:text-[34px] font-black uppercase tracking-tight text-[#4C1D95] leading-[0.9] font-sans">
            Bumper<br />Bounty
          </h2>
        </div>

        {/* Wavy Divider */}
        <div className="w-full overflow-hidden leading-none -mb-[1px]">
          <svg 
            className="relative block w-full h-4 text-[#E8DBFA]" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"></path>
          </svg>
        </div>

        {/* Lavender Body Section */}
        <div className="bg-gradient-to-b from-[#E8DBFA] to-[#DBC5F7] p-4 pt-2 flex flex-col gap-3.5">
          {/* Product 1: New Potato */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-purple-100 flex flex-col">
            <div className="bg-[#A4CE4E] py-1 px-4 text-center">
              <span className="text-sm font-black text-[#1E3A00] tracking-wide">
                New Potato
              </span>
            </div>
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-28 h-20 flex items-center justify-center overflow-hidden">
                <img 
                  src="/bumper_potato.jpg" 
                  alt="New Potato in wooden crate" 
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <div className="flex items-baseline gap-1 text-right pr-2">
                <span className="text-3xl font-extrabold text-neutral-800 tracking-tight">₹5</span>
                <span className="text-[11px] font-bold text-neutral-600 uppercase">(500G)</span>
              </div>
            </div>
          </div>

          {/* Product 2: Banana Golden */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-purple-100 flex flex-col">
            <div className="bg-[#A4CE4E] py-1 px-4 text-center">
              <span className="text-sm font-black text-[#1E3A00] tracking-wide">
                Banana Golden
              </span>
            </div>
            <div className="p-2 px-3 flex items-center justify-between">
              <div className="w-28 h-20 flex items-center justify-center overflow-hidden">
                <img 
                  src="/bumper_banana.jpg" 
                  alt="Banana Golden in wooden crate" 
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <div className="flex items-baseline gap-1 text-right pr-2">
                <span className="text-3xl font-extrabold text-neutral-800 tracking-tight">₹27</span>
                <span className="text-[11px] font-bold text-neutral-600 uppercase">(500G)</span>
              </div>
            </div>
          </div>

          {/* Order Now Button */}
          <div className="pt-1 pb-1 text-center">
            <button
              type="button"
              onClick={handleOrderNow}
              className="w-[82%] py-2.5 bg-[#5B21B6] hover:bg-[#4C1D95] active:scale-95 text-white text-base font-extrabold tracking-wider uppercase rounded-full shadow-lg shadow-purple-900/30 transition-all duration-150 inline-block"
            >
              Order Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
