import { useEffect, useLayoutEffect, useRef } from "react";
import { createLiveTask } from "./liveClient";

/**
 * Run `load` on mount / when `deps` change, then again whenever the server
 * pushes changes to any data it read. Re-runs are served from the local
 * live cache, so they never hit the network. No timers, no polling.
 *
 * `load` receives `{ initial, silent }`: `silent` is true for pushed re-runs.
 */
export function useLive(load, deps = []) {
  const loadRef = useRef(load);
  useLayoutEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    const task = createLiveTask(({ initial }) => loadRef.current({ initial, silent: !initial }));
    task.run();
    return () => task.stop();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
