import { useEffect, useRef, useState } from "react";

const supportsObserver = () => typeof window !== "undefined" && "IntersectionObserver" in window;

/**
 * Mounts `children` (and so starts their data queries) only when this slot is
 * within `rootMargin` of the viewport — i.e. what is on screen plus roughly the
 * next screen. Once mounted it stays mounted.
 */
export default function LazySection({ children, minHeight = 260, rootMargin = "800px 0px", className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => !supportsObserver());

  useEffect(() => {
    if (visible) return undefined;
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  if (visible) return children;
  return <div ref={ref} className={className} style={{ minHeight }} aria-hidden="true" />;
}
