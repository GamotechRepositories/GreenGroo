import { useCallback, useEffect, useState } from "react";
import { detectCurrentLocation } from "../utils/detectCurrentLocation";

export function useCurrentStoreLocation({ auto = false } = {}) {
  const [location, setLocation] = useState(null);
  const [detecting, setDetecting] = useState(Boolean(auto));
  const [error, setError] = useState("");

  const detect = useCallback(async () => {
    setDetecting(true);
    setError("");
    try {
      const next = await detectCurrentLocation();
      setLocation(next);
      return next;
    } catch (err) {
      const message = err.message || "Could not detect current location";
      setError(message);
      throw err;
    } finally {
      setDetecting(false);
    }
  }, []);

  useEffect(() => {
    if (!auto) return undefined;
    detect().catch(() => {});
  }, [auto, detect]);

  return { location, detecting, error, detect };
}
