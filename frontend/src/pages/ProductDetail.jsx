import { useEffect, useMemo, useState } from "react";
import { addRecentlyViewed } from "../utils/recentlyViewed";
import { Link, useParams } from "react-router-dom";
import { buildApiUrl, getProductById } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import WishlistButton from "../components/product/WishlistButton";
import ProductPriceDisplay from "../components/product/ProductPriceDisplay";
import { useCanViewProductPrice } from "../hooks/useCanViewProductPrice";
import {
  getAvailableColors,
  getBulkTierRows,
  getMinOrderQuantity,
  getCartAdjustStep,
  hasConfiguredMinOrderQuantity,
  hasConfiguredQuantityStep,
  getUnitPriceForQuantity,
  getVariantStock,
  isBulkPricing,
  isMultiVariant,
} from "../utils/productPricing";
import {
  getDecreasedCartQuantityForProduct,
} from "../utils/cartDefaults";
import ProductImageFrame from "../components/product/ProductImageFrame";
import ProductVideo from "../components/product/ProductVideo";
import ProductDescriptionContent from "../components/product/ProductDescriptionContent";
import SimilarProducts from "../components/product/SimilarProducts";
import { normalizeProductImages } from "../utils/productImage";
import ProductShareMenu from "../components/product/ProductShareMenu";
import ProductAdminShareMenu from "../components/product/ProductAdminShareMenu";
import { updateProductShareMeta } from "../utils/productShare";
import { tryOpenProductInApp } from "../utils/openMobileApp";

const DEFAULT_MOQ = 1;
const REVIEW_COUNT = 128;

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

function productSku(product) {
  if (product.sku?.trim()) {
    return product.sku.trim().toUpperCase();
  }
  const code = (product.subcategory || product.brandName || "SKU")
    .replace(/\s+/g, "-")
    .toUpperCase();
  return `BMM-${code}`;
}

function ProductSkuRow({ product }) {
  const [copied, setCopied] = useState(false);
  const sku = productSku(product);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sku);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <p className="text-sm text-text-secondary">
        SKU: <span className="font-medium text-text-primary">{sku}</span>
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1 rounded-md border border-border-light px-2 py-0.5 text-xs font-medium text-text-secondary transition hover:border-primary/40 hover:text-primary"
        aria-label="Copy SKU"
      >
        {copied ? (
          "Copied"
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  );
}

function getImageExtension(url) {
  const match = url?.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : "jpg";
}

function getMimeType(ext) {
  const types = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return types[ext] || "image/jpeg";
}

function buildImageFilename(productName, imageUrl, imageIndex) {
  const ext = getImageExtension(imageUrl);
  const safeName = (productName || "product")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return `${safeName || "product"}-${imageIndex + 1}.${ext}`;
}

function getResolvedSpecifications(product) {
  if (Array.isArray(product?.specifications) && product.specifications.length > 0) {
    return product.specifications.filter((spec) => spec?.name && spec?.value);
  }

  const fallback = [];
  if (product?.brandName) fallback.push({ name: "Brand", value: product.brandName });
  if (product?.categories?.[0]) fallback.push({ name: "Category", value: product.categories[0] });
  if (product?.subcategory) fallback.push({ name: "Subcategory", value: product.subcategory });
  if (product?.warranty) fallback.push({ name: "Warranty", value: product.warranty });
  if (Array.isArray(product?.features)) {
    product.features.forEach((feature, index) => {
      if (feature?.trim()) {
        fallback.push({ name: `Feature ${index + 1}`, value: feature.trim() });
      }
    });
  }
  return fallback;
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function buildProxyDownloadUrl(imageUrl, filename) {
  const params = new URLSearchParams({
    url: imageUrl,
    filename,
  });
  return buildApiUrl(`/api/proxy/image/download?${params.toString()}`);
}

function triggerBlobDownload(blob, filename, mimeType) {
  const objectUrl = URL.createObjectURL(new Blob([blob], { type: mimeType }));
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

async function downloadProductImage(imageUrl, productName, imageIndex) {
  if (!imageUrl) return false;

  const filename = buildImageFilename(productName, imageUrl, imageIndex);
  const blob = await fetchImageBlob(imageUrl);

  if (!blob) {
    try {
      const response = await fetch(buildProxyDownloadUrl(imageUrl, filename));
      if (response.ok) {
        const fallbackBlob = await response.blob();
        triggerBlobDownload(
          fallbackBlob,
          filename,
          getMimeType(getImageExtension(imageUrl))
        );
        return true;
      }
    } catch {
      // fall through to direct navigation download
    }

    window.location.assign(buildProxyDownloadUrl(imageUrl, filename));
    return true;
  }

  const ext = getImageExtension(imageUrl);
  const mimeType = blob.type?.startsWith("image/") ? blob.type : getMimeType(ext);
  const file = new File([blob], filename, { type: mimeType });

  if (isMobileDevice() && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (error) {
      if (error?.name === "AbortError") return false;
    }
  }

  if (isMobileDevice()) {
    window.location.assign(buildProxyDownloadUrl(imageUrl, filename));
    return true;
  }

  triggerBlobDownload(blob, filename, mimeType);
  return true;
}

async function fetchImageBlob(imageUrl) {
  if (!imageUrl) return null;

  try {
    const proxyResponse = await fetch(
      buildApiUrl(`/api/proxy/image?url=${encodeURIComponent(imageUrl)}`)
    );
    if (proxyResponse.ok) {
      return await proxyResponse.blob();
    }
  } catch {
    // fall through to direct fetch
  }

  try {
    const directResponse = await fetch(imageUrl);
    if (!directResponse.ok) return null;
    return await directResponse.blob();
  } catch {
    return null;
  }
}

function DownloadIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
      />
    </svg>
  );
}

