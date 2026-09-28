import { useCallback, useState } from "react";
import { staffApi } from "../api/staffApi";
import { useLive } from "../realtime/useLive";

export function useInventoryRequests() {
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

  useLive(load, [load]);

  return { requests, loading, error, reload: load };
}
