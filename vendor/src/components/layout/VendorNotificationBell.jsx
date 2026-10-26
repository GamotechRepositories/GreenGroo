import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import {
  formatNotificationTime,
  notificationMeta,
  useVendorNotifications,
} from "../../context/VendorNotificationsContext";

const PREVIEW_COUNT = 6;

export default function VendorNotificationBell() {
  const { items, unreadCount, markRead, markAllRead } = useVendorNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const preview = items.slice(0, PREVIEW_COUNT);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-emerald-50 hover:text-emerald-700"
        title={`Notifications (${unreadCount} unread)`}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <div>
              <p className="text-sm font-bold text-slate-900">Notifications</p>
              <p className="text-[11px] text-slate-500">
                {unreadCount ? `${unreadCount} unread` : "You're all caught up"} · last 7 days
              </p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            ) : null}
          </div>

          {preview.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-slate-400">No notifications in the last 7 days.</p>
          ) : (
            <ul className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto">
              {preview.map((item) => {
                const meta = notificationMeta(item.kind, item.status);
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => !item.read && markRead(item.key)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        item.read ? "" : "bg-emerald-50/40"
                      }`}
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-slate-200" : meta.dot}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`rounded border px-1.5 py-px text-[9px] font-bold uppercase tracking-wide ${meta.tone}`}>
                            {meta.label}
                          </span>
                          <span className="text-[10px] tabular-nums text-slate-400">{formatNotificationTime(item)}</span>
                        </span>
                        <span className={`mt-1 block truncate text-[13px] ${item.read ? "font-medium text-slate-600" : "font-semibold text-slate-900"}`}>
                          {item.title}
                        </span>
                        {item.body ? <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{item.body}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            to="/vendor/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}
