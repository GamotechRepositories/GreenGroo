import { useState } from "react";
import { shareWebsite } from "../../utils/websiteShare";

function ShareWebsiteButton({ className = "" }) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await shareWebsite();
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Website share failed:", error);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={sharing}
      className={`inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15 disabled:opacity-60 ${className}`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
      {sharing ? "Sharing..." : "Share Website"}
    </button>
  );
}

export default ShareWebsiteButton;
