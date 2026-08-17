import React from "react";
import { useSearchParams } from "react-router-dom";
import GreenGroccShopBanner from "../../sections/GreenGrocc/components/GreenGroccShopBanner";
import Ready2CookShopBanner from "../../sections/Ready2Cook/components/Ready2CookShopBanner";
import SuperMallShopBanner from "../../sections/SuperMall/components/SuperMallShopBanner";

export default function ShopTopSlidingBanners() {
  const [searchParams] = useSearchParams();
  const storeParam = searchParams.get("store")?.trim()?.toLowerCase() || "";

  if (storeParam === "mall") {
    return <SuperMallShopBanner />;
  }

  if (storeParam === "festive") {
    return <Ready2CookShopBanner />;
  }

  return <GreenGroccShopBanner />;
}
