import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { vendorApi } from "../api/vendorApi";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const POLL_MS = 60 * 1000;

const VendorNotificationsContext = createContext(null);

function toTime(value) {
  if (!value) return NaN;
  const s = String(value);
  const t = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`).getTime() : new Date(s).getTime();
  return t;
}

/** Announcements + calendar entries (holidays, notes, shifts) for vendors, newest first, last 7 days + upcoming. */
function buildNotifications(announcements, calendar) {
  const announced = Array.isArray(announcements) ? announcements : [];
  const cal = Array.isArray(calendar) ? calendar : [];
  const seen = new Set(announced.map((row) => String(row._id || row.id || "")));

  const items = [
    ...announced.map((row) => ({
      sourceId: String(row._id || row.id || ""),
      kind: row.kind || row.category || "announcement",
      title: row.title || "Announcement",
      body: row.body || "",
      date: row.scheduledAt || row.publishedAt || row.createdAt || "",
      status: "published",
    })),
    ...cal
      .filter((row) => {
        const id = String(row.id || row._id || "");
        if (!id || seen.has(id)) return false;
        return !(row.status === "published" && ["announcement", "holiday", "note"].includes(row.kind || row.category));
      })
      .map((row) => ({
        sourceId: String(row.id || row._id),
        kind: row.kind || row.category || "announcement",
        title: row.title || "Update",
        body: row.body || "",
        date: row.date || row.createdAt || "",
        status: row.status || "",
      })),
  ]
    .filter((item) => item.sourceId)
    .map((item) => ({ ...item, key: `${item.kind}:${item.sourceId}`, time: toTime(item.date) }));

  const cutoff = Date.now() - WEEK_MS;
  return items
    .filter((item) => Number.isNaN(item.time) || item.time >= cutoff)
    .sort((a, b) => (Number.isNaN(b.time) ? 0 : b.time) - (Number.isNaN(a.time) ? 0 : a.time));
}

export function VendorNotificationsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    const [announcements, calendar, read] = await Promise.all([
      vendorApi.liveAnnouncements().catch(() => []),
      vendorApi.liveCalendar().catch(() => []),
      vendorApi.getNotificationReadState().catch(() => null),
    ]);
    if (!alive.current) return;
    setItems(buildNotifications(announcements, calendar));
    if (read) setReadIds(new Set(read));
    setLoading(false);
  }, []);

  useEffect(() => {
    alive.current = true;
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => {
      alive.current = false;
      clearInterval(timer);
    };
  }, [refresh]);

  const markRead = useCallback(async (keys) => {
    const list = (Array.isArray(keys) ? keys : [keys]).filter(Boolean);
    if (!list.length) return;
    setReadIds((prev) => new Set([...prev, ...list]));
    try {
      const saved = await vendorApi.markNotificationsRead(list);
      if (alive.current) setReadIds(new Set(saved));
    } catch {
      // keep the optimistic state; it is re-synced on the next refresh
    }
  }, []);

  const value = useMemo(() => {
    const withRead = items.map((item) => ({ ...item, read: readIds.has(item.key) }));
    const unread = withRead.filter((item) => !item.read);
    return {
      items: withRead,
      unreadCount: unread.length,
      loading,
      refresh,
      markRead,
      markAllRead: () => markRead(unread.map((item) => item.key)),
    };
  }, [items, readIds, loading, refresh, markRead]);

  return <VendorNotificationsContext.Provider value={value}>{children}</VendorNotificationsContext.Provider>;
}

export function useVendorNotifications() {
  const ctx = useContext(VendorNotificationsContext);
  if (!ctx) throw new Error("useVendorNotifications must be used inside VendorNotificationsProvider");
  return ctx;
}

export function notificationMeta(kind, status) {
  if (kind === "holiday") return { label: "Holiday", tone: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" };
  if (kind === "shift") return { label: "Shift", tone: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" };
  if (kind === "note") return { label: "Note", tone: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" };
  if (status === "scheduled") return { label: "Upcoming", tone: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
  return { label: "Announcement", tone: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" };
}

export function formatNotificationTime(item) {
  if (Number.isNaN(item.time)) return "";
  const diff = Date.now() - item.time;
  if (diff < 0) {
    return `On ${new Date(item.time).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  }
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}
