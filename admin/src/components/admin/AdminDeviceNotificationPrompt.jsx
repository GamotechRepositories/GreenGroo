import { useState } from "react";
import { useAdminNotifications } from "../../context/AdminNotificationContext";
import { requestBrowserNotificationPermission } from "../../utils/adminNotificationUtils";

const DISMISS_KEY = "bmm_admin_device_notif_prompt_dismissed";

function AdminDeviceNotificationPrompt() {
  const { browserNotificationPermission, setBrowserNotificationPermission } = useAdminNotifications();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");

  if (dismissed || browserNotificationPermission === "granted" || browserNotificationPermission === "unsupported") {
    return null;
  }

  const handleEnable = async () => {
    const permission = await requestBrowserNotificationPermission();
    setBrowserNotificationPermission(permission);
    if (permission === "granted") {
      setDismissed(true);
      localStorage.setItem(DISMISS_KEY, "1");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-950">Get order alerts on this device</p>
          <p className="mt-0.5 text-sm text-amber-900/90">
            {browserNotificationPermission === "denied"
              ? "Notifications are blocked. Allow them in your browser settings to receive new orders on this device."
              : "New orders will appear as system notifications on this device, not inside the admin panel."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {browserNotificationPermission === "default" ? (
            <button
              type="button"
              onClick={handleEnable}
              className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Enable on this device
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-950 transition hover:bg-amber-100"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDeviceNotificationPrompt;