function StarRating({ rating, reviewCount }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 text-primary" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${star <= Math.floor(rating) ? "fill-current" : "fill-none"}`}
            viewBox="0 0 20 20"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.9l-4.94 2.81.94-5.5-4-3.9 5.53-.8L10 1.5z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-text-secondary">
        {rating.toFixed(1)} ({reviewCount})
      </span>
    </div>
  );
}

function ProductImage({ src, alt }) {
  return (
    <ProductImageFrame
      src={src}
      alt={alt}
      fit="contain"
      className="max-h-[min(70vh,520px)]"
    />
  );
}

const TABS = [
  { id: "description", label: "Description" },
  { id: "specifications", label: "Specifications" },
  { id: "reviews", label: "Reviews" },
  { id: "shipping", label: "Shipping & Delivery", shortLabel: "Shipping" },
];

function MediaThumbnailCarousel({ items, activeIndex, onSelect }) {
  if (items.length <= 1) return null;

  return (
    <div className="w-full overflow-x-auto hide-scrollbar">
      <div className="flex w-max min-w-full justify-start gap-2 px-0.5 pb-0.5">
        {items.map((item, index) => (
          <button
            key={`${item.type}-${item.url}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={
              item.type === "video"
                ? "View product video"
                : `View image ${index} of ${items.length}`
            }
            aria-current={activeIndex === index ? "true" : undefined}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-white lg:h-[72px] lg:w-[72px] ${
              activeIndex === index ? "border-primary" : "border-border-light"
            }`}
          >
            {item.type === "video" ? (
              <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-white">
                <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            ) : (
              <img
                src={item.url}
                alt=""
                className="h-full w-full object-contain"
                loading="lazy"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function GalleryNavButton({ direction, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous image" : "Next image"}
      className="absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border-light bg-white/95 text-lg text-text-secondary transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
      style={direction === "prev" ? { left: "0.5rem" } : { right: "0.5rem" }}
    >
      {direction === "prev" ? "‹" : "›"}
    </button>
  );
}

function QuantitySelector({ quantity, min, max, onDecrease, onIncrease, disabled }) {
  return (
    <div className="flex w-full items-center justify-between gap-2 py-1 sm:gap-3">
      <span className="shrink-0 text-xs font-semibold text-text-primary sm:text-sm">
        Quantity (Pieces)
      </span>
      <div className="inline-flex shrink-0 items-center overflow-hidden rounded-md border border-border-light">
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabled || quantity <= min}
          aria-label="Decrease quantity"
          className="flex h-8 w-8 items-center justify-center border-r border-border-light bg-white text-base text-text-secondary transition hover:bg-mobile-surface hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="flex h-8 min-w-[2.25rem] items-center justify-center border-r border-border-light bg-white px-1.5 text-sm font-bold text-text-primary">
          {quantity}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={disabled || quantity >= max}
          aria-label="Increase quantity"
          className="flex h-8 w-8 items-center justify-center bg-white text-base text-text-secondary transition hover:bg-mobile-surface hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

function CartActionQuantity({ quantity, min, max, disabled, onDecrease, onIncrease }) {
  return (
    <div className="flex flex-1 items-center justify-between gap-2 rounded-md border-2 border-primary bg-white px-4 py-2.5">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        aria-label="Decrease cart quantity"
        className="flex h-8 w-8 items-center justify-center rounded-md text-lg font-medium text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-bold text-text-primary">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || quantity >= max}
        aria-label="Increase cart quantity"
        className="flex h-8 w-8 items-center justify-center rounded-md text-lg font-medium text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function ActionButtons({
  inStock,
  inCart,
  cartQuantity,
  min,
  max,
  onAddToCart,
  onDecrease,
  onIncrease,
  product,
  shareImageUrl,
  className = "",
}) {
  return (
    <div className={className}>
      {inCart ? (
        <CartActionQuantity
          quantity={cartQuantity}
          min={min}
          max={max}
          disabled={!inStock}
          onDecrease={onDecrease}
          onIncrease={onIncrease}
        />
      ) : (
        <button
          type="button"
          onClick={(e) => onAddToCart(e.currentTarget)}
          disabled={!inStock}
          className="flex-1 rounded-md bg-primary px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to Cart
        </button>
      )}
      <ProductAdminShareMenu
        className="flex-1 [&>button]:h-full [&>button]:w-full [&>button]:rounded-md [&>button]:border-2 [&>button]:border-primary [&>button]:bg-white [&>button]:px-6 [&>button]:py-3.5 [&>button]:text-sm [&>button]:font-bold [&>button]:text-primary [&>button]:transition hover:[&>button]:bg-primary/5"
        product={product}
        imageUrl={shareImageUrl}
      />
    </div>
  );
}

function ProductDetail() {
  const { id } = useParams();
  const { addToCart, items: cartItems, incrementCartItem, decrementCartItem } = useCart();
  const { openAuthModal } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMedia, setActiveMedia] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(DEFAULT_MOQ);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [downloadingImage, setDownloadingImage] = useState(false);
  const canViewPrice = useCanViewProductPrice(product);

  useEffect(() => {
    if (!id) return;
    tryOpenProductInApp(id);
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await getProductById(id);
        const nextProduct = data.data;
        const initialVariant =
          nextProduct?.variantType === "multi"
            ? nextProduct.variants?.[0]?.name || ""
            : "";
        const initialColors = getAvailableColors(nextProduct, initialVariant);

        setProduct(nextProduct);
        setSelectedVariant(initialVariant);
        setSelectedColor(initialColors[0]?.name || "");
        setActiveMedia(0);
        setActiveTab("description");

        if (nextProduct?._id) {
          addRecentlyViewed(nextProduct._id);
        }
      } catch {
        setProduct(null);
        setSelectedVariant("");
        setSelectedColor("");
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleVariantChange = (variantName) => {
    setSelectedVariant(variantName);
    if (product) {
      const colors = getAvailableColors(product, variantName);
      setSelectedColor(colors[0]?.name || "");
    }
  };

  const images = useMemo(
    () => normalizeProductImages(product?.productImages),
    [product?.productImages]
  );

  const videoUrl = product?.videoUrl?.trim() || "";

  const galleryItems = useMemo(() => {
    const items = images.map((url) => ({ type: "image", url }));
    if (videoUrl) {
      items.push({ type: "video", url: videoUrl });
    }
    return items;
  }, [images, videoUrl]);

  useEffect(() => {
    setActiveMedia((prev) => {
      if (!galleryItems.length) return 0;
      return prev < galleryItems.length ? prev : 0;
    });
  }, [galleryItems]);

  const activeGalleryItem = galleryItems[activeMedia];
  const isVideoActive = activeGalleryItem?.type === "video";
  const imageOnlyIndex = activeMedia;

  const activeVariantName = product && isMultiVariant(product) ? selectedVariant : "";

  const shareUrl =
    typeof window !== "undefined" && product?._id
      ? `${window.location.origin}/product/${product._id}?openInApp=1`
      : "";

  const shareImageUrl = images[0] || "";
  const specifications = useMemo(() => getResolvedSpecifications(product), [product]);

  useEffect(() => {
    if (!product) return undefined;

    updateProductShareMeta({
      product,
      shareUrl,
      imageUrl: shareImageUrl,
      variantName: activeVariantName,
    });

    return () => {
      document.title = "GreenGrocc";
    };
  }, [product, shareUrl, shareImageUrl, activeVariantName]);

  const availableColors = useMemo(() => {
    if (!product) return [];
    return getAvailableColors(product, activeVariantName);
  }, [product, activeVariantName]);

  const bulkTiers = useMemo(() => {
    if (!product || !isBulkPricing(product, activeVariantName)) return [];
    return getBulkTierRows(product, activeVariantName);
  }, [product, activeVariantName]);

  const minOrderQuantity = product
    ? getMinOrderQuantity(product, activeVariantName, DEFAULT_MOQ)
    : DEFAULT_MOQ;
  const quantityStep = product
    ? getCartAdjustStep(product, activeVariantName, DEFAULT_MOQ)
    : DEFAULT_MOQ;
  const showMoq = product
    ? hasConfiguredMinOrderQuantity(product, activeVariantName)
    : false;
  const showStepByQty = product
    ? hasConfiguredQuantityStep(product, activeVariantName)
    : false;

  const getCartLine = () => {
    if (!product?._id) return null;
    return (
      cartItems.find(
        (item) =>
          item._id === product._id &&
          (item.variantName || "") === activeVariantName &&
          (item.colorName || "") === selectedColor
      ) || null
    );
  };

  const cartLineQuantity = useMemo(() => {
    if (!product?._id) return null;
    const line = cartItems.find(
      (item) =>
        item._id === product._id &&
        (item.variantName || "") === activeVariantName &&
        (item.colorName || "") === selectedColor
    );
    return line?.quantity ?? null;
  }, [cartItems, product?._id, activeVariantName, selectedColor]);

  useEffect(() => {
    if (!product) return;
    const moq = getMinOrderQuantity(product, activeVariantName, DEFAULT_MOQ);
    setQuantity(cartLineQuantity ?? moq);
  }, [product, activeVariantName, selectedColor, cartLineQuantity]);

  const currentUnitPrice = product
    ? getUnitPriceForQuantity(product, quantity, activeVariantName)
    : 0;

  const handleAddToCart = async (flySource) => {
    if (!product) return;
    if (availableColors.length > 0 && !selectedColor) return;

    const result = await addToCart(product, quantity, {
      variantName: activeVariantName,
      colorName: selectedColor,
      flySource,
    });
    if (result?.requiresLogin) {
      openAuthModal("login");
    }
  };

  const handleQuantityDecrease = async () => {
    if (!product) return;
    const line = getCartLine();
    const step = quantityStep;

    if (line) {
      await decrementCartItem({
        productId: product._id,
        variantName: activeVariantName,
        colorName: selectedColor,
        resolveNextQuantity: (currentQty) =>
          getDecreasedCartQuantityForProduct(product, currentQty, activeVariantName),
      });
      return;
    }

    setQuantity((prev) => Math.max(minOrderQuantity, prev - step));
  };

  const handleQuantityIncrease = async () => {
    if (!product) return;
    const line = getCartLine();
    const step = quantityStep;
    const variantStock = getVariantStock(product, activeVariantName);
    const maxQty =
      variantStock > 0
        ? Math.max(variantStock, minOrderQuantity)
        : minOrderQuantity;

    if (line) {
      await incrementCartItem({
        productId: product._id,
        variantName: activeVariantName,
        colorName: selectedColor,
        step,
        maxQuantity: maxQty,
      });
      return;
    }

    setQuantity((prev) => Math.min(maxQty, prev + step));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-28 lg:pb-10">
        <div className="mx-auto w-full max-w-7xl px-3 pb-8 pt-4 sm:px-4 md:px-5 lg:px-6 xl:px-8">
          <div className="animate-pulse">
            <div className="mb-6 hidden h-4 w-64 rounded bg-mobile-surface lg:block" />
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 md:gap-8 lg:gap-10">
              <div className="aspect-square max-h-[min(70vh,520px)] w-full animate-pulse rounded-lg border border-border-light bg-mobile-surface" />
              <div className="space-y-4">
                <div className="h-7 w-3/4 rounded bg-mobile-surface sm:h-8" />
                <div className="h-4 w-1/4 rounded bg-mobile-surface" />
                <div className="h-10 w-1/3 rounded bg-mobile-surface" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white pb-28 lg:pb-10">
        <div className="mx-auto w-full max-w-7xl px-3 py-16 text-center sm:px-4 md:px-5 lg:px-6 xl:px-8">
          <p className="mb-6 text-text-secondary">{error || "Product not found."}</p>
          <Link to="/product" className="text-sm font-medium text-primary hover:underline">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const category = product.categories?.[0] || "Products";
  const variantStock = getVariantStock(product, activeVariantName);
  const inStock = variantStock > 0;
  const rating = product.ratings || 4.5;
  const maxQuantity = inStock
    ? Math.max(variantStock, minOrderQuantity)
    : minOrderQuantity;

  return (
    <div className="min-h-screen bg-white pb-24 text-text-primary lg:pb-10">
      <div className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-4 sm:pt-4 md:px-5 lg:px-6 lg:pt-4 xl:px-8">
        <nav className="mb-4 hidden flex-wrap items-center gap-1.5 text-xs text-text-secondary sm:mb-5 sm:text-sm lg:flex">
          <Link to="/" className="transition hover:text-primary">
            Home
          </Link>
          <span className="text-text-muted">›</span>
          <Link
            to={`/product?categoryName=${encodeURIComponent(category)}`}
            className="transition hover:text-primary"
          >
            {category}
          </Link>
          <span className="text-text-muted">›</span>
          <span className="min-w-0 break-words font-medium text-text-primary">{product.name}</span>
        </nav>

        <div className="grid min-w-0 gap-5 sm:gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8 xl:gap-10">
          <div className="flex min-w-0 flex-col gap-3 lg:gap-4">
            <div className="relative overflow-hidden rounded-lg bg-white">
              <div className="absolute left-2 top-2 z-10 flex items-center gap-2">
                <WishlistButton product={product} size="md" />
                <ProductShareMenu
                  className="[&_button]:bg-white/95"
                  product={product}
                  shareUrl={shareUrl}
                  imageUrl={shareImageUrl}
                  variantName={activeVariantName}
                />
              </div>
              {activeGalleryItem?.type === "image" && activeGalleryItem.url && (
                <button
                  type="button"
                  disabled={downloadingImage}
                  onClick={async () => {
                    setDownloadingImage(true);
                    try {
                      await downloadProductImage(
                        activeGalleryItem.url,
                        product.name,
                        Math.max(0, imageOnlyIndex)
                      );
                    } finally {
                      setDownloadingImage(false);
                    }
                  }}
                  className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border-light bg-white/95 text-text-secondary transition hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-60"
                  aria-label="Save image to gallery"
                >
                  <DownloadIcon />
                </button>
              )}
              <div className="flex w-full items-center justify-center">
                {isVideoActive ? (
                  <ProductVideo url={activeGalleryItem.url} embedded />
                ) : (
                  <ProductImage src={activeGalleryItem?.url} alt={product.name} />
                )}
              </div>
              {galleryItems.length > 1 ? (
                <>
                  <GalleryNavButton
                    direction="prev"
                    disabled={activeMedia === 0}
                    onClick={() => setActiveMedia((prev) => Math.max(0, prev - 1))}
                  />
                  <GalleryNavButton
                    direction="next"
                    disabled={activeMedia === galleryItems.length - 1}
                    onClick={() =>
                      setActiveMedia((prev) => Math.min(galleryItems.length - 1, prev + 1))
                    }
                  />
                </>
              ) : null}
            </div>
            <div className="mt-auto space-y-2">
              {galleryItems.length > 1 ? (
                <p className="text-center text-xs text-text-muted">
                  {isVideoActive
                    ? "Video"
                    : `Image ${Math.max(1, imageOnlyIndex + 1)} of ${images.length}`}
                </p>
              ) : null}
              <MediaThumbnailCarousel
                items={galleryItems}
                activeIndex={activeMedia}
                onSelect={setActiveMedia}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="flex items-start justify-between gap-3">
              <h1 className="min-w-0 flex-1 break-words text-2xl font-bold leading-snug lg:text-[1.75rem] xl:text-3xl">
                {product.name}
              </h1>
            </div>
            <ProductSkuRow product={product} />

            <div className="mt-2">
              <StarRating rating={rating} reviewCount={REVIEW_COUNT} />
            </div>

            <div className="mt-3">
              <ProductPriceDisplay
                product={product}
                variantName={activeVariantName}
                size="lg"
              />
            </div>

            {isMultiVariant(product) ? (
              <div className="mt-3">
                <p className="mb-2 text-sm font-semibold text-text-primary">Select variant</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const isActive = selectedVariant === variant.name;
                    return (
                      <button
                        key={variant.name}
                        type="button"
                        onClick={() => handleVariantChange(variant.name)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                          isActive
                            ? "border-primary bg-primary text-white"
                            : "border-border-light bg-white text-text-primary hover:border-primary/40"
                        }`}
                      >
                        {variant.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {availableColors.length > 0 ? (
              <div className="mt-3">
                <p className="mb-2 text-sm font-semibold text-text-primary">Select color</p>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => {
                    const isActive = selectedColor === color.name;
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.name)}
                        title={color.name}
                        className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                          isActive
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border-light bg-white text-text-primary hover:border-primary/40"
                        }`}
                      >
                        {color.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {canViewPrice && isBulkPricing(product, activeVariantName) ? (
              <p className="mt-1 text-sm text-text-secondary">
                Current selection: {formatPrice(currentUnitPrice)} / piece
              </p>
            ) : null}

            {(showMoq || showStepByQty || isMultiVariant(product)) ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-text-primary">
                  {[
                    showMoq ? `MOQ: ${minOrderQuantity} Pieces` : null,
                    showStepByQty ? `Step by QTY: ${quantityStep} Pieces` : null,
                    isMultiVariant(product) ? `Stock: ${variantStock}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="shrink-0 text-xs font-semibold text-text-secondary">
                  Purchased {Number(product.purchaseCount) || 0} times
                </p>
              </div>
            ) : null}

            {!cartLineQuantity ? (
              <div className="mt-2">
                <QuantitySelector
                  quantity={quantity}
                  min={minOrderQuantity}
                  max={maxQuantity}
                  disabled={!inStock}
                  onDecrease={handleQuantityDecrease}
                  onIncrease={handleQuantityIncrease}
                />
              </div>
            ) : null}

            {canViewPrice && bulkTiers.length > 0 ? (
              <div className="mt-3 lg:mt-4">
                <h2 className="mb-2 text-base font-bold">Bulk Price (Per Piece)</h2>
                <div className="space-y-2 rounded-lg border border-border-light p-3">
                  {bulkTiers.map((tier) => (
                    <div
                      key={tier.key}
                      className="flex items-center justify-between gap-3 text-sm leading-relaxed text-text-secondary"
                    >
                      <span>Buy {tier.minQuantity} Pieces or more at</span>
                      <div className="flex shrink-0 items-baseline gap-2">
                        {tier.hasDiscount ? (
                          <span className="text-xs text-neutral-400 line-through">
                            {formatPrice(tier.originalPrice)}
                          </span>
                        ) : null}
                        <span className="font-semibold text-text-primary">
                          {formatPrice(tier.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <ActionButtons
              inStock={inStock}
              inCart={cartLineQuantity != null}
              cartQuantity={cartLineQuantity ?? quantity}
              min={minOrderQuantity}
              max={maxQuantity}
              onAddToCart={handleAddToCart}
              onDecrease={handleQuantityDecrease}
              onIncrease={handleQuantityIncrease}
              product={product}
              shareImageUrl={shareImageUrl}
              className="mt-5 flex w-full gap-3 lg:mt-auto lg:pt-4"
            />
          </div>
        </div>

        <div className="mt-8 border-t border-border-light pt-5 sm:mt-10 sm:pt-6">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar border-b border-border-light sm:gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 border-b-2 pb-2.5 text-xs font-semibold transition sm:pb-3 sm:text-sm ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.id === "reviews"
                  ? `Reviews (${REVIEW_COUNT})`
                  : tab.shortLabel
                    ? (
                        <>
                          <span className="sm:hidden">{tab.shortLabel}</span>
                          <span className="hidden sm:inline">{tab.label}</span>
                        </>
                      )
                    : tab.label}
              </button>
            ))}
          </div>

          <div className="py-5 text-xs leading-relaxed text-text-secondary sm:py-6 sm:text-sm">
            {activeTab === "description" && (
              <ProductDescriptionContent
                description={product.description}
                features={product.features}
                fallback={`${product.name} supports fast charging for all devices. Safe, reliable & high performance with premium build quality.`}
              />
            )}

            {activeTab === "specifications" && (
              <div>
                {specifications.length > 0 ? (
                  <ul className="space-y-2 text-text-primary">
                    {specifications.map((spec, index) => (
                      <li key={`${spec.name}-${spec.value}-${index}`}>
                        <span className="font-semibold">{spec.name}: </span>
                        {spec.value}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-text-secondary">No specifications added.</p>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <p>
                Rated {rating.toFixed(1)} out of 5 based on {REVIEW_COUNT} dealer reviews.
              </p>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-2 text-text-primary">
                <p>Pan-India delivery available for bulk orders.</p>
                <p>GST invoice provided with every order.</p>
                <p>Standard delivery: 3–7 business days across major cities.</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-6 gap-5 sm:gap-6 lg:gap-8 xl:gap-10">
          <SimilarProducts
            productId={product._id}
            categoryName={product.categories?.[0] || product.subcategory || ""}
          />
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
