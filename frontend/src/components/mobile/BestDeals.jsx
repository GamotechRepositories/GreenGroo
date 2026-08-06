import { useEffect, useState } from "react";
import { getProducts } from "../../api/api";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import SectionHeader from "./SectionHeader";
import DealProductCard from "../product/DealProductCard";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import HorizontalScrollRow from "../home/HorizontalScrollRow";

const HOME_PRODUCT_LIMIT = 8;

const FALLBACK_PRODUCTS = [
  { _id: "1", name: "Fresh Apples", sub: "1 kg", price: 165, discountedPrice: 149 },
  { _id: "2", name: "Organic Spinach", sub: "500 g", price: 49, discountedPrice: 39 },
  { _id: "3", name: "Bananas", sub: "1 dozen", price: 89, discountedPrice: 79 },
  { _id: "4", name: "Tomatoes", sub: "1 kg", price: 45, discountedPrice: 45 },
  { _id: "5", name: "Carrots", sub: "500 g", price: 35, discountedPrice: 29 },
  { _id: "6", name: "Broccoli", sub: "500 g", price: 79, discountedPrice: 69 },
  { _id: "7", name: "Oranges", sub: "1 kg", price: 99, discountedPrice: 89 },
  { _id: "8", name: "Onions", sub: "1 kg", price: 40, discountedPrice: 36 },
];

function BestDeals({ title = "Previously bought", viewAllTo = "/product" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await getProducts({ limit: HOME_PRODUCT_LIMIT });
        const list = (data.data || []).slice(0, HOME_PRODUCT_LIMIT);
        setProducts(list.length > 0 ? list : FALLBACK_PRODUCTS);
      } catch {
        setProducts(FALLBACK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const displayProducts = (loading ? FALLBACK_PRODUCTS : products).slice(0, HOME_PRODUCT_LIMIT);

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  const skeleton = (key, className) => (
    <div
      key={key}
      className={`animate-pulse rounded-xl bg-[#f5f5f5] ${className}`}
    />
  );

  return (
    <section className="px-4 py-4 sm:px-6 lg:px-6 lg:py-5 xl:px-8">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeader title={title} viewAllTo={viewAllTo} className="mb-4" />

        {loading ? (
          <>
            <div className="lg:hidden">
              <HorizontalScrollRow gapClassName="gap-3">
                {Array.from({ length: 6 }).map((_, i) =>
                  skeleton(`m-${i}`, "h-[200px] w-[128px] shrink-0 sm:w-[140px]")
                )}
              </HorizontalScrollRow>
            </div>
            <div className="hidden gap-3 lg:grid lg:grid-cols-8 lg:grid-rows-1">
              {Array.from({ length: 8 }).map((_, i) => skeleton(`d-${i}`, "h-[280px] rounded-2xl"))}
            </div>
          </>
        ) : (
          <>
            <div className="lg:hidden">
              <HorizontalScrollRow gapClassName="gap-3">
                {displayProducts.map((product) => (
                  <QuickCommerceProductCard key={product._id} {...cardProps(product)} />
                ))}
              </HorizontalScrollRow>
            </div>
            <div className="hidden gap-3 lg:grid lg:grid-cols-8 lg:grid-rows-1">
              {displayProducts.slice(0, 8).map((product) => (
                <DealProductCard key={product._id} {...cardProps(product)} layout="grid" />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default BestDeals;
