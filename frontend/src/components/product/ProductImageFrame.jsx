import { useState } from "react";

function ProductImagePlaceholder({ className = "" }) {
  return (
    <div className={`product-image product-image--cover ${className}`}>
      <svg
        className="h-10 w-10 text-text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
}

const FIT_CLASS = {
  cover: "product-image--cover",
  contain: "product-image--contain",
  fill: "product-image--fill",
  stretch: "product-image--stretch",
};

function ProductImageFrame({ src, alt = "", className = "", fit = "cover", fallbackSrc = "" }) {
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const fitClass = FIT_CLASS[fit] || FIT_CLASS.cover;
  const currentSrc = useFallback && fallbackSrc ? fallbackSrc : src;

  if (!currentSrc || (error && (!fallbackSrc || useFallback))) {
    return <ProductImagePlaceholder className={`${fitClass} ${className}`} />;
  }

  return (
    <div className={`product-image ${fitClass} ${className}`}>
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onError={() => {
          if (!useFallback && fallbackSrc && currentSrc !== fallbackSrc) {
            setUseFallback(true);
            return;
          }
          setError(true);
        }}
      />
    </div>
  );
}

export default ProductImageFrame;
