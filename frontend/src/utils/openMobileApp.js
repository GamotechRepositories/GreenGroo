const ANDROID_APP_PACKAGE = "com.bulkmobilemart.app";
const IOS_APP_SCHEME = "bulkmobilemart";

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

function shouldTryOpenInApp() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("openInApp") === "1") return true;

  const referrer = document.referrer || "";
  if (!referrer) return false;

  try {
    const refHost = new URL(referrer).hostname.toLowerCase();
    if (refHost === window.location.hostname.toLowerCase()) return false;
    return true;
  } catch {
    return false;
  }
}

/** Redirect mobile browsers into the installed BulkMobileMart app when possible. */
export function tryOpenProductInApp(productId) {
  if (!productId || typeof window === "undefined" || !isMobileDevice()) return;
  if (!shouldTryOpenInApp()) return;

  const webUrl = `${window.location.origin}/product/${productId}`;
  const userAgent = navigator.userAgent || "";

  if (/Android/i.test(userAgent)) {
    const host = window.location.host;
    const intentUrl =
      `intent://${host}/product/${productId}` +
      `#Intent;scheme=https;package=${ANDROID_APP_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
    window.location.replace(intentUrl);
    return;
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    window.location.replace(`${IOS_APP_SCHEME}://product/${productId}`);
  }
}
