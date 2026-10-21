import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { sectionToStoreKey } from "../grocery/HomeMobileHeader";
import { ArrowRight, Sparkles, ChefHat } from "lucide-react";

const PREORDER_PROMOS = [
  {
    to: "/product?categoryName=Vegetables",
    eyebrow: "FARM FRESH",
    title: "Fresh Vegetables",
    subtitle: "From farm directly to your kitchen",
    className:
      "bg-gradient-to-br from-[#0c4e2a] via-[#0e5c33] to-[#07361c] text-white border border-emerald-500/25",
    chipClass: "bg-emerald-400/20 text-emerald-200 border border-emerald-400/30",
    icon: Sparkles,
  },
  {
    to: "/product?categoryName=Fruits",
    eyebrow: "SEASONAL PICKS",
    title: "Juicy Fresh Fruits",
    subtitle: "Naturally tree-ripened, hand-sorted",
    className:
      "bg-gradient-to-br from-[#093c2b] via-[#0d4f39] to-[#062c1f] text-white border border-teal-500/25",
    chipClass: "bg-teal-400/20 text-teal-200 border border-teal-400/30",
    icon: Sparkles,
  },
];

const READY2COOK_PROMOS = [
  {
    to: "/product?store=festive&categoryName=Chopped%20Vegies",
    eyebrow: "PREP-FREE INGREDIENTS",
    title: "Chopped & Ready to Cook",
    subtitle: "Hygienically pre-washed, precision-cut veggies ready in minutes",
    className:
      "bg-gradient-to-br from-[#0a3820] via-[#0d4b2b] to-[#062816] text-white border border-emerald-500/30 shadow-md shadow-emerald-950/20",
    chipClass: "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30",
    icon: ChefHat,
    buttonText: "Shop Chopped Veggies",
  },
  {
    to: "/product?store=festive&categoryName=Veggie%20%26%20Bhaji%20Mix",
    eyebrow: "CURATED MEAL KITS",
    title: "Combo Packs & Sabzi Mixes",
    subtitle: "All-in-one recipe packs for authentic daily curries and stir-fries",
    className:
      "bg-gradient-to-br from-[#072f26] via-[#0b4236] to-[#042019] text-white border border-teal-500/30 shadow-md shadow-teal-950/20",
    chipClass: "bg-teal-400/15 text-teal-300 border border-teal-400/30",
    icon: Sparkles,
    buttonText: "Explore Combo Packs",
  },
];

const INSTANT_PROMOS = [
  {
    to: "/product?store=mall&categoryName=SuperMall%20Packaged%20Grocery",
    eyebrow: "10-MIN EXPRESS",
    title: "Instant Grocery Essentials",
    subtitle: "Pantry staples and daily necessities delivered in minutes",
    className:
      "bg-gradient-to-br from-[#0c2a4d] via-[#103a6b] to-[#081e38] text-white border border-blue-500/30",
    chipClass: "bg-blue-400/20 text-blue-200 border border-blue-400/30",
    icon: Sparkles,
    buttonText: "Shop Essentials",
  },
  {
    to: "/product?store=mall&categoryName=SuperMall%20Snacks%20%26%20Munchies",
    eyebrow: "QUICK CRAVINGS",
    title: "Snacks, Munchies & Drinks",
    subtitle: "Ready-to-eat treats and beverages delivered fresh",
    className:
      "bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#0f172a] text-white border border-slate-500/30",
    chipClass: "bg-slate-400/20 text-slate-200 border border-slate-400/30",
    icon: Sparkles,
    buttonText: "Shop Snacks",
  },
];

function promosForStore(store) {
  if (store === "mall") return INSTANT_PROMOS;
  if (store === "festive") return READY2COOK_PROMOS;
  return [];
}

export default function Ready2CookHotPickBanners() {
  return null;
}

