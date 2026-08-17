import React from "react";
import { ShieldCheck, Sprout, Truck, Award } from "lucide-react";

export function GreenGroccFeaturedVendors() {
  return (
    <div className="rounded-2xl bg-emerald-950 p-4 sm:p-6 text-white shadow-md my-4">
      <div className="flex items-center gap-2 mb-2">
        <Sprout className="h-5 w-5 text-emerald-400" />
        <h3 className="text-base font-extrabold">Verified Nashik & Pune Farmers Co-op</h3>
      </div>
      <p className="text-xs text-emerald-200 leading-relaxed mb-4">
        100% Traceable organic produce harvested directly from certified small-holder farmers. Zero chemical pesticides.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2 rounded-xl bg-emerald-900/60 p-2.5 border border-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Lab Certified</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-900/60 p-2.5 border border-emerald-800">
          <Truck className="h-4 w-4 text-emerald-400" />
          <span>Same Day Harvest</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-900/60 p-2.5 border border-emerald-800">
          <Award className="h-4 w-4 text-emerald-400" />
          <span>Fair Farmer Pay</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-900/60 p-2.5 border border-emerald-800">
          <Sprout className="h-4 w-4 text-emerald-400" />
          <span>100% Organic</span>
        </div>
      </div>
    </div>
  );
}

export default GreenGroccFeaturedVendors;
