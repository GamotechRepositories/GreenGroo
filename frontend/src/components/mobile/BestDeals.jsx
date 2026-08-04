import { useEffect, useState } from "react";
import { getProducts } from "../../api/api";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import SectionHeader from "./SectionHeader";
import DealProductCard from "../product/DealProductCard";
import HorizontalScrollRow from "../home/HorizontalScrollRow";

const HOME_PRODUCT_LIMIT = 12;

const FALLBACK_PRODUCTS = [
  { _id: "1", name: "Fast Charger", sub: "20W", price: 165, discountedPrice: 165 },
  { _id: "2", name: "Bass Edition", sub: "Neckband", price: 299, discountedPrice: 299 },
  { _id: "3", name: "Type-C Cable", sub: "1M", price: 89, discountedPrice: 89 },
  { _id: "4", name: "Power Bank", sub: "10000mAh", price: 799, discountedPrice: 799 },
  { _id: "5", name: "Earbuds Pro", sub: "Wireless", price: 499, discountedPrice: 499 },
  { _id: "6", name: "Car Charger", sub: "Dual Port", price: 249, discountedPrice: 249 },
  { _id: "7", name: "Data Cable", sub: "3A Fast", price: 129, discountedPrice: 129 },
  { _id: "8", name: "Neckband Pro", sub: "BT 5.0", price: 349, discountedPrice: 349 },
  { _id: "9", name: "Wall Adapter", sub: "18W", price: 199, discountedPrice: 199 },
  { _id: "10", name: "Tempered Glass", sub: "9H", price: 99, discountedPrice: 99 },
  { _id: "11", name: "BT Speaker", sub: "Mini", price: 599, discountedPrice: 599 },
  { _id: "12", name: "Mobile Cover", sub: "Silicone", price: 149, discountedPrice: 149 },
];

function BestDeals() {
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
    layout: "scroll",
  });

  return (
    <section className="bg-white px-4 sm:px-6 md:px-8">
      <SectionHeader title="Best Prices Unbeatable Deals" viewAllTo="/product" className="mb-2" />

      {loading ? (
        <HorizontalScrollRow>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`deals-skeleton-${index}`}
              className="h-[258px] w-[150px] shrink-0 animate-pulse rounded-xl border border-border-light bg-gray-100 sm:w-[165px]"
            />
          ))}
        </HorizontalScrollRow>
      ) : (
        <HorizontalScrollRow>
          {displayProducts.map((product) => (
            <DealProductCard key={product._id} {...cardProps(product)} />
          ))}
        </HorizontalScrollRow>
      )}
    </section>
  );
}

export default BestDeals;
