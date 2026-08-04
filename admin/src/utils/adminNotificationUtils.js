let audioContext = null;

export function playAdminNotificationSound() {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.12);

    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.35);
  } catch {
    // Ignore audio errors so notifications still work silently.
  }
}

export function showBrowserNotification({
  title,
  body,
  link,
  id,
  requireInteraction = false,
}) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const notification = new Notification(title, {
      body,
      tag: id || `bmm-admin-${Date.now()}`,
      icon: "/favicon.ico",
      requireInteraction,
    });

    notification.onclick = () => {
      window.focus();
      if (link) {
        window.location.assign(link);
      }
      notification.close();
    };
  } catch {
    // Ignore browser notification errors.
  }
}

export function isOrderNotificationType(type) {
  return type === "order_placed" || type === "order_attempted";
}

export async function requestBrowserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }

  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function formatNotificationTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
