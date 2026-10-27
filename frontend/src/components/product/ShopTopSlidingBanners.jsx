import React from "react";
import { useSearchParams } from "react-router-dom";
import GreenGroccShopBanner from "../../sections/GreenGrocc/components/GreenGroccShopBanner";
import { useSectionBanners } from "../../hooks/queries/useSectionBanners";

/** Slides come from admin → Banners → <section> → Shop page banner; `store` defaults to `?store=`. */
export default function ShopTopSlidingBanners({ store }) {
  const [searchParams] = useSearchParams();
  const banners = useSectionBanners(store ?? searchParams.get("store"), "shop");

  return (
    <>
      <div className="hidden lg:block">
        <GreenGroccShopBanner banners={banners.desktop} />
      </div>
      <div className="lg:hidden">
        <GreenGroccShopBanner banners={banners.mobile} matchOfferSizeOnMobile />
      </div>
    </>
  );
}
