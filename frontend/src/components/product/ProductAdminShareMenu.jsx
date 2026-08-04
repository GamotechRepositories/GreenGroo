import { useEffect, useRef, useState } from "react";
import {
  buildAdminProductShareContent,
  copyAdminProductShare,
  downloadAdminShareImage,
  getAdminShareableProductFile,
  shareAdminProduct,
  shareAdminProductToWhatsApp,
} from "../../utils/adminProductShare";

function AdminShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3"
      />
    </svg>
  );
}

function ProductAdminShareMenu({ product, imageUrl, className = "" }) {
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("");
  const menuRef = useRef(null);

  const shareContent = buildAdminProductShareContent(product);
  const { text: shareMessage, title: shareTitle } = shareContent;

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

  useEffect(() => {
    if (!status) return undefined;
    const timer = setTimeout(() => setStatus(""), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  const shareOptions = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: "WA",
      iconClass: "bg-green-500 text-white",
      fallbackUrl: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    },
    {
      id: "instagram",
      label: "Instagram",
      icon: "IG",
      iconClass: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white",
      action: "instagram",
    },
    {
      id: "email",
      label: "Email",
      icon: "@",
      iconClass: "bg-mobile-surface text-text-primary",
      fallbackUrl: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareMessage)}`,
    },
    {
      id: "sms",
      label: "SMS",
      icon: "SMS",
      iconClass: "bg-blue-500 text-white",
      fallbackUrl: `sms:?body=${encodeURIComponent(shareMessage)}`,
    },
  ];

  const handleNativeShare = async () => {
    if (!navigator.share) return false;

    setSharing(true);
    try {
      await shareAdminProduct({ product, imageUrl });
      setOpen(false);
      return true;
    } catch (error) {
      if (error?.name === "AbortError") return true;
      return false;
    } finally {
      setSharing(false);
    }
  };

  const handleInstagramShare = async () => {
    setSharing(true);
    try {
      const shared = await shareAdminProduct({ product, imageUrl });
      if (shared) {
        setOpen(false);
        return;
      }

      const imageFile = await getAdminShareableProductFile(product, imageUrl);
      if (imageFile) {
        downloadAdminShareImage(imageFile);
      }
      if (shareContent.text && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareContent.text);
      }
      setStatus(
        imageFile
          ? "Product image downloaded. Product details copied for caption."
          : "Product details copied. Paste in Instagram."
      );
      setOpen(false);
    } catch {
      setStatus("Could not prepare Instagram share");
    } finally {
      setSharing(false);
    }
  };

  const handlePlatformShare = async (option) => {
    if (option.action === "instagram") {
      await handleInstagramShare();
      return;
    }

    if (option.id === "whatsapp") {
      setSharing(true);
      try {
        const result = await shareAdminProductToWhatsApp({ product, imageUrl });
        if (result.mode === "native") {
          setOpen(false);
          return;
        }
        if (result.mode === "cancelled") return;
        setStatus(
          result.downloadedImage
            ? "Image downloaded & product details copied/opened in WhatsApp."
            : "WhatsApp opened with product details."
        );
        setOpen(false);
      } catch {
        setStatus("Could not share to WhatsApp");
      } finally {
        setSharing(false);
      }
      return;
    }

    setSharing(true);
    try {
      const shared = await shareAdminProduct({ product, imageUrl });
      if (shared) {
        setOpen(false);
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
    } finally {
      setSharing(false);
    }

    if (option.fallbackUrl) {
      window.open(option.fallbackUrl, "_blank", "noopener,noreferrer");
    }
    setOpen(false);
  };

  const handleCopyShare = async () => {
    setSharing(true);
    try {
      const result = await copyAdminProductShare({ product, imageUrl });
      setStatus(
        result.copiedImage
          ? "Image & product details copied"
          : "Product details copied (image copy not supported here)"
      );
      setOpen(false);
    } catch {
      setStatus("Copy failed");
    } finally {
      setSharing(false);
    }
  };

  const handleShareClick = async () => {
    const shared = await handleNativeShare();
    if (!shared) {
      setOpen((prev) => !prev);
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={handleShareClick}
        disabled={sharing}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light text-text-secondary transition hover:border-primary hover:text-primary disabled:opacity-50"
        aria-label="Share product details"
        aria-expanded={open}
      >
        <AdminShareIcon />
      </button>

      {status ? (
        <p className="absolute right-0 top-full z-40 mt-2 w-64 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-800 shadow-sm">
          {status}
        </p>
      ) : null}

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-lg border border-border-light bg-white p-3 shadow-xl">
          <p className="mb-1 text-sm font-semibold text-text-primary">Share product</p>
          <p className="mb-3 text-[11px] leading-snug text-text-secondary">
            Shares product image with name and brand only. No price, description, or link.
          </p>

          <div className="grid grid-cols-4 gap-2">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={sharing}
                onClick={() => handlePlatformShare(option)}
                className="flex flex-col items-center gap-1 rounded-md px-1 py-2 text-center transition hover:bg-mobile-surface disabled:opacity-50"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold ${option.iconClass}`}
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
            Copy image & details
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ProductAdminShareMenu;
