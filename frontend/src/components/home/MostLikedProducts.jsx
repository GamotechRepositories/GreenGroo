import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../../api/api";
import ProductImageFrame from "../product/ProductImageFrame";
import ProductPriceDisplay from "../product/ProductPriceDisplay";

const MAX_DISPLAY = 15;
const GRID_COLS = 5;

function ProductCard({ product }) {
  const categoryLabel = product.subcategory || product.categories?.[0] || "";
  const image = product.productImages?.[0];

  return (
    <Link
      to={`/product/${product._id}`}
      className="group flex flex-col rounded-2xl border border-neutral-700 bg-neutral-900 overflow-hidden hover:border-accent/50 transition-all h-full"
    >
      <div className="relative overflow-hidden bg-neutral-800">
        {product.ratings >= 4.5 && (
          <span className="absolute top-2 left-2 z-10 rounded bg-black text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5">
            Bestseller
          </span>
        )}
        <ProductImageFrame src={image} alt={product.name} />
      </div>

      <div className="flex items-center justify-between gap-2 bg-[#facc15] px-2.5 py-1.5 text-[10px] sm:text-xs font-semibold text-black">
        <span className="truncate">{categoryLabel || "Featured"}</span>
        <span className="shrink-0 flex items-center gap-0.5">
          <span className="text-black">★</span>
          {product.ratings?.toFixed(1) ?? "0.0"}
        </span>
      </div>

      <div className="px-3 py-3 sm:px-4 sm:py-4 flex-1 flex flex-col">
        <h3
          className="mb-3 truncate text-sm font-bold leading-tight text-white sm:text-base"
          title={product.name}
        >
          {product.name}
        </h3>

        <ProductPriceDisplay
          product={product}
          size="md"
          className="mt-auto [&_span:last-child]:text-white"
        />
      </div>
    </Link>
  );
}

function MostLikedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await getProducts({
          mostPurchase: true,
          limit: MAX_DISPLAY,
        });
        const list = (data.data || [])
          .filter((product) =>
            product.categories?.some(
              (cat) => cat.trim().toLowerCase() === "most purchase"
            )
          )
          .sort((a, b) => (b.ratings ?? 0) - (a.ratings ?? 0))
          .slice(0, MAX_DISPLAY);
        setProducts(list);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="bg-black px-5 sm:px-6 md:px-8 lg:px-12 py-10 md:py-12 border-t border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-bold text-white">
              Most Purchase
            </h2>
            {!loading && products.length > 0 && (
              <p className="mt-2 text-sm sm:text-base text-neutral-400">
                Top picks tagged with Most Purchase
              </p>
            )}
          </div>
          {!loading && products.length > 0 && (
            <Link
              to="/product"
              className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-accent px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wide text-accent hover:bg-accent/10 transition"
            >
              View All
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(GRID_COLS)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-neutral-700 bg-neutral-900 animate-pulse"
              >
                <div className="product-image animate-pulse bg-mobile-surface" />
                <div className="h-8 bg-yellow-500/30" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-neutral-800 rounded w-3/4" />
                  <div className="h-6 bg-neutral-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-neutral-400 py-10">
            No products tagged with Most Purchase yet. Add &quot;Most Purchase&quot;
            as a second category on your products.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default MostLikedProducts;
