import { useEffect, useRef, useState } from "react";

const SCROLL_THRESHOLD = 10;

/**
 * Returns `true` when the user is scrolling down (past 80px),
 * `false` when scrolling up.
 */
export function useScrollDirection() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastScrollY.current;

        if (diff > SCROLL_THRESHOLD && currentY > 80) {
          setHidden(true);
        } else if (diff < -SCROLL_THRESHOLD) {
          setHidden(false);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return hidden;
}
