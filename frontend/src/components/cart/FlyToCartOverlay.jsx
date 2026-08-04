import { useEffect } from "react";
import { pulseCartTarget } from "../../utils/flyToCart";

const FLY_SIZE = 40;

function FlyToCartOverlay({ animation, onComplete }) {
  useEffect(() => {
    if (!animation) return undefined;

    const timer = window.setTimeout(() => {
      if (typeof animation.pulse === "function") {
        animation.pulse();
      } else {
        pulseCartTarget();
      }
      onComplete?.();
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [animation, onComplete]);

  if (!animation) return null;

  const offsetX = animation.endX - animation.startX;
  const offsetY = animation.endY - animation.startY;

  return (
    <img
      src={animation.productImage}
      alt=""
      aria-hidden="true"
      className="fly-to-cart-item pointer-events-none fixed z-[10000] rounded-lg bg-white object-contain p-0.5 shadow-md"
      style={{
        left: animation.startX - FLY_SIZE / 2,
        top: animation.startY - FLY_SIZE / 2,
        width: FLY_SIZE,
        height: FLY_SIZE,
        "--fly-x": `${offsetX}px`,
        "--fly-y": `${offsetY}px`,
      }}
    />
  );
}

export default FlyToCartOverlay;
