import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Product3DImage from "./Product3DImage";
import { getDeliveryRating, setDeliveryRating } from "../../utils/deliveryRatings";
import {
  formatOrderPrice,
  formatPlacedAtLabel,
  getBlinkitStatusLabel,
  getPrimaryProductId,
} from "../../utils/orderUtils";

const ACTION_PINK = "#E23744";

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill={index < rating ? ACTION_PINK : "none"}
          stroke={ACTION_PINK}
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </div>
  );
}

function RateOrderModal({ open, onClose, onSubmit }) {
  const [selected, setSelected] = useState(5);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <h3 className="text-base font-bold text-text-primary">Rate your delivery experience</h3>
        <div className="mt-4 flex justify-center gap-1">
          {Array.from({ length: 5 }, (_, index) => {
            const star = index + 1;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setSelected(star)}
                className="p-1"
                aria-label={`Rate ${star} stars`}
              >
                <svg
                  className="h-9 w-9"
                  viewBox="0 0 24 24"
                  fill={star <= selected ? ACTION_PINK : "none"}
                  stroke={ACTION_PINK}
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onSubmit(selected)}
          className="mt-5 w-full rounded-lg py-3.5 text-sm font-bold text-white"
          style={{ backgroundColor: ACTION_PINK }}
        >
          Submit rating
        </button>
        <button type="button" onClick={onClose} className="mt-2 w-full py-2 text-sm text-text-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}

function BlinkitOrderCard({ order }) {
  const navigate = useNavigate();
  const [rating, setRating] = useState(() => getDeliveryRating(order._id));
  const [rateOpen, setRateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isDelivered = order.status === "delivered";
  const productId = getPrimaryProductId(order);
  const items = order.items || [];

  const thumbnails = useMemo(
    () =>
      items.map((item) => ({
        id: item._id || item.name,
        image: item.image || item.productImage || "",
        name: item.name,
      })),
    [items]
  );

  const handleOrderAgain = () => {
    if (items.length > 1) {
      navigate(`/orders/${order._id}`);
      return;
    }
    if (productId) {
      navigate(`/product/${productId}`);
      return;
    }
    navigate(`/orders/${order._id}`);
  };

  const handleRateSubmit = (value) => {
    setDeliveryRating(order._id, value);
    setRating(value);
    setRateOpen(false);
  };

  return (
    <>
      <article className="overflow-hidden rounded-xl bg-white">
        <Link to={`/orders/${order._id}`} className="block px-4 pb-0 pt-3.5">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[15px] font-bold text-text-primary">{getBlinkitStatusLabel(order.status)}</h2>
                {isDelivered ? (
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#2E7D32] text-white">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-text-secondary">{formatPlacedAtLabel(order.createdAt)}</p>
            </div>
            <p className="shrink-0 text-[15px] font-bold text-text-primary">
              {formatOrderPrice(order.total, { withDecimals: false })}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-light text-text-secondary"
              aria-label="Order options"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
              {menuOpen ? (
                <div
                  className="absolute right-0 top-9 z-20 min-w-[160px] rounded-lg border border-border-light bg-white py-1 shadow-lg"
                  onClick={(e) => e.preventDefault()}
                >
                  <Link
                    to={`/orders/${order._id}`}
                    className="block px-4 py-2 text-sm text-text-primary hover:bg-mobile-surface"
                    onClick={() => setMenuOpen(false)}
                  >
                    View details
                  </Link>
                  <Link
                    to={`/orders/${order._id}/invoice`}
                    className="block px-4 py-2 text-sm text-text-primary hover:bg-mobile-surface"
                    onClick={() => setMenuOpen(false)}
                  >
                    Download invoice
                  </Link>
                </div>
              ) : null}
            </button>
          </div>

          <div className="hide-scrollbar mt-3.5 flex gap-2 overflow-x-auto pb-0.5">
            {thumbnails.map((item) => (
              <Product3DImage key={item.id} src={item.image} alt={item.name} size={56} />
            ))}
          </div>

          {isDelivered && rating ? (
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-secondary">Your delivery experience rating:</span>
              <StarRating rating={rating} />
            </div>
          ) : null}
        </Link>

        <div className="mt-3.5 border-t border-border-light">
          {isDelivered && !rating ? (
            <div className="grid grid-cols-2 divide-x divide-border-light">
              <button
                type="button"
                onClick={() => setRateOpen(true)}
                className="py-3.5 text-sm font-bold"
                style={{ color: ACTION_PINK }}
              >
                Rate Order
              </button>
              <button
                type="button"
                onClick={handleOrderAgain}
                className="py-3.5 text-sm font-bold"
                style={{ color: ACTION_PINK }}
              >
                Order Again
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOrderAgain}
              className="w-full py-3.5 text-sm font-bold"
              style={{ color: ACTION_PINK }}
            >
              Order Again
            </button>
          )}
        </div>
      </article>

      <RateOrderModal
        open={rateOpen}
        onClose={() => setRateOpen(false)}
        onSubmit={handleRateSubmit}
      />
    </>
  );
}

export default BlinkitOrderCard;
