import { useEffect, useRef } from "react";

export function usePolling(fn, deps = [], intervalMs = 5000) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let stopped = false;
    const tick = () => {
      if (!stopped) fnRef.current();
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      stopped = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
