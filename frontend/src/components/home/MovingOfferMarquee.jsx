import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Leaf, Zap, CreditCard } from "lucide-react";

export const STRIP_OFFERS = [
  {
    id: "welcome50",
    icon: Sparkles,
    highlight: "Flat 50% Off",
    description: "on your first 3 orders",
    code: "CODE: FRESH50",
    link: "/coupons",
  },
  {
    id: "organic-coop",
    icon: Leaf,
    highlight: "100% Certified Organic",
    description: "direct from Nashik farmers co-op",
    code: "FARM FRESH",
    link: "/product?categoryName=Organic",
  },
  {
    id: "express-free",
    icon: Zap,
    highlight: "Free 10-Min Delivery",
    description: "on all orders above ₹99",
    code: "NO CODE",
    link: "/product",
  },
  {
    id: "sbi-bank",
    icon: CreditCard,
    highlight: "10% Instant Discount",
    description: "with SBI Cards up to ₹100",
    code: "AUTO-APPLY",
    link: "/coupons",
  },
];

export default function MovingOfferMarquee() {
  return null;
}

