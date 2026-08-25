import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, getProducts } from "../api/api";
import { useProductCartActions } from "../hooks/useProductCartActions";
import { useDeliveryLocationKey } from "../context/LocationContext";
import {
  DesktopCategorySidebar,
  ProductResultsGrid,
} from "../components/product/CategoryProductLayout";

function SortIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
    </svg>
  );
}

function MobilePageToolbar({ title, backTo, onToggleSort }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 bg-white px-3 py-2.5">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="inline-flex min-w-0 shrink items-center gap-0.5 text-text-primary"
      >
        <svg
          className="h-[18px] w-[18px] shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
        </svg>
        <span className="truncate text-[15px] font-bold leading-none">{title}</span>
      </button>

      <button
        type="button"
        onClick={onToggleSort}
        className="ml-auto flex shrink-0 items-center justify-center gap-1 rounded-lg border border-border-light px-3 py-1.5 text-xs font-semibold text-text-primary"
      >
        <SortIcon />
        Sort
      </button>
    </div>
  );
}

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "name", label: "Name A-Z" },
];

function FeaturedProductsPage({
  title,
  filterType,
  emptyMessage,
  backTo = "/",
}) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [showSort, setShowSort] = useState(false);
  const locationKey = useDeliveryLocationKey();

  const { getCartQuantity, handleIncrease, handleDecrease } = useProductCartActions();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const fetchParams =
          filterType === "justArrived"
            ? { justArrived: true }
            : { hotSelling: true };

        const [categoriesRes, productsRes] = await Promise.all([
          getCategories(),
          getProducts(fetchParams),
        ]);

        setCategories(categoriesRes.data.data || []);
        setProducts(productsRes?.data?.data || []);
      } catch {
        setCategories([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterType, locationKey]);

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === "price-asc") {
      list.sort((a, b) => (a.discountedPrice ?? a.price) - (b.discountedPrice ?? b.price));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => (b.discountedPrice ?? b.price) - (a.discountedPrice ?? a.price));
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [products, sortBy]);

  return (
    <div className="min-h-screen bg-mobile-bg pb-6 lg:flex lg:h-[calc(100vh-108px)] lg:min-h-0 lg:flex-col lg:overflow-hidden lg:pb-0">
      <div className="lg:hidden">
        <MobilePageToolbar
          title={title}
          backTo={backTo}
          onToggleSort={() => setShowSort((prev) => !prev)}
        />
        {showSort && (
          <div className="border-b border-border-light bg-white px-4 py-1.5">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSortBy(option.id);
                  setShowSort(false);
                }}
                className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm ${
                  sortBy === option.id
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-text-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        <div className="bg-mobile-bg px-3 py-3">
          <ProductResultsGrid
            products={sortedProducts}
            loading={loading}
            onAdd={handleIncrease}
            onGetCartQuantity={getCartQuantity}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            emptyMessage={emptyMessage}
          />
        </div>
      </div>

      <div className="hidden lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="mx-auto grid h-full min-h-0 w-full max-w-[1600px] grid-cols-[240px_1fr] bg-mobile-bg xl:grid-cols-[260px_1fr]">
          <DesktopCategorySidebar categories={categories} activeCategory="" />
          <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto border-l border-border-light bg-white px-3 py-4 lg:px-6 lg:py-5">
            <h1 className="mb-4 text-xl font-bold text-text-primary">{title}</h1>
            <ProductResultsGrid
              products={sortedProducts}
              loading={loading}
              onAdd={handleIncrease}
              onGetCartQuantity={getCartQuantity}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              emptyMessage={emptyMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeaturedProductsPage;
