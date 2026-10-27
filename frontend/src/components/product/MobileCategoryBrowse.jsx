import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { SHOP_BY_CATEGORY_ITEMS } from "../home/ShopByCategory";
import { buildStoreProductUrl, sectionToStoreKey, storeToSection } from "../../utils/storeSection";
import { groupBaseProducts, productImage } from "../../utils/baseProducts";
import { useInfiniteProductsQuery } from "../../hooks/queries/useProductsQuery";
import OptimizedImg from "../common/OptimizedImg";

function productSubtitle(product) {
  const sale = product?.discountedPrice ?? product?.price;
  const price = sale != null && sale !== "" ? `₹${Math.round(Number(sale))}` : "";
  const unit = String(product?.unit || "").trim();
  return [unit, price].filter(Boolean).join(" · ");
}

function bannerCopy(categoryName) {
  const key = String(categoryName || "").toLowerCase();
  if (key.includes("fruit")) {
    return { title: "Nature's Sweetness\nin Every Bite", kicker: "Premium | Organic | Farm Fresh" };
  }
  if (key.includes("veg")) {
    return { title: "Farm Fresh Greens\nin Every Basket", kicker: "Premium | Organic | Farm Fresh" };
  }
  return { title: categoryName || "Shop", kicker: "Premium | Organic | Farm Fresh" };
}

