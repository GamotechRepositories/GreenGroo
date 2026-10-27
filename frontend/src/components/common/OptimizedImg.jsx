import { useLayoutEffect, useRef, useState } from "react";
import { optimizedImageUrl } from "../../utils/optimizedImage";

const isRemote = (src) => typeof src === "string" && /^https?:\/\//i.test(src.trim());

/**
 * Drop-in `<img>` that requests remote images at the size they are drawn
 * (× devicePixelRatio) as compressed WebP. The requested size only grows, so a
 * resize never swaps in a blurrier copy.
 */
export default function OptimizedImg({ src, onError, ...props }) {
  const ref = useRef(null);
  const remote = isRemote(src);
  const [measured, setMeasured] = useState(null);
  const [failedSrc, setFailedSrc] = useState(null);
  const box = measured?.src === src ? measured : null;
  const failed = failedSrc === src;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!remote || !el) return undefined;
    const measure = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = el.getBoundingClientRect();
      const w = rect.width >= 4 ? Math.ceil(rect.width * dpr) : 0;
      const h = rect.height >= 4 ? Math.ceil(rect.height * dpr) : 0;
      setMeasured((prev) => {
        if (!prev || prev.src !== src) return { src, w, h };
        if (w <= prev.w && h <= prev.h) return prev;
        return { src, w: Math.max(w, prev.w), h: Math.max(h, prev.h) };
      });
    };
    if (typeof ResizeObserver === "undefined") {
      const frame = requestAnimationFrame(measure);
      return () => cancelAnimationFrame(frame);
    }
    // ResizeObserver also fires once right away with the initial size.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [src, remote]);

  let finalSrc = src;
  if (remote && !failed) {
    finalSrc = box ? optimizedImageUrl(src, { widthPx: box.w, heightPx: box.h }) : undefined;
  }

  return (
    <img
      ref={ref}
      src={finalSrc}
      onError={(event) => {
        // If the optimizer is unreachable, fall back to the original once.
        if (remote && !failed) {
          setFailedSrc(src);
          return;
        }
        onError?.(event);
      }}
      {...props}
    />
  );
}
