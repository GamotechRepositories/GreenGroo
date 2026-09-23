import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HomeDeliveryBar, HomeSearchBar, sectionToStoreKey } from "./HomeMobileHeader";
import { resolveStoreTheme } from "./homeHeaderThemes";
import HomeCategoryStrip from "./HomeCategoryStrip";

function HomeStickyCategories() {
  const deliveryRef = useRef(null);
  const stickyRef = useRef(null);
  const [isFixed, setIsFixed] = useState(false);
  const [stickyHeight, setStickyHeight] = useState(0);
  const [searchParams] = useSearchParams();
  const currentStore = sectionToStoreKey(searchParams.get("store"));
  const theme = resolveStoreTheme(currentStore);

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

  const stickyBg = theme.searchBg || theme.deliveryBg;

  return (
    <div className={`${theme.deliveryBg} border-none pb-0 pt-0 transition-colors duration-300`}>
      <div ref={deliveryRef} className="bg-transparent">
        <HomeDeliveryBar />
      </div>

      <div style={{ height: stickyHeight || undefined }} className={stickyHeight ? "" : "min-h-[72px]"}>
        <div
          ref={stickyRef}
          className={
            isFixed
              ? `fixed left-0 right-0 top-0 z-50 ${stickyBg} border-b border-black/5 pt-0 transition-all`
              : `relative ${stickyBg} pt-0`
          }
        >
          <HomeSearchBar />
          <HomeCategoryStrip hideIcons={isFixed} />
        </div>
      </div>

    </div>
  );
}

export default HomeStickyCategories;

