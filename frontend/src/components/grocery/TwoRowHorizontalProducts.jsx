import QuickCommerceProductCard from "../product/QuickCommerceProductCard";

function ProductScrollRow({ products, cardProps }) {
  if (!products?.length) return null;

  return (
    <div
      className="hide-scrollbar flex gap-2.5 overflow-x-auto overflow-y-hidden"
      style={{ overscrollBehavior: "auto" }}
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
