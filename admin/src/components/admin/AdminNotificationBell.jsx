import { useEffect, useRef, useState } from "react";
import { useAdminNotifications } from "../../context/AdminNotificationContext";
import { requestBrowserNotificationPermission } from "../../utils/adminNotificationUtils";
import { AdminNotificationAlertList } from "./AdminNotificationToast";

function AdminNotificationBell() {
  const {
    recentAlerts,
    dismissAlert,
    clearAllAlerts,
    browserNotificationPermission,
    setBrowserNotificationPermission,
  } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleEnableDesktopNotifications = async () => {
    const permission = await requestBrowserNotificationPermission();
    setBrowserNotificationPermission(permission);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:border-accent hover:text-accent"
        aria-label="Admin notifications"
        title="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {recentAlerts.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {recentAlerts.length > 99 ? "99+" : recentAlerts.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed right-4 top-[3.75rem] z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl sm:absolute sm:right-0 sm:top-auto sm:mt-2 sm:w-[min(22rem,calc(100vw-2rem))]">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Notifications</p>
              <p className="text-xs text-neutral-500">
                {recentAlerts.length > 0
                  ? `${recentAlerts.length} unread update${recentAlerts.length === 1 ? "" : "s"}`
                  : "You're up to date"}
              </p>
            </div>
            {recentAlerts.length > 0 ? (
              <button
                type="button"
                onClick={clearAllAlerts}
                className="text-xs font-medium text-neutral-500 transition hover:text-neutral-800"
              >
                Clear
              </button>
            ) : null}
          </div>

          {browserNotificationPermission === "default" ? (
            <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
              <p className="text-xs text-neutral-600">
                Enable device notifications on this computer or phone to get new order alerts outside the admin panel.
              </p>
              <button
                type="button"
                onClick={handleEnableDesktopNotifications}
                className="mt-2 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                Enable order notifications on this device
              </button>
            </div>
          ) : null}

          {browserNotificationPermission === "denied" ? (
            <div className="border-b border-neutral-100 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-900">
                Order alerts are blocked. Allow notifications for this site in your browser or device settings.
              </p>
            </div>
          ) : null}

          <AdminNotificationAlertList alerts={recentAlerts} onDismiss={dismissAlert} />
        </div>
      ) : null}
    </div>
  );
}

export default AdminNotificationBell;
