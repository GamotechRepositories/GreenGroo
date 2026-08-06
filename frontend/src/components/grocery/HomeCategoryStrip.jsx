import { Link } from "react-router-dom";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import CategoryIcon from "./CategoryIcon";

const CATEGORY_IMAGES = {
  fruits: "/fruits.png",
  fruit: "/fruits.png",
  vegetables: "/vegetables.png",
  vegetable: "/vegetables.png",
  veggies: "/vegetables.png",
  organic: "/organic.png",
  dairy: "/dairy.png",
  milk: "/dairy.png",
};

const STRIP_BG = "#ffffff";
const BORDER_COLOR = "#1a1a1a";
const NAV_HORIZONTAL_PAD = 12; // matches nav px-3

const ICON_SIZE = 20;
const ICON_GAP = 3;
const LABEL_ROW_H = 16;
const LABEL_BOTTOM_PAD = 4;
const HUMP_H = 16;

function getCategoryImage(name, apiImage) {
  const key = String(name || "").trim().toLowerCase();
  if (CATEGORY_IMAGES[key]) return CATEGORY_IMAGES[key];
  if (key.includes("fruit")) return "/fruits.png";
  if (key.includes("vegetable") || key.includes("veggie")) return "/vegetables.png";
  if (key.includes("organic")) return "/organic.png";
  if (key.includes("dairy") || key.includes("milk")) return "/dairy.png";
  return apiImage || null;
}

function isFruitsCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "fruits" || key === "fruit" || key.includes("fruit");
}

function isVegetablesCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "vegetables" || key === "vegetable" || key.includes("vegetable") || key.includes("veggie");
}

function isOrganicCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "organic" || key.includes("organic");
}

function isDairyCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "dairy" || key === "milk" || key.includes("dairy") || key.includes("milk");
}

function applyLocalCategoryImages(categories) {
  return categories.map((cat) => {
    if (isFruitsCategory(cat.name)) return { ...cat, image: "/fruits.png" };
    if (isVegetablesCategory(cat.name)) return { ...cat, image: "/vegetables.png" };
    if (isOrganicCategory(cat.name)) return { ...cat, image: "/organic.png" };
    if (isDairyCategory(cat.name)) return { ...cat, image: "/dairy.png" };
    return cat;
  });
}

function buildBorderPath(width, humpLeft, humpRight) {
  if (width <= 0) return "";

  const y = HUMP_H;
  const top = y - HUMP_H;
  const r = 5;
  const shoulder = 5;

  if (humpLeft == null || humpRight == null || humpRight <= humpLeft) {
    return `M 0 ${y} H ${width}`;
  }

  const left = Math.max(shoulder + 2, humpLeft);
  const right = Math.min(width - shoulder - 2, humpRight);

  return [
    `M 0 ${y}`,
    `H ${left - shoulder}`,
    `C ${left - shoulder * 0.55} ${y} ${left - shoulder * 0.35} ${y - 2.5} ${left} ${y - 5}`,
    `L ${left} ${top + r}`,
    `Q ${left} ${top} ${left + r} ${top}`,
    `H ${right - r}`,
    `Q ${right} ${top} ${right} ${top + r}`,
    `L ${right} ${y - 5}`,
    `C ${right + shoulder * 0.35} ${y - 2.5} ${right + shoulder * 0.55} ${y} ${right + shoulder} ${y}`,
    `H ${width}`,
  ].join(" ");
}

function buildHumpFillPath(humpLeft, humpRight) {
  if (humpLeft == null || humpRight == null || humpRight <= humpLeft) return "";

  const y = HUMP_H;
  const top = y - HUMP_H;
  const r = 5;
  const shoulder = 5;
  const left = humpLeft;
  const right = humpRight;

  return [
    `M ${left - shoulder} ${y}`,
    `C ${left - shoulder * 0.55} ${y} ${left - shoulder * 0.35} ${y - 2.5} ${left} ${y - 5}`,
    `L ${left} ${top + r}`,
    `Q ${left} ${top} ${left + r} ${top}`,
    `H ${right - r}`,
    `Q ${right} ${top} ${right} ${top + r}`,
    `L ${right} ${y - 5}`,
    `C ${right + shoulder * 0.35} ${y - 2.5} ${right + shoulder * 0.55} ${y} ${right + shoulder} ${y}`,
    `L ${right + shoulder} ${y + 1}`,
    `L ${left - shoulder} ${y + 1}`,
    "Z",
  ].join(" ");
}

function BasketFilledIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5.25 6.75h13.5l-.9 9.45a2.25 2.25 0 01-2.24 2.05H8.39a2.25 2.25 0 01-2.24-2.05L5.25 6.75z" />
      <path
        d="M8.25 6.75V5.25a3.75 3.75 0 017.5 0v1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function BasketOutlineIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.4}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16l-1.2 9.2A2 2 0 0116.82 21H7.18a2 2 0 01-1.98-1.8L4 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}

function CategoryTabIcon({ cat, index, isActive, isAll }) {
  if (isAll) {
    return isActive ? (
      <BasketFilledIcon />
    ) : (
      <BasketOutlineIcon className="text-[#4b5563]" />
    );
  }

  if (cat.image) {
    return <img src={cat.image} alt="" className="h-5 w-5 object-contain" />;
  }

  return <CategoryIcon name={cat.name} index={index} className="h-5 w-5" />;
}

function HomeCategoryStrip() {
  const { data: apiCategories = [] } = useCategoriesQuery();
  const [activeCategory, setActiveCategory] = useState("All");
  const navRef = useRef(null);
  const labelRefs = useRef({});
  const [borderPath, setBorderPath] = useState("");
  const [fillPath, setFillPath] = useState("");
  const [svgWidth, setSvgWidth] = useState(0);

  const categories = useMemo(() => {
    const filtered = apiCategories.filter(
      (cat) => cat.categoryName?.toLowerCase() !== "most purchase"
    );

    const defaults = [
      { name: "All", slug: "" },
      { name: "Fruits", slug: "Fruits", image: "/fruits.png" },
      { name: "Vegetables", slug: "Vegetables", image: "/vegetables.png" },
      { name: "Organic", slug: "Organic", image: "/organic.png" },
      { name: "Dairy", slug: "Dairy", image: "/dairy.png" },
    ];

    if (!filtered.length) return defaults;

    const fromApi = filtered.slice(0, 8).map((cat) => ({
      name: cat.categoryName,
      slug: cat.categoryName,
      image: getCategoryImage(cat.categoryName, cat.categoryImage),
    }));

    const hasFruits = fromApi.some((cat) => isFruitsCategory(cat.name));
    const hasVegetables = fromApi.some((cat) => isVegetablesCategory(cat.name));
    const hasOrganic = fromApi.some((cat) => isOrganicCategory(cat.name));
    const hasDairy = fromApi.some((cat) => isDairyCategory(cat.name));
    const list = [{ name: "All", slug: "" }, ...fromApi];

    if (!hasFruits) {
      list.splice(1, 0, { name: "Fruits", slug: "Fruits", image: "/fruits.png" });
    }
    if (!hasVegetables) {
      const insertAt = list.findIndex((cat) => isFruitsCategory(cat.name)) + 1 || 2;
      list.splice(insertAt, 0, {
        name: "Vegetables",
        slug: "Vegetables",
        image: "/vegetables.png",
      });
    }
    if (!hasOrganic) {
      const vegIndex = list.findIndex((cat) => isVegetablesCategory(cat.name));
      const insertAt = vegIndex >= 0 ? vegIndex + 1 : list.length;
      list.splice(insertAt, 0, {
        name: "Organic",
        slug: "Organic",
        image: "/organic.png",
      });
    }
    if (!hasDairy) {
      const organicIndex = list.findIndex((cat) => isOrganicCategory(cat.name));
      const insertAt = organicIndex >= 0 ? organicIndex + 1 : list.length;
      list.splice(insertAt, 0, {
        name: "Dairy",
        slug: "Dairy",
        image: "/dairy.png",
      });
    }

    return applyLocalCategoryImages(list).slice(0, 5);
  }, [apiCategories]);

  const updateBorder = useCallback(() => {
    const nav = navRef.current;
    const label = labelRefs.current[activeCategory];
    if (!nav) return;

    const navRect = nav.getBoundingClientRect();
    const innerWidth = navRect.width;
    const width = innerWidth + NAV_HORIZONTAL_PAD * 2;
    let humpLeft = null;
    let humpRight = null;

    if (label) {
      const labelRect = label.getBoundingClientRect();
      const pad = 3;
      humpLeft = labelRect.left - navRect.left - pad + NAV_HORIZONTAL_PAD;
      humpRight = labelRect.right - navRect.left + pad + NAV_HORIZONTAL_PAD;
    }

    setSvgWidth(width);
    setBorderPath(buildBorderPath(width, humpLeft, humpRight));
    setFillPath(buildHumpFillPath(humpLeft, humpRight));
  }, [activeCategory]);

  useLayoutEffect(() => {
    updateBorder();

    const nav = navRef.current;
    if (!nav) return undefined;

    const observer = new ResizeObserver(updateBorder);
    observer.observe(nav);

    window.addEventListener("resize", updateBorder);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateBorder);
    };
  }, [updateBorder, categories]);

  const baselineTop = ICON_SIZE + ICON_GAP + LABEL_ROW_H - HUMP_H;

  return (
    <nav className="bg-white px-3 pb-0 pt-2">
      <div ref={navRef} className="relative flex w-full">
        {categories.map((cat, index) => {
          const isActive = activeCategory === cat.name;
          const to = cat.slug
            ? `/product?categoryName=${encodeURIComponent(cat.slug)}`
            : "/product";
          const isAll = cat.name === "All";

          return (
            <Link
              key={cat.name}
              to={to}
              onClick={() => setActiveCategory(cat.name)}
              className={`relative flex min-w-0 flex-1 flex-col items-center ${
                isActive ? "z-10 text-[#1a1a1a]" : "z-0 text-[#4b5563]"
              }`}
            >
              <div
                className="flex shrink-0 items-center justify-center"
                style={{ width: ICON_SIZE, height: ICON_SIZE, marginBottom: ICON_GAP }}
              >
                <CategoryTabIcon cat={cat} index={index} isActive={isActive} isAll={isAll} />
              </div>

              {/* All labels share the same row height */}
              <span
                ref={(node) => {
                  if (isActive) labelRefs.current[cat.name] = node;
                }}
                className={`relative z-[1] flex w-full items-end justify-center px-0.5 text-center text-[10px] leading-none ${
                  isActive ? "font-bold" : "font-normal"
                }`}
                style={{ height: LABEL_ROW_H, paddingBottom: LABEL_BOTTOM_PAD }}
              >
                {cat.name}
              </span>
            </Link>
          );
        })}

        <svg
          className="pointer-events-none absolute overflow-visible"
          style={{
            top: baselineTop,
            height: HUMP_H + 1,
            left: -NAV_HORIZONTAL_PAD,
            width: `calc(100% + ${NAV_HORIZONTAL_PAD * 2}px)`,
          }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="categoryStripLineGradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2={svgWidth || "100%"}
              y2="0"
            >
              <stop offset="0%" stopColor={BORDER_COLOR} />
              <stop offset="50%" stopColor={BORDER_COLOR} />
              <stop offset="100%" stopColor={STRIP_BG} />
            </linearGradient>
          </defs>
          {fillPath ? <path d={fillPath} fill={STRIP_BG} /> : null}
          {borderPath ? (
            <path
              d={borderPath}
              fill="none"
              stroke="url(#categoryStripLineGradient)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
      </div>
    </nav>
  );
}

export default HomeCategoryStrip;
