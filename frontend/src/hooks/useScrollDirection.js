import { useSyncExternalStore } from "react";

const SCROLL_THRESHOLD = 10;

/**
 * One shared flag so the cart bar and bottom nav start moving on the same frame.
 * `true` when the user is scrolling down (past 80px), `false` when scrolling up.
 */
let hidden = false;
let lastScrollY = 0;
let ticking = false;
let listening = false;
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function setHidden(next) {
  if (next === hidden) return;
  hidden = next;
  emit();
}

function onScroll() {
  if (ticking) return;
  ticking = true;

  requestAnimationFrame(() => {
    const currentY = window.scrollY;
    const diff = currentY - lastScrollY;

    if (diff > SCROLL_THRESHOLD && currentY > 80) {
      setHidden(true);
    } else if (diff < -SCROLL_THRESHOLD) {
      setHidden(false);
    }

    lastScrollY = currentY;
    ticking = false;
  });
}

function subscribe(listener) {
  listeners.add(listener);
  if (!listening && typeof window !== "undefined") {
    listening = true;
    lastScrollY = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && listening) {
      window.removeEventListener("scroll", onScroll);
      listening = false;
    }
  };
}

export function useScrollDirection() {
  return useSyncExternalStore(subscribe, () => hidden, () => false);
}