function MobileCategoryBrowse({ categories = [], categoryName, products = [], loading }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartCount } = useCart();
  const [showAll, setShowAll] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const currentStore = sectionToStoreKey(searchParams.get("store"));
  const baseKey = searchParams.get("base") || "";
  const allParams = useMemo(
    () => (currentStore && currentStore !== "main" ? { section: storeToSection(currentStore) } : {}),
    [currentStore]
  );
  const {
    data: allData,
    isLoading: allLoading,
    hasNextPage: allHasNext,
    isFetchingNextPage: allFetching,
    fetchNextPage: fetchAllNext,
  } = useInfiniteProductsQuery(allParams, { enabled: showAll });

  // Search filters loaded products on the device, so it needs every page.
  const searching = query.trim().length > 0;
  useEffect(() => {
    if (showAll && searching && allHasNext && !allFetching) fetchAllNext();
  }, [showAll, searching, allHasNext, allFetching, fetchAllNext]);

  const loadMoreRef = useRef(null);
  const canLoadMore = showAll && allHasNext && !allFetching;
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!canLoadMore || !node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) fetchAllNext();
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, fetchAllNext]);

  useEffect(() => {
    setShowAll(false);
    setQuery("");
  }, [categoryName]);

  const category = categories.find(
    (item) => String(item.categoryName || "").toLowerCase() === String(categoryName || "").toLowerCase()
  );
  const activeShop =
    SHOP_BY_CATEGORY_ITEMS.find((item) => item.name.toLowerCase() === String(categoryName || "").toLowerCase()) ||
    SHOP_BY_CATEGORY_ITEMS.find(
      (item) => item.categoryFilter.toLowerCase() === String(categoryName || "").toLowerCase()
    );
  const baseCards = useMemo(() => groupBaseProducts(products), [products]);
  const activeBase = !showAll && baseKey ? baseCards.find((card) => card.id === baseKey) : null;
  const pageTitle = showAll ? "All" : activeBase?.title || categoryName;
  const banner = showAll
    ? { title: "All Products\nin One Place", kicker: "Premium | Organic | Farm Fresh" }
    : activeBase
      ? { title: activeBase.title, kicker: categoryName || "Premium | Organic | Farm Fresh" }
      : bannerCopy(categoryName);
  const bannerImage =
    activeBase?.image ||
    category?.categoryImage ||
    products.map(productImage).find(Boolean) ||
    "/categories/category_fruits.jpg";

  const allProducts = useMemo(
    () => allData?.pages.flatMap((page) => page.products) ?? [],
    [allData]
  );

  const categoryUrl = buildStoreProductUrl({ categoryName, store: currentStore });

  const cards = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const toProductCard = (product) => ({
      id: product._id,
      title: product.name || "Product",
      subtitle: productSubtitle(product),
      image: productImage(product),
      href: `/product/${product._id}`,
      marked: Boolean(product.hotSelling || product.badge),
    });
    if (showAll) {
      return allProducts
        .filter((product) => (needle ? String(product.name || "").toLowerCase().includes(needle) : true))
        .map(toProductCard);
    }
    if (activeBase) {
      return activeBase.items
        .filter((product) => (needle ? String(product.name || "").toLowerCase().includes(needle) : true))
        .map(toProductCard);
    }
    return baseCards
      .filter((card) => (needle ? card.title.toLowerCase().includes(needle) : true))
      .map((card) => ({
        id: card.id,
        title: card.title,
        subtitle: `(${card.countLabel})`,
        image: card.image,
        href: buildStoreProductUrl({
          categoryName,
          store: currentStore,
          extraParams: { base: card.id },
        }),
        marked: card.marked,
      }));
  }, [products, allProducts, baseCards, activeBase, query, showAll, categoryName, currentStore]);

  return (
    <div className="min-h-screen bg-[#f7f8f6] pb-6">
      <header className="sticky top-0 z-40 bg-white px-3 py-2.5">
        <div className="grid grid-cols-[40px_1fr_auto] items-center">
          <button
            type="button"
            onClick={() => {
              if (baseKey && !showAll) {
                navigate(categoryUrl);
                return;
              }
              navigate(-1);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-800"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-center text-[18px] font-semibold text-slate-900">{pageTitle}</h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-800"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              to="/cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-800"
              aria-label="Cart"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
              {cartCount > 0 ? (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#1f8a3b] ring-2 ring-white" />
              ) : null}
            </Link>
          </div>
        </div>
        {searchOpen ? (
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search in ${pageTitle}`}
            className="mt-2 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-emerald-600"
            autoFocus
          />
        ) : null}
      </header>

      <div className="px-3 pt-2">
        <div className="relative overflow-hidden rounded-[22px] bg-[#f3ecdc]">
          <OptimizedImg src={bannerImage} alt="" className="absolute inset-y-0 right-0 h-full w-[58%] object-cover" />
          <div className="absolute inset-y-0 right-0 w-[58%] bg-gradient-to-r from-[#f3ecdc] via-[#f3ecdc]/35 to-transparent" />
          <div className="relative z-10 max-w-[62%] px-4 py-5">
            <h2 className="whitespace-pre-line font-serif text-[26px] font-semibold leading-[1.05] text-[#163528]">
              {banner.title}
            </h2>
            <p className="mt-2 text-[11px] font-medium tracking-wide text-[#3e6b4f]">{banner.kicker}</p>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setShowAll(true);
              if (baseKey) navigate(categoryUrl, { replace: true });
            }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold ${
              showAll ? "bg-[#1f6b3a] text-white" : "bg-[#eef1ee] text-slate-700"
            }`}
          >
            All
          </button>
          {SHOP_BY_CATEGORY_ITEMS.map((item) => {
            const active = !showAll && activeShop?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setShowAll(false);
                  if (item.categoryFilter.toLowerCase() !== String(categoryName || "").toLowerCase()) {
                    navigate(buildStoreProductUrl({ categoryName: item.categoryFilter, store: currentStore }));
                  }
                }}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold ${
                  active ? "bg-[#1f6b3a] text-white" : "bg-[#eef1ee] text-slate-700"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {(showAll ? allLoading && cards.length === 0 : loading) ? (
        <p className="px-4 py-10 text-center text-sm text-slate-400">Loading {pageTitle}…</p>
      ) : cards.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-slate-400">No items in {pageTitle} yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-3 pt-2">
          {cards.map((card) => (
            <Link
              key={card.id}
              to={card.href}
              className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
            >
              <div className="relative bg-white px-2 pt-2">
                {card.image ? (
                  <OptimizedImg src={card.image} alt="" loading="lazy" className="aspect-[5/4] w-full object-contain" />
                ) : (
                  <div className="aspect-[5/4] w-full bg-slate-50" />
                )}
                {card.marked ? (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#e11d48] text-[10px] font-bold text-white">
                    ♥
                  </span>
                ) : null}
              </div>
              <div className="px-3 pb-3 pt-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-[15px] font-semibold text-slate-900">{card.title}</p>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
                {card.subtitle ? <p className="text-[12px] text-slate-400">{card.subtitle}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
      {showAll && allHasNext ? <div ref={loadMoreRef} className="h-px" aria-hidden="true" /> : null}
    </div>
  );
}

export default MobileCategoryBrowse;
