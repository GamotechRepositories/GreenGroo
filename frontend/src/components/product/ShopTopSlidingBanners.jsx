import React from "react";
import { useSearchParams } from "react-router-dom";
import GreenGroccShopBanner from "../../sections/GreenGrocc/components/GreenGroccShopBanner";

const MOBILE_SHOP_BANNERS = [
  {
    id: "mobile-preorder-festive",
    image: "/assets/payment/preorder%20banner%20mobile%20view%202.png",
    alt: "Festive Season Special. Fresh Fruits & Veggies from ₹9",
    link: "/product",
  },
  {
    id: "mobile-preorder-farm-fresh",
    image: "/assets/payment/fresh_fruits_vegetables_banner_2.png",
    alt: "Fresh Fruits & Vegetables. Naturally Grown. Order Now",
    link: "/product",
  },
];

export default function ShopTopSlidingBanners() {
  const [searchParams] = useSearchParams();
  const store = searchParams.get("store")?.trim().toLowerCase() || "";
  const isMainShop = !store || store === "main" || store === "fresh" || store === "preorder" || store === "greengrocc";

  if (!isMainShop) {
    return <GreenGroccShopBanner matchOfferSizeOnMobile />;
  }

  return (
    <>
      <div className="hidden lg:block">
        <GreenGroccShopBanner />
      </div>
      <div className="lg:hidden">
        <GreenGroccShopBanner banners={MOBILE_SHOP_BANNERS} matchOfferSizeOnMobile />
      </div>
    </>
  );
}
