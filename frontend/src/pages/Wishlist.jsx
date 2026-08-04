import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useProductCartActions } from "../hooks/useProductCartActions";
import DealProductCard from "../components/product/DealProductCard";

function Wishlist() {
  const { user, openAuthModal } = useAuth();
  const { items: wishlistItems, loading, loadWishlist } = useWishlist();
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  useEffect(() => {
    if (user) loadWishlist();
  }, [user, loadWishlist]);

  if (!user) {
    return (
      <div className="min-h-[60vh] bg-mobile-bg px-4 py-16 text-text-primary sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-3 text-2xl font-bold sm:text-3xl">My Wishlist</h1>
          <p className="mb-6 text-text-secondary">
            Please login to save and view your favourite products.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-bold tracking-wide text-white transition hover:brightness-110"
          >
            Login / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mobile-bg pb-24 text-text-primary lg:pb-8">
      <section className="bg-white px-4 py-4 pb-6 sm:px-6 md:px-8 md:pb-8">
        <div className="mx-auto w-full max-w-[1600px]">
          <h1 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl lg:text-3xl">
            My Wishlist
          </h1>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-[258px] animate-pulse rounded-xl border border-border-light bg-white"
                />
              ))}
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="rounded-xl border border-border-light bg-white py-16 text-center shadow-sm">
              <p className="mb-2 text-lg font-semibold">Your wishlist is empty</p>
              <p className="mb-6 text-sm text-text-secondary">
                Tap the heart on any product to save it here.
              </p>
              <Link
                to="/product"
                className="inline-block rounded-lg bg-primary px-8 py-3 text-sm font-bold tracking-wide text-white transition hover:brightness-110"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {wishlistItems.map((item) => (
                <DealProductCard
                  key={item._id}
                  product={item}
                  onAdd={handleAdd}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  cartQuantity={getCartQuantity(item)}
                  layout="grid"
                  addDisabled={loading}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Wishlist;
