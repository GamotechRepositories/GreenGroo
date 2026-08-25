import { useCallback, useEffect, useState } from "react";
import { staffApi } from "../api/staffApi";

export function useInventoryRequests(pollMs = 10000) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await staffApi.inventoryRequests();
      setRequests(Array.isArray(res.data?.requests) ? res.data.requests : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inventory requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (!pollMs) return undefined;
    const timer = window.setInterval(load, pollMs);
    return () => window.clearInterval(timer);
  }, [load, pollMs]);

  return { requests, loading, error, reload: load };
}
