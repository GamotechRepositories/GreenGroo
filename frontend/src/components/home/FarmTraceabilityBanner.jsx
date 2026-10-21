import React from "react";

export default function FarmTraceabilityBanner({ className = "" }) {
  return (
    <div className={`w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-white p-0 m-0 overflow-hidden select-none ${className}`}>
      <img
        src="/assets/payment/tracc.webp"
        alt="Direct from Farmers • 100% Organic • Full Traceability • Lab Tested • Fair Price — Farm-to-Doorstep Journey"
        className="w-full h-auto block object-cover object-center"
        loading="eager"
      />
    </div>
  );
}
