import { useEffect, useState } from "react";
import { LOGO_URL } from "./Header";

const SESSION_KEY = "bmm_opening_splash_shown";
const MIN_DISPLAY_MS = 900;
const MAX_TOTAL_MS = 2400;
const FADE_OUT_MS = 450;

function shouldSkipSplash() {
  if (typeof window === "undefined") return true;
  if (sessionStorage.getItem(SESSION_KEY) === "1") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  return false;
}

function OpeningSplash() {
  const [phase, setPhase] = useState(() => (shouldSkipSplash() ? "hidden" : "enter"));

  useEffect(() => {
    if (phase === "hidden") return undefined;

    sessionStorage.setItem(SESSION_KEY, "1");
    const startedAt = performance.now();
    let logoReady = false;
    let dismissed = false;
    let fadeTimer;
    let hideTimer;
    let maxTimer;

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      setPhase("exit");
      hideTimer = window.setTimeout(() => setPhase("hidden"), FADE_OUT_MS);
    };

    const scheduleDismiss = () => {
      if (!logoReady || dismissed) return;

      const elapsed = performance.now() - startedAt;
      const waitMs = Math.max(0, MIN_DISPLAY_MS - elapsed);

      fadeTimer = window.setTimeout(dismiss, waitMs);
    };

    const logo = new Image();
    logo.decoding = "async";
    logo.onload = () => {
      logoReady = true;
      scheduleDismiss();
    };
    logo.onerror = () => {
      logoReady = true;
      scheduleDismiss();
    };
    logo.src = LOGO_URL;

    maxTimer = window.setTimeout(dismiss, MAX_TOTAL_MS - FADE_OUT_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(maxTimer);
    };
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div
      className={`opening-splash ${phase === "exit" ? "opening-splash--exit" : ""}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="opening-splash__content">
        <div className="opening-splash__logo-wrap">
          <img src={LOGO_URL} alt="" className="opening-splash__logo" decoding="async" />
        </div>
        <h1 className="opening-splash__title">Bulk Mobile Mart</h1>
        <p className="opening-splash__tagline">Your Trusted Wholesale Partner</p>
        <div className="opening-splash__bar" />
      </div>
    </div>
  );
}

export default OpeningSplash;
