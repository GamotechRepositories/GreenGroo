import { useCallback, useEffect, useRef, useState } from "react";

export function useAutoScroll(scrollRef, options = {}) {
  const {
    enabled = true,
    speed = 0.75,
    interval = 24,
    resumeDelay = 2500,
  } = options;

  const [interactionPaused, setInteractionPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const resumeTimerRef = useRef(null);

  const pauseForInteraction = useCallback(() => {
    setInteractionPaused(true);
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      setInteractionPaused(false);
    }, resumeDelay);
  }, [resumeDelay]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const paused = interactionPaused || hoverPaused;

  useEffect(() => {
    if (!enabled || paused) return undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    const tick = () => {
      const element = scrollRef.current;
      if (!element) return;

      const maxScroll = element.scrollWidth - element.clientWidth;
      if (maxScroll <= 0) return;

      if (element.scrollLeft >= maxScroll - 1) {
        element.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      element.scrollLeft += speed;
    };

    const timerId = window.setInterval(tick, interval);
    return () => window.clearInterval(timerId);
  }, [enabled, paused, scrollRef, speed, interval]);

  const handlers = {
    onMouseEnter: () => setHoverPaused(true),
    onMouseLeave: () => setHoverPaused(false),
    onTouchStart: pauseForInteraction,
    onPointerDown: pauseForInteraction,
    onWheel: pauseForInteraction,
  };

  return { handlers, pauseForInteraction };
}
