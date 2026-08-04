import { useEffect, useRef, useState } from "react";
import {
  buildProductShareContent,
  getShareableProductFile,
  shareProduct,
} from "../../utils/productShare";

function ShareIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

function ProductShareMenu({ product, shareUrl, imageUrl, variantName = "", className = "" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const menuRef = useRef(null);

  const shareContent = buildProductShareContent({ product, shareUrl, variantName });
  const { text: shareMessage, title: shareTitle } = shareContent;
  const shareText = [
    shareContent.productName,
    shareContent.brandName,
    shareContent.priceLine?.replace(/^💰\s*/, ""),
  ]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const shareOptions = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: "WA",
      iconClass: "bg-green-500 text-white",
      fallbackUrl: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: "f",
      iconClass: "bg-blue-600 text-white",
      fallbackUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      id: "twitter",
      label: "X",
      icon: "X",
      iconClass: "bg-black text-white",
      fallbackUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      id: "email",
      label: "Email",
      icon: "@",
      iconClass: "bg-mobile-surface text-text-primary",
      fallbackUrl: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareMessage)}`,
    },
  ];

  const handleNativeShare = async () => {
    if (!navigator.share) return false;

    setSharing(true);
    try {
      await shareProduct({ product, shareUrl, imageUrl, variantName });
      setOpen(false);
      return true;
    } catch (error) {
      if (error?.name === "AbortError") return true;
      return false;
    } finally {
      setSharing(false);
    }
  };

  const handlePlatformShare = async (fallbackUrl) => {
    setSharing(true);
    try {
      const shared = await shareProduct({ product, shareUrl, imageUrl, variantName });
      if (shared) {
        setOpen(false);
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
    } finally {
      setSharing(false);
    }

    window.open(fallbackUrl, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleCopyShare = async () => {
    const imageFile = await getShareableProductFile({ product, imageUrl, variantName });

    try {
      if (imageFile && navigator.clipboard?.write && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([shareMessage], { type: "text/plain" }),
            [imageFile.type]: imageFile,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {
      // fall through to text-only copy
    }

    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleShareClick = async () => {
    const shared = await handleNativeShare();
    if (!shared) {
      setOpen((prev) => !prev);
    }
  };

  return (
    <div className={`relative shrink-0 ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={handleShareClick}
        disabled={sharing}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light text-text-secondary transition hover:border-primary hover:text-primary disabled:opacity-50"
        aria-label="Share product with price and link"
        aria-expanded={open}
      >
        <ShareIcon />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-border-light bg-white p-3 shadow-lg">
          <p className="mb-1 text-sm font-semibold text-text-primary">Share this product</p>
          <p className="mb-3 text-[11px] leading-snug text-text-secondary">
            Shares image, name, brand, price, and product link
          </p>

          <div className="grid grid-cols-4 gap-2">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={sharing}
                onClick={() => handlePlatformShare(option.fallbackUrl)}
                className="flex flex-col items-center gap-1 rounded-md px-1 py-2 text-center transition hover:bg-mobile-surface disabled:opacity-50"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${option.iconClass}`}
                >
                  {option.icon}
                </span>
                <span className="text-[10px] font-medium text-text-secondary">{option.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopyShare}
            disabled={sharing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-border-light px-3 py-2 text-sm font-semibold text-text-primary transition hover:bg-mobile-surface disabled:opacity-50"
          >
            {copied ? "Copied!" : "Copy details & image"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ProductShareMenu;
