import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HomeDeliveryBar, HomeSearchBar, ZeptoPromoSection } from "./HomeMobileHeader";
import HomeCategoryStrip from "./HomeCategoryStrip";

function HomeStickyCategories() {
  const deliveryRef = useRef(null);
  const stickyRef = useRef(null);
  const [isFixed, setIsFixed] = useState(false);
  const [stickyHeight, setStickyHeight] = useState(0);
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";

  const containerBg = currentStore === "festive" ? "bg-[#910C0C]" : currentStore === "fresh" ? "bg-[#047857]" : "bg-[#FFF3E0]";

  useLayoutEffect(() => {
    const sticky = stickyRef.current;
    if (!sticky) return undefined;

    const updateHeight = () => setStickyHeight(sticky.offsetHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(sticky);
    return () => observer.disconnect();
  }, [isFixed]);

  useEffect(() => {
    const onScroll = () => {
      const delivery = deliveryRef.current;
      if (!delivery) return;
      setIsFixed(delivery.getBoundingClientRect().bottom <= 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className={`${containerBg} transition-colors duration-300`}>
      <div ref={deliveryRef}>
        <HomeDeliveryBar />
      </div>

      <div style={{ height: stickyHeight || undefined }} className={stickyHeight ? "" : "min-h-[100px]"}>
        <div
          ref={stickyRef}
          className={
            isFixed
              ? `fixed left-0 right-0 top-0 z-50 ${containerBg} pt-1 shadow-md border-b border-white/20 transition-all`
              : `relative ${containerBg}`
          }
        >
          <HomeSearchBar />
          <HomeCategoryStrip />
        </div>
      </div>

      <ZeptoPromoSection />
    </div>
  );
}

export default HomeStickyCategories;

