import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  createAdminInboxAlert,
  getAdminInboxAlerts,
  getAdminInboxSummary,
  markAdminInboxAlertRead,
  markAllAdminInboxAlertsRead,
} from "../api/api";
import { useAuth } from "./AuthContext";
import {
  isOrderNotificationType,
  playAdminNotificationSound,
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from "../utils/adminNotificationUtils";

const STORAGE_KEYS = {
  support: "bmm_admin_support_last_seen",
  ordersPlaced: "bmm_admin_orders_placed_last_seen",
  ordersAttempted: "bmm_admin_orders_attempted_last_seen",
  payments: "bmm_admin_payments_last_seen",
  legacyOrders: "bmm_admin_orders_last_seen",
};
const POLL_INTERVAL_VISIBLE_MS = 10000;
const POLL_INTERVAL_HIDDEN_MS = 30000;
const TOAST_DURATION_MS = 7000;
const MAX_RECENT_ALERTS = 30;

const AdminNotificationContext = createContext(null);

function readLastSeenAt(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function writeLastSeenAt(key) {
  localStorage.setItem(key, new Date().toISOString());
}

function migrateLegacyOrderLastSeen() {
  const legacy = localStorage.getItem(STORAGE_KEYS.legacyOrders);
  if (!legacy) return;

  if (!localStorage.getItem(STORAGE_KEYS.ordersPlaced)) {
    localStorage.setItem(STORAGE_KEYS.ordersPlaced, legacy);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ordersAttempted)) {
    localStorage.setItem(STORAGE_KEYS.ordersAttempted, legacy);
  }
}

function buildAlert({ type, title, message, link, order = null, eventKey = "" }) {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    message,
    link,
    order,
    eventKey,
    createdAt: new Date().toISOString(),
  };
}

function getAlertMeta(type, count, customerName = "") {
  const suffix = count > 1 ? ` (${count} new)` : "";
  const moreSuffix = count > 1 ? ` (+${count - 1} more)` : "";

  if (type === "order_placed") {
    return {
      title: "Order confirmed",
      message: customerName
        ? `${customerName} confirmed an order${moreSuffix}`
        : `A customer confirmed an order${suffix}`,
      link: "/orders?status=confirm",
    };
  }

  if (type === "order_attempted") {
    return {
      title: "Order attempt",
      message: customerName
        ? `${customerName} attempted an order${moreSuffix}`
        : `A customer attempted an order${suffix}`,
      link: "/orders?status=attempted",
    };
  }

  if (type === "support") {
    return {
      title: "New support inquiry",
      message: `A customer submitted a support message${suffix}.`,
      link: "/support",
    };
  }

  return {
    title: "New payment proof",
    message: `A new payment proof was uploaded${suffix}.`,
    link: "/payments",
  };
}

