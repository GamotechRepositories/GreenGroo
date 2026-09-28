import { useEffect, useRef } from "react";

// Polling results are usually identical; keeping the previous reference lets React skip re-rendering.
export function keepIfSame(prev, next) {
  if (prev === next) return prev;
  try {
    return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
  } catch {
    return next;
  }
}

export function usePolling(fn, deps = [], intervalMs = 5000) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let stopped = false;
    const tick = () => {
      if (!stopped) fnRef.current();
    };
    tick();
    const id = setInterval(() => {
      if (!document.hidden) tick();
    }, intervalMs);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
