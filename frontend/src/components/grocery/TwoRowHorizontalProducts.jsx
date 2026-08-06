import { useRef } from "react";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";

function ProductScrollRow({ products, cardProps }) {
  const rowRef = useRef(null);
  const touchRef = useRef({ x: 0, y: 0, axis: null });

  if (!products?.length) return null;

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, axis: null };
    if (rowRef.current) rowRef.current.style.overflowX = "auto";
  };

  const onTouchMove = (e) => {
    if (touchRef.current.axis != null) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchRef.current.x);
    const dy = Math.abs(t.clientY - touchRef.current.y);
    if (dx < 6 && dy < 6) return;

    // Vertical gesture → unlock page scroll; horizontal → keep row scroll
    touchRef.current.axis = dy > dx ? "y" : "x";
    if (touchRef.current.axis === "y" && rowRef.current) {
      rowRef.current.style.overflowX = "hidden";
    }
  };

  const onTouchEnd = () => {
    if (rowRef.current) rowRef.current.style.overflowX = "auto";
    touchRef.current.axis = null;
  };

  return (
    <div
      ref={rowRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      className="hide-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth"
      style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x pan-y" }}
    >
      {products.map((product) => (
        <div
          key={product._id}
          className="w-[calc((100vw-2rem-1.875rem)/3.2)] shrink-0"
        >
          <QuickCommerceProductCard
            {...cardProps(product)}
            layout="grid"
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Home (All): 2 independent horizontal scroll rows
 * Category pages: static 3-col grid, no scroll
 */
function TwoRowHorizontalProducts({ products, cardProps, scroll = true }) {
  if (!products?.length) return null;

  if (!scroll) {
    return (
      <div className="grid grid-cols-3 gap-2.5">
        {products.map((product) => (
          <QuickCommerceProductCard
            key={product._id}
            {...cardProps(product)}
            layout="grid"
          />
        ))}
      </div>
    );
  }

  const mid = Math.ceil(products.length / 2);
  const row1 = products.slice(0, mid);
  const row2 = products.slice(mid);

  return (
    <div className="flex flex-col gap-2.5">
      <ProductScrollRow products={row1} cardProps={cardProps} />
      <ProductScrollRow products={row2} cardProps={cardProps} />
    </div>
  );
}

export default TwoRowHorizontalProducts;
