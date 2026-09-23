import { Link } from "react-router-dom";
import { addCategoryVisit } from "../../utils/categoryVisits";
import { buildStoreProductUrl } from "../../utils/storeSection";

function CategoryCard({ cat, size = "default", store = "" }) {
  // Prefer display name for routing — API `slug` can drift from `categoryName`
  // and break product filters (e.g. slug "Chopped" vs name "Chopped Vegies").
  const name = cat.name || cat.categoryName || "";
  const routeName = name || cat.slug || "";
  const image = cat.image || cat.categoryImage;
  const bg = cat.bg || cat.bgColor || "#E2F0D9";
  const visitName = name || routeName;

  return (
    <Link
      to={buildStoreProductUrl({ categoryName: routeName, store })}
      onClick={() => addCategoryVisit(visitName)}
      className="group relative flex cursor-pointer overflow-hidden rounded-[14px] sm:rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow border border-black/5"
      style={{
        background: `linear-gradient(135deg, ${bg} 0%, ${bg} 55%, #f4f1ea 55%, #f4f1ea 100%)`,
      }}
    >
      {/* Square aspect ratio trick */}
      <div className="w-full pb-[100%]" />

      {/* Text Container at Top Left */}
      <div className="absolute inset-0 p-3 sm:p-4 flex flex-col z-10 pointer-events-none">
        <h3 
          className="font-black uppercase leading-[1.1] tracking-tight text-gray-900/60 mix-blend-multiply w-[70%] sm:w-[65%]"
          style={{ fontSize: "clamp(0.85rem, 3.5vw, 1.15rem)" }}
        >
          {name}
        </h3>
      </div>

      {/* Image at Bottom Right */}
      {image ? (
        <img
          src={image}
          alt={name}
          className="absolute right-0 bottom-0 w-[80%] h-[80%] object-contain object-right-bottom transition-transform duration-300 group-hover:scale-105 origin-bottom-right drop-shadow-md"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : cat.emoji ? (
        <div className="absolute right-2 bottom-2 text-4xl sm:text-5xl transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">
          {cat.emoji}
        </div>
      ) : null}
    </Link>
  );
}

export default CategoryCard;
