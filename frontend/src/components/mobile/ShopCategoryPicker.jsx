import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import { sectionToStoreKey, storeToSection } from "../../utils/storeSection";
import MobileSearchBar from "./MobileSearchBar";

const FALLBACK_IMAGE = "/categories/category_vegetables.jpg";

function shopCategoryUrl(pathname, searchParams, categoryName = "") {
  const params = new URLSearchParams(searchParams);
  params.delete("categoryName");
  params.delete("base");
  params.delete("view");
  params.delete("q");
  if (categoryName) params.set("shopCategory", categoryName);
  else params.delete("shopCategory");
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function ShopCategoryPicker() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  const section = storeToSection(sectionToStoreKey(searchParams.get("store")));
  const activeName = searchParams.get("shopCategory")?.trim() || "";
  const { data: apiCategories = [] } = useCategoriesQuery({ section });

  const categories = useMemo(
    () =>
      (apiCategories || []).filter(
        (cat) => String(cat.categoryName || "").toLowerCase() !== "most purchase"
      ),
    [apiCategories]
  );

  const active = categories.find(
    (cat) => String(cat.categoryName || "").toLowerCase() === activeName.toLowerCase()
  );
  const thumb = active?.categoryImage || FALLBACK_IMAGE;

  useEffect(() => {
    if (!sheetOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  const choose = (name) => {
    setSheetOpen(false);
    navigate(shopCategoryUrl(pathname, searchParams, name));
  };

  if (searching) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <MobileSearchBar className="min-w-0 flex-1" autoFocus onSubmit={() => setSearching(false)} />
        <button
          type="button"
          onClick={() => setSearching(false)}
          aria-label="Close search"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Choose category"
          className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        </button>

        <div className="flex min-w-0 flex-col items-start">
          <button
            type="button"
            onClick={() => setSearching(true)}
            className="max-w-full truncate text-left text-[15px] font-medium leading-tight text-gray-400"
          >
            Search for Product
          </button>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            className="mt-0.5 flex max-w-full items-center gap-1 text-[15px] font-bold leading-tight text-[#0C831F]"
          >
            <span className="truncate">{active?.categoryName || "All Categories"}</span>
            <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={2.75} />
          </button>
        </div>
      </div>

      {sheetOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Categories">
          <button
            type="button"
            aria-label="Close categories"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/45"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-hidden rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="text-base font-bold text-gray-900">Categories</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid max-h-[calc(75vh-56px)] grid-cols-3 gap-3 overflow-y-auto p-4">
              <button
                type="button"
                onClick={() => choose("")}
                className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 text-center ${
                  !active ? "bg-[#0C831F]/10 text-[#0C831F]" : "text-gray-700"
                }`}
              >
                <span className="flex aspect-square w-full items-center justify-center rounded-xl bg-[#0C831F]/10 text-[#0C831F]">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="3" y="3" width="8" height="8" rx="2" />
                    <rect x="13" y="3" width="8" height="8" rx="2" />
                    <rect x="3" y="13" width="8" height="8" rx="2" />
                    <rect x="13" y="13" width="8" height="8" rx="2" />
                  </svg>
                </span>
                <span className="text-[12px] font-semibold leading-tight">All Categories</span>
              </button>
              {categories.map((cat) => {
                const isActive = active && active.categoryName === cat.categoryName;
                return (
                  <button
                    key={cat._id || cat.categoryName}
                    type="button"
                    onClick={() => choose(cat.categoryName)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 text-center ${
                      isActive ? "bg-[#0C831F]/10 text-[#0C831F]" : "text-gray-700"
                    }`}
                  >
                    <span className="aspect-square w-full overflow-hidden rounded-xl border border-gray-100 bg-white">
                      <img
                        src={cat.categoryImage || FALLBACK_IMAGE}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="line-clamp-2 text-[12px] font-semibold leading-tight">
                      {cat.categoryName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ShopCategoryPicker;
