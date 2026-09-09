import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const MIN_SCALE = 0.18;
const MAX_SCALE = 3.2;
const DESKTOP_MQ = "(min-width: 768px)";

function touchDistance(a, b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function clampScale(n) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, n));
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(DESKTOP_MQ).matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

export default function SpreadsheetViewport({ children, className = "" }) {
  const isDesktop = useIsDesktop();
  const scrollerRef = useRef(null);
  const contentRef = useRef(null);
  const scaleRef = useRef(1);
  const fittedRef = useRef(1);
  const pinchRef = useRef(null);
  const lastTapRef = useRef(0);
  const userZoomedRef = useRef(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isDesktop) return;
    userZoomedRef.current = false;
    scaleRef.current = 1;
    fittedRef.current = 1;
    setScale(1);
  }, [isDesktop]);

  const commitScale = useCallback((next, origin, fromUser = true) => {
    if (window.matchMedia(DESKTOP_MQ).matches) return;
    const clamped = clampScale(next);
    const scroller = scrollerRef.current;
    const prev = scaleRef.current;
    if (fromUser) userZoomedRef.current = true;
    if (scroller && origin && prev > 0 && clamped !== prev) {
      const ratio = clamped / prev;
      scroller.scrollLeft = (scroller.scrollLeft + origin.x) * ratio - origin.x;
      scroller.scrollTop = (scroller.scrollTop + origin.y) * ratio - origin.y;
    }
    scaleRef.current = clamped;
    setScale(clamped);
  }, []);

  useLayoutEffect(() => {
    if (isDesktop) return undefined;
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return undefined;

    const fitSheet = () => {
      if (userZoomedRef.current) return;
      const z = scaleRef.current || 1;
      const rect = content.getBoundingClientRect();
      const w = rect.width / z;
      if (w < 8) return;
      const next = clampScale((scroller.clientWidth - 2) / w);
      if (Math.abs(next - scaleRef.current) < 0.006) {
        fittedRef.current = scaleRef.current;
        return;
      }
      fittedRef.current = next;
      scaleRef.current = next;
      setScale(next);
    };

    fitSheet();
    const ro = new ResizeObserver(fitSheet);
    ro.observe(content);
    ro.observe(scroller);
    window.addEventListener("orientationchange", fitSheet);
    window.addEventListener("resize", fitSheet);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", fitSheet);
      window.removeEventListener("resize", fitSheet);
    };
  }, [children, isDesktop]);

  useLayoutEffect(() => {
    if (isDesktop) return undefined;
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;

    const onTouchStart = (e) => {
      if (e.touches.length !== 2) {
        pinchRef.current = null;
        return;
      }
      pinchRef.current = {
        dist: touchDistance(e.touches[0], e.touches[1]),
        scale: scaleRef.current,
      };
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 2 || !pinchRef.current?.dist) return;
      e.preventDefault();
      const dist = touchDistance(e.touches[0], e.touches[1]);
      const rect = scroller.getBoundingClientRect();
      commitScale(pinchRef.current.scale * (dist / pinchRef.current.dist), {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top,
      });
    };

    const onTouchEnd = (e) => {
      pinchRef.current = null;
      if (e.touches.length > 0) return;
      if (e.target?.closest?.("a, button")) return;
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        const rect = scroller.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const origin = touch
          ? { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
          : { x: scroller.clientWidth / 2, y: scroller.clientHeight / 2 };
        const fitted = fittedRef.current || 1;
        const zoomed = clampScale(fitted * 2.2);
        commitScale(scaleRef.current > fitted * 1.15 ? fitted : zoomed, origin);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    };

    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchmove", onTouchMove, { passive: false });
    scroller.addEventListener("touchend", onTouchEnd);
    scroller.addEventListener("touchcancel", onTouchEnd);
    return () => {
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
      scroller.removeEventListener("touchend", onTouchEnd);
      scroller.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [commitScale, isDesktop]);

  if (isDesktop) {
    return (
      <div className={`relative w-full overflow-x-hidden ${className}`}>
        <div className="w-full overflow-x-hidden">{children}</div>
      </div>
    );
  }

  return (
    <div className={`relative -mx-3 w-[calc(100%+1.5rem)] overflow-hidden ${className}`}>
      <div
        ref={scrollerRef}
        className="farmer-scrollbar h-[min(78dvh,calc(100dvh-9.5rem))] w-full overflow-auto overscroll-contain bg-[#f3f6f4]"
      >
        <div ref={contentRef} className="w-max origin-top-left" style={{ zoom: scale }}>
          {children}
        </div>
      </div>
    </div>
  );
}
