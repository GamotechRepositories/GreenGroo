const GUEST_WISHLIST_KEY = "greengrocc_guest_wishlist";

export function loadGuestWishlist() {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestWishlist(items) {
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
}

export function clearGuestWishlist() {
  localStorage.removeItem(GUEST_WISHLIST_KEY);
}
