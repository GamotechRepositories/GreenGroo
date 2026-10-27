import { useEffect, useLayoutEffect, useRef } from "react";
import { createLiveTask } from "../realtime/liveClient";

// Re-runs often return identical data; keeping the previous reference lets React skip re-rendering.
export function keepIfSame(prev, next) {
  if (prev === next) return prev;
  try {
    return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
  } catch {
    return next;
  }
}

const SAFETY_RERUN_MS = 60000;

/**
 * Run `fn` now, then again whenever the server pushes a change to data it read
 * (see useLive). Pushed re-runs are served from the local live cache, so they
 * cost no request. The slow interval only matters for endpoints that are not
 * live; for live ones it is also answered from the cache.
 */
export function usePolling(fn, deps = [], intervalMs = 5000) {
  const fnRef = useRef(fn);
  useLayoutEffect(() => {
    fnRef.current = fn;
  });
  useEffect(() => {
    const task = createLiveTask(() => fnRef.current());
    task.run();
    const id = setInterval(() => {
      if (!document.hidden) task.run();
    }, Math.max(intervalMs, SAFETY_RERUN_MS));
    return () => {
      clearInterval(id);
      task.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
