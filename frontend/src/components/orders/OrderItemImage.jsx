import { useEffect, useState } from "react";

function OrderItemImage({ image, fallbackImage, alt, className = "h-full w-full object-contain p-1" }) {
  const [src, setSrc] = useState(image || fallbackImage || "");
  const [hidden, setHidden] = useState(!(image || fallbackImage));

  useEffect(() => {
    setSrc(image || fallbackImage || "");
    setHidden(!(image || fallbackImage));
  }, [image, fallbackImage]);

  if (hidden || !src) {
    return <div className="h-full w-full bg-mobile-surface" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        if (fallbackImage && src !== fallbackImage) {
          setSrc(fallbackImage);
          return;
        }
        setHidden(true);
      }}
    />
  );
}

export default OrderItemImage;
