import { useEffect, useState } from "react";
import { getProductReviews, submitProductReview } from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function Stars({ value = 0, size = "md", onSelect }) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(Number(value) || 0);
        const star = (
          <svg
            key={n}
            className={`${sizeClass} ${filled ? "text-amber-400" : "text-slate-300"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
        if (!onSelect) return star;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            className="rounded p-0.5 transition hover:scale-110"
            aria-label={`${n} star`}
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}

function formatReviewDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProductReviews({ productId }) {
  const { user, openAuthModal } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data } = await getProductReviews(productId);
      setReviews(data.data || []);
      setStats(data.stats || { average: 0, count: 0 });
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("login");
      return;
    }
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await submitProductReview(productId, { rating, title, comment });
      setTitle("");
      setComment("");
      setRating(5);
      setSuccess("Thanks! Your review was submitted.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Customer reviews</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {stats.count
              ? `${stats.average.toFixed(1)} average · ${stats.count} review${stats.count === 1 ? "" : "s"}`
              : "Be the first to review this product"}
          </p>
        </div>
        {stats.count ? <Stars value={stats.average} /> : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4">
        <p className="text-sm font-semibold text-slate-800">Write a review</p>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Your rating</p>
          <Stars value={rating} onSelect={setRating} />
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          maxLength={120}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50"
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product"
          required
          rows={3}
          maxLength={2000}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50"
        />
        {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
        {success ? <p className="text-xs font-medium text-emerald-700">{success}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {!user ? "Login to review" : submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-slate-100 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                    {(review.userName || "C").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{review.userName || "Customer"}</p>
                    <p className="text-[11px] text-slate-400">{formatReviewDate(review.createdAt)}</p>
                  </div>
                </div>
                <Stars value={review.rating} size="sm" />
              </div>
              {review.title ? (
                <p className="mt-2 text-sm font-semibold text-slate-800">{review.title}</p>
              ) : null}
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{review.comment}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