export function AdminNotificationProvider({ children }) {
  const { adminUser } = useAuth();
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [hasUnreadOrdersPlaced, setHasUnreadOrdersPlaced] = useState(false);
  const [unreadOrdersPlacedCount, setUnreadOrdersPlacedCount] = useState(0);
  const [hasUnreadOrdersAttempted, setHasUnreadOrdersAttempted] = useState(false);
  const [unreadOrdersAttemptedCount, setUnreadOrdersAttemptedCount] = useState(0);
  const [hasUnreadPayments, setHasUnreadPayments] = useState(false);
  const [unreadPaymentCount, setUnreadPaymentCount] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  const previousCountsRef = useRef(null);
  const hasLoadedCountsRef = useRef(false);
  const seenPlacedKeysRef = useRef(new Set());
  const seenAttemptedKeysRef = useRef(new Set());
  const toastTimersRef = useRef(new Map());
  const dismissedAlertIdsRef = useRef(new Set());

  const hasUnreadOrders =
    hasUnreadOrdersPlaced || hasUnreadOrdersAttempted;
  const unreadOrderCount = unreadOrdersPlacedCount + unreadOrdersAttemptedCount;
  const panelUnreadCount = unreadSupportCount + unreadPaymentCount;

  const getOrderEventKey = useCallback((order, preferUpdated = false) => {
    const stamp = preferUpdated
      ? order.updatedAt || order.createdAt
      : order.createdAt || order.updatedAt;
    return `${order.id}:${stamp}`;
  }, []);

  const persistAlert = useCallback(async (alert) => {
    try {
      const { data } = await createAdminInboxAlert({
        type: alert.type,
        title: alert.title,
        message: alert.message,
        link: alert.link,
        order: alert.order,
        eventKey: alert.eventKey,
      });
      const storedAlert = data.data;

      if (dismissedAlertIdsRef.current.has(alert.id)) {
        await markAdminInboxAlertRead(storedAlert.id);
        dismissedAlertIdsRef.current.delete(alert.id);
        return;
      }

      if (storedAlert.isRead) {
        setRecentAlerts((prev) => prev.filter((item) => item.id !== alert.id));
        setToasts((prev) => prev.filter((item) => item.id !== alert.id));
        return;
      }

      setRecentAlerts((prev) =>
        prev.map((item) => (item.id === alert.id ? storedAlert : item))
      );
      setToasts((prev) =>
        prev.map((item) => (item.id === alert.id ? storedAlert : item))
      );
    } catch {
      // Keep the in-memory alert when database persistence is temporarily unavailable.
    }
  }, []);

  const pushOrderEventAlert = useCallback((type, order) => {
    const action = type === "order_placed" ? "confirmed" : "attempted";
    const eventTime = type === "order_attempted"
      ? order.updatedAt || order.createdAt
      : order.createdAt;
    const time = new Date(eventTime).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
    const message = `${order.customerName} ${action} order at ${time}`;
    const link = order.id
      ? `/orders/${order.id}`
      : type === "order_placed"
        ? "/orders?status=confirm"
        : "/orders?status=attempted";
    const eventKey = `${type}:${getOrderEventKey(order, type === "order_attempted")}`;
    const alert = buildAlert({
      type,
      title: "",
      message,
      link,
      order: order.id || null,
      eventKey,
    });

    setRecentAlerts((prev) => [alert, ...prev].slice(0, MAX_RECENT_ALERTS));
    setToasts((prev) => [alert, ...prev].slice(0, 5));
    persistAlert(alert);

    playAdminNotificationSound();
    showBrowserNotification({
      title: message,
      body: "",
      link,
      id: alert.id,
      requireInteraction: true,
    });
  }, [getOrderEventKey, persistAlert]);

  const pushDeviceOrderAlert = useCallback((type, count, customerName = "") => {
    const meta = getAlertMeta(type, count, customerName);
    const alert = buildAlert({ type, ...meta });

    setRecentAlerts((prev) => [alert, ...prev].slice(0, MAX_RECENT_ALERTS));
    setToasts((prev) => [alert, ...prev].slice(0, 3));
    persistAlert(alert);

    const timerId = window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== alert.id));
      toastTimersRef.current.delete(alert.id);
    }, TOAST_DURATION_MS);
    toastTimersRef.current.set(alert.id, timerId);

    playAdminNotificationSound();
    showBrowserNotification({
      title: meta.title,
      body: meta.message,
      link: meta.link,
      id: alert.id,
      requireInteraction: true,
    });
  }, [persistAlert]);

  const pushPanelAlert = useCallback((type, count, customerName = "") => {
    const meta = getAlertMeta(type, count, customerName);
    const alert = buildAlert({ type, ...meta });

    setRecentAlerts((prev) => [alert, ...prev].slice(0, MAX_RECENT_ALERTS));
    setToasts((prev) => [alert, ...prev].slice(0, 3));
    persistAlert(alert);

    const timerId = window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== alert.id));
      toastTimersRef.current.delete(alert.id);
    }, TOAST_DURATION_MS);
    toastTimersRef.current.set(alert.id, timerId);

    playAdminNotificationSound();
    showBrowserNotification({
      title: meta.title,
      body: meta.message,
      link: meta.link,
      id: alert.id,
    });
  }, [persistAlert]);

  const pushAlert = useCallback(
    (type, count, customerName = "") => {
      if (isOrderNotificationType(type)) {
        pushDeviceOrderAlert(type, count, customerName);
        return;
      }
      pushPanelAlert(type, count, customerName);
    },
    [pushDeviceOrderAlert, pushPanelAlert]
  );

  const refreshUnread = useCallback(async () => {
    if (adminUser?.role !== "admin") {
      setHasUnreadSupport(false);
      setUnreadSupportCount(0);
      setHasUnreadOrdersPlaced(false);
      setUnreadOrdersPlacedCount(0);
      setHasUnreadOrdersAttempted(false);
      setUnreadOrdersAttemptedCount(0);
      setHasUnreadPayments(false);
      setUnreadPaymentCount(0);
      setRecentAlerts([]);
      setToasts([]);
      previousCountsRef.current = null;
      hasLoadedCountsRef.current = false;
      seenPlacedKeysRef.current = new Set();
      seenAttemptedKeysRef.current = new Set();
      return;
    }

    migrateLegacyOrderLastSeen();

    try {
      const params = {
        supportSince: readLastSeenAt(STORAGE_KEYS.support) || undefined,
        placedSince: readLastSeenAt(STORAGE_KEYS.ordersPlaced) || undefined,
        attemptedSince: readLastSeenAt(STORAGE_KEYS.ordersAttempted) || undefined,
        paymentSince: readLastSeenAt(STORAGE_KEYS.payments) || undefined,
      };

      const [summaryResponse, alertsResponse] = await Promise.all([
        getAdminInboxSummary(params),
        getAdminInboxAlerts(),
      ]);
      const { data } = summaryResponse;
      setRecentAlerts(alertsResponse.data.data || []);
      const supportCount = data.data?.support?.count || 0;
      const placedCount = data.data?.orders?.placedCount || 0;
      const attemptedCount = data.data?.orders?.attemptedCount || 0;
      const paymentCount = data.data?.payments?.count || 0;
      const recentPlaced = data.data?.orders?.recentPlaced || [];
      const recentAttempted = data.data?.orders?.recentAttempted || [];

      const nextCounts = {
        support: supportCount,
        placed: placedCount,
        attempted: attemptedCount,
        payments: paymentCount,
      };

      if (hasLoadedCountsRef.current && previousCountsRef.current) {
        const previous = previousCountsRef.current;

        if (supportCount > previous.support) {
          pushAlert("support", supportCount - previous.support);
        }

        const newPlaced = recentPlaced
          .filter((order) => {
            const key = getOrderEventKey(order, false);
            if (seenPlacedKeysRef.current.has(key)) return false;
            seenPlacedKeysRef.current.add(key);
            return true;
          })
          .reverse();
        newPlaced.forEach((order) => pushOrderEventAlert("order_placed", order));

        const newAttempted = recentAttempted
          .filter((order) => {
            const key = getOrderEventKey(order, true);
            if (seenAttemptedKeysRef.current.has(key)) return false;
            seenAttemptedKeysRef.current.add(key);
            return true;
          })
          .reverse();
        newAttempted.forEach((order) => pushOrderEventAlert("order_attempted", order));

        if (paymentCount > previous.payments) {
          pushAlert("payment", paymentCount - previous.payments);
        }
      } else {
        recentPlaced.forEach((order) => {
          seenPlacedKeysRef.current.add(getOrderEventKey(order, false));
        });
        recentAttempted.forEach((order) => {
          seenAttemptedKeysRef.current.add(getOrderEventKey(order, true));
        });
      }

      previousCountsRef.current = nextCounts;
      hasLoadedCountsRef.current = true;

      setUnreadSupportCount(supportCount);
      setHasUnreadSupport(supportCount > 0);
      setUnreadOrdersPlacedCount(placedCount);
      setHasUnreadOrdersPlaced(placedCount > 0);
      setUnreadOrdersAttemptedCount(attemptedCount);
      setHasUnreadOrdersAttempted(attemptedCount > 0);
      setUnreadPaymentCount(paymentCount);
      setHasUnreadPayments(paymentCount > 0);
    } catch {
      // Ignore polling errors so the sidebar keeps working offline.
    }
  }, [adminUser, pushAlert, pushOrderEventAlert, getOrderEventKey]);

  const markSupportAsSeen = useCallback(() => {
    writeLastSeenAt(STORAGE_KEYS.support);
    setHasUnreadSupport(false);
    setUnreadSupportCount(0);
    if (previousCountsRef.current) {
      previousCountsRef.current = { ...previousCountsRef.current, support: 0 };
    }
  }, []);

  const markOrdersAsSeen = useCallback(() => {
    writeLastSeenAt(STORAGE_KEYS.ordersPlaced);
    writeLastSeenAt(STORAGE_KEYS.ordersAttempted);
    setHasUnreadOrdersPlaced(false);
    setUnreadOrdersPlacedCount(0);
    setHasUnreadOrdersAttempted(false);
    setUnreadOrdersAttemptedCount(0);
    if (previousCountsRef.current) {
      previousCountsRef.current = {
        ...previousCountsRef.current,
        placed: 0,
        attempted: 0,
      };
    }
  }, []);

  const markPaymentsAsSeen = useCallback(() => {
    writeLastSeenAt(STORAGE_KEYS.payments);
    setHasUnreadPayments(false);
    setUnreadPaymentCount(0);
    if (previousCountsRef.current) {
      previousCountsRef.current = { ...previousCountsRef.current, payments: 0 };
    }
  }, []);

  const dismissToast = useCallback((id) => {
    const timerId = toastTimersRef.current.get(id);
    if (timerId) {
      window.clearTimeout(timerId);
      toastTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const dismissAlert = useCallback((id) => {
    dismissedAlertIdsRef.current.add(id);
    setRecentAlerts((prev) => prev.filter((item) => item.id !== id));
    dismissToast(id);
    markAdminInboxAlertRead(id).catch(() => {
      // The alert may still be receiving its database id; persistAlert handles that race.
    });
  }, [dismissToast]);

  const clearAllAlerts = useCallback(() => {
    setRecentAlerts([]);
    setToasts([]);
    toastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    toastTimersRef.current.clear();
    markAllAdminInboxAlertsRead().catch(() => {
      // Keep the UI responsive if the server is temporarily unavailable.
    });
  }, []);

  useEffect(() => {
    if (adminUser?.role !== "admin") return undefined;

    let intervalId = null;

    const schedulePolling = () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      const intervalMs =
        typeof document !== "undefined" && document.hidden
          ? POLL_INTERVAL_HIDDEN_MS
          : POLL_INTERVAL_VISIBLE_MS;
      intervalId = window.setInterval(refreshUnread, intervalMs);
    };

    refreshUnread();
    schedulePolling();

    const handleVisibilityChange = () => {
      refreshUnread();
      schedulePolling();
    };

    const handleFocus = () => {
      refreshUnread();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      toastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      toastTimersRef.current.clear();
    };
  }, [adminUser, refreshUnread]);

  useEffect(() => {
    if (adminUser?.role !== "admin") return;
    requestBrowserNotificationPermission().then(setBrowserNotificationPermission);
  }, [adminUser]);

  return (
    <AdminNotificationContext.Provider
      value={{
        hasUnreadSupport,
        unreadSupportCount,
        hasUnreadOrders,
        unreadOrderCount,
        hasUnreadOrdersPlaced,
        unreadOrdersPlacedCount,
        hasUnreadOrdersAttempted,
        unreadOrdersAttemptedCount,
        hasUnreadPayments,
        unreadPaymentCount,
        panelUnreadCount,
        recentAlerts,
        toasts,
        browserNotificationPermission,
        setBrowserNotificationPermission,
        markSupportAsSeen,
        markOrdersAsSeen,
        markPaymentsAsSeen,
        dismissToast,
        dismissAlert,
        clearAllAlerts,
        refreshUnread,
      }}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    throw new Error("useAdminNotifications must be used within AdminNotificationProvider");
  }
  return context;
}

export function useSupportNotification() {
  const {
    hasUnreadSupport,
    unreadSupportCount,
    markSupportAsSeen,
    refreshUnread,
  } = useAdminNotifications();

  return {
    hasUnread: hasUnreadSupport,
    unreadCount: unreadSupportCount,
    markSupportAsSeen,
    refreshUnread,
  };
}

// Backward-compatible provider alias.
export const SupportNotificationProvider = AdminNotificationProvider;
