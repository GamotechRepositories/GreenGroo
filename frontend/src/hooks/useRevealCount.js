import { useEffect, useRef, useState } from "react";

const supportsObserver = () => typeof window !== "undefined" && "IntersectionObserver" in window;

/**
 * For long grids/rows: renders `step` items, then `step` more each time the
 * returned sentinel ref (placed after the items) nears the viewport.
 * Returns `[count, sentinelRef]`; render the sentinel only while count < total.
 */
export function useRevealCount(total, step = 12, rootMargin = "600px 0px") {
  const [count, setCount] = useState(step);
  const sentinelRef = useRef(null);
  const done = count >= total;

  useEffect(() => {
    if (done || !supportsObserver()) return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setCount((c) => c + step);
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [done, step, rootMargin, count]);

  return [supportsObserver() ? Math.min(count, total) : total, sentinelRef];
}
