import { Link } from "react-router-dom";
import { formatNotificationTime } from "../../utils/adminNotificationUtils";

const TYPE_STYLES = {
  order_placed: "border-green-200 bg-green-50 text-green-900",
  order_attempted: "border-amber-200 bg-amber-50 text-amber-900",
  support: "border-blue-200 bg-blue-50 text-blue-900",
  payment: "border-violet-200 bg-violet-50 text-violet-900",
};

function AdminNotificationToast({ alert, onDismiss, onOpen }) {
  const styleClass = TYPE_STYLES[alert.type] || "border-neutral-200 bg-white text-neutral-900";

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 shadow-lg ${styleClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {alert.title ? <p className="text-sm font-semibold">{alert.title}</p> : null}
          <p className="mt-0.5 text-sm opacity-90">{alert.message}</p>
          {alert.link ? (
            <Link
              to={alert.link}
              onClick={onOpen || onDismiss}
              className="mt-2 inline-block text-sm font-semibold underline underline-offset-2"
            >
              View details
            </Link>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-current/70 transition hover:bg-black/5 hover:text-current"
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function AdminNotificationToasts({ toasts, onDismiss, onOpen }) {
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:w-auto">
      {toasts.map((toast) => (
        <AdminNotificationToast
          key={toast.id}
          alert={toast}
          onDismiss={() => onDismiss(toast.id)}
          onOpen={onOpen ? () => onOpen(toast.id) : undefined}
        />
      ))}
    </div>
  );
}

export function AdminNotificationAlertList({ alerts, onDismiss, emptyMessage = "No new notifications" }) {
  if (!alerts.length) {
    return <p className="px-4 py-6 text-center text-sm text-neutral-500">{emptyMessage}</p>;
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      {alerts.map((alert) => {
        const styleClass = alert.title
          ? TYPE_STYLES[alert.type] || "border-neutral-100 bg-neutral-50 text-neutral-900"
          : "border-neutral-100 bg-white text-black";

        return (
          <div
            key={alert.id}
            className={`border-b px-4 py-3 last:border-b-0 ${styleClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {alert.title ? <p className="text-sm font-semibold">{alert.title}</p> : null}
                {alert.title ? (
                  <>
                    <p className="mt-0.5 text-sm opacity-90">{alert.message}</p>
                    <p className="mt-1 text-xs opacity-70">{formatNotificationTime(alert.createdAt)}</p>
                    {alert.link ? (
                      <Link
                        to={alert.link}
                        onClick={() => onDismiss?.(alert.id)}
                        className="mt-2 inline-block text-sm font-semibold underline underline-offset-2"
                      >
                        Open
                      </Link>
                    ) : null}
                  </>
                ) : alert.link ? (
                  <>
                    <p className="truncate text-sm font-medium text-black">{alert.message}</p>
                    <Link
                      to={alert.link}
                      onClick={() => onDismiss?.(alert.id)}
                      className="mt-1 inline-block text-sm font-semibold text-black underline underline-offset-2"
                    >
                      Open
                    </Link>
                  </>
                ) : (
                  <p className="truncate text-sm font-medium text-black">{alert.message}</p>
                )}
              </div>
              {onDismiss ? (
                <button
                  type="button"
                  onClick={() => onDismiss(alert.id)}
                  className="shrink-0 rounded-md p-1 text-current/70 transition hover:bg-black/5 hover:text-current"
                  aria-label="Dismiss notification"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AdminNotificationToasts;
