import { useCallback, useState } from "react";
import { staffApi } from "../api/staffApi";
import { useLive } from "../realtime/useLive";

const EMPTY_SUMMARY = {
  total: 0,
  pending: 0,
  preparing: 0,
  ready: 0,
  readyToAssign: 0,
  offered: 0,
  onTheWay: 0,
  delivered: 0,
  cancelled: 0,
};

export function usePreOrders(params = {}) {
  const [data, setData] = useState({
    orders: [],
    stores: [],
    summary: EMPTY_SUMMARY,
    today: "",
    tomorrow: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const paramsKey = JSON.stringify(params);

  const load = useCallback(async () => {
    try {
      const res = await staffApi.preOrders(JSON.parse(paramsKey));
      setData({
        orders: Array.isArray(res.data?.orders) ? res.data.orders : [],
        stores: Array.isArray(res.data?.stores) ? res.data.stores : [],
        summary: res.data?.summary || EMPTY_SUMMARY,
        today: res.data?.today || "",
        tomorrow: res.data?.tomorrow || "",
      });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load pre-orders");
    } finally {
      setLoading(false);
    }
  }, [paramsKey]);

  useLive(load, [load]);

  return { ...data, loading, error, reload: load };
}
