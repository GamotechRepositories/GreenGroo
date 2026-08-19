import { Link } from "react-router-dom";

function CategoryCard({ cat, size = "default" }) {
  const isLarge = size === "lg";
  const name = cat.name || cat.categoryName || "";
  const slug = cat.slug || cat.categoryName || cat.name || "";
  const image = cat.image || cat.categoryImage;
  const items = cat.items || cat.itemCount || (cat.productCount ? `${cat.productCount}+ items` : "");
  const bg = cat.bg || cat.bgColor || "#E8F5E9";

  return (
    <Link
      to={`/product?categoryName=${encodeURIComponent(slug)}`}
      className={`group relative flex items-stretch overflow-hidden rounded-xl transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl ${
        isLarge
          ? "h-[100px] sm:h-[110px] lg:h-[120px]"
          : "h-[76px] sm:h-[88px] lg:h-[100px]"
      } ${cat.bgClass || ""}`}
      style={image ? undefined : { backgroundColor: bg }}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover object-right transition duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}

      <div
        className={`relative z-10 flex min-w-0 flex-1 flex-col justify-center ${
          isLarge ? "py-3 pl-4 pr-2" : "py-2 pl-2.5 pr-1 sm:py-3 sm:pl-3.5 lg:pl-4"
        }`}
      >
        <h3
          className={`truncate font-bold leading-tight text-text-primary ${
            isLarge ? "text-sm sm:text-base" : "text-[11px] sm:text-sm lg:text-[15px]"
          }`}
        >
          {name}
        </h3>
        {items ? (
          <p
            className={`font-medium text-text-secondary ${
              isLarge ? "mt-1 text-xs sm:text-sm" : "mt-0.5 text-[9px] sm:mt-1 sm:text-[11px] lg:text-xs"
            }`}
          >
            {items.includes("item") ? items : `${items} items`}
          </p>
        ) : null}
      </div>

      {!image && cat.emoji ? (
        <div className="relative flex w-[42%] shrink-0 items-end justify-end sm:w-[44%]">
          <span
            className={`translate-x-0.5 translate-y-1 leading-none transition duration-200 group-hover:scale-105 ${
              isLarge
                ? "pr-1 text-[2.75rem] sm:text-[3.25rem]"
                : "pr-0.5 text-[2rem] sm:pr-1 sm:text-[2.75rem] lg:text-[3.25rem]"
            }`}
            aria-hidden="true"
          >
            {cat.emoji}
          </span>
        </div>
      ) : (
        <div className="relative w-[42%] shrink-0 sm:w-[44%]" aria-hidden="true" />
      )}
    </Link>
  );
}

export default CategoryCard;
