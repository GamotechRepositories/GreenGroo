import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HomeDeliveryBar, HomeSearchBar } from "./HomeMobileHeader";
import HomeCategoryStrip from "./HomeCategoryStrip";

function HomeStickyCategories() {
  const deliveryRef = useRef(null);
  const stickyRef = useRef(null);
  const [isFixed, setIsFixed] = useState(false);
  const [stickyHeight, setStickyHeight] = useState(0);

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
    <>
      <div ref={deliveryRef}>
        <HomeDeliveryBar />
      </div>

      <div style={{ height: stickyHeight || undefined }} className={stickyHeight ? "" : "min-h-[100px]"}>
        <div
          ref={stickyRef}
          className={
            isFixed
              ? "fixed left-0 right-0 top-0 z-50 bg-white pt-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              : "relative bg-white"
          }
        >
          <HomeSearchBar />
          <HomeCategoryStrip />
        </div>
      </div>
    </>
  );
}

export default HomeStickyCategories;
