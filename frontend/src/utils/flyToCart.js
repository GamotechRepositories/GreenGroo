export function getCartTargetElement() {
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  const desktop = document.querySelector('[data-cart-target="desktop"]');
  const mobile = document.querySelector('[data-cart-target="mobile"]');
  return (isDesktop ? desktop : mobile) || desktop || mobile;
}

export function getElementCenter(element) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function buildFlyToCartAnimation(flySource, productImage) {
  if (!flySource || !productImage) return null;

  const target = getCartTargetElement();
  if (!target) return null;

  const start = getElementCenter(flySource);
  const end = getElementCenter(target);

  return {
    productImage,
    startX: start.x,
    startY: start.y,
    endX: end.x,
    endY: end.y,
  };
}

export function pulseCartTarget() {
  const target = getCartTargetElement();
  if (!target) return;
  target.classList.remove("cart-target-pulse");
  void target.offsetWidth;
  target.classList.add("cart-target-pulse");
}

export function getWishlistTargetElement() {
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  const desktop = document.querySelector('[data-wishlist-target="desktop"]');
  const mobile = document.querySelector('[data-wishlist-target="mobile"]');
  return (isDesktop ? desktop : mobile) || desktop || mobile;
}

export function buildFlyToWishlistAnimation(flySource, productImage) {
  if (!flySource || !productImage) return null;

  const target = getWishlistTargetElement();
  if (!target) return null;

  const start = getElementCenter(flySource);
  const end = getElementCenter(target);

  return {
    productImage,
    startX: start.x,
    startY: start.y,
    endX: end.x,
    endY: end.y,
  };
}

export function pulseWishlistTarget() {
  const target = getWishlistTargetElement();
  if (!target) return;
  target.classList.remove("wishlist-target-pulse");
  void target.offsetWidth;
  target.classList.add("wishlist-target-pulse");
}
