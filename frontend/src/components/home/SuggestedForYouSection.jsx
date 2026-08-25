import { useState, useEffect } from "react";
import SectionHeader from "../mobile/SectionHeader";
import TwoRowHorizontalProducts from "../grocery/TwoRowHorizontalProducts";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import { getProducts } from "../../api/api";
import { useDeliveryLocationKey } from "../../context/LocationContext";

export default function SuggestedForYouSection({
  title = "Suggested for You",
  subtitle = "Handpicked fresh items just for you",
  customProducts = null,
}) {
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const [apiProducts, setApiProducts] = useState([]);
  const locationKey = useDeliveryLocationKey();

  useEffect(() => {
    if (customProducts && customProducts.length > 0) return;
    let isMounted = true;
    getProducts({ limit: 12 })
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data || res.data?.products || res.data || [];
        if (Array.isArray(list)) setApiProducts(list);
      })
      .catch(() => {
        if (isMounted) setApiProducts([]);
      });
    return () => {
      isMounted = false;
    };
  }, [customProducts, locationKey]);

  const products =
    customProducts && customProducts.length > 0 ? customProducts : apiProducts;

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  if (!products || products.length === 0) return null;

  return (
    <section className="bg-white px-4 sm:px-6 py-4 lg:rounded-2xl lg:shadow-sm">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        viewAllTo="/product"
        className="mb-3 lg:mb-4"
      />

      {/* 2-Row Horizontal Scroll for Mobile */}
      <div className="lg:hidden">
        <TwoRowHorizontalProducts products={products} cardProps={cardProps} />
      </div>

      {/* Grid Layout for Desktop */}
      <div className="hidden grid-cols-4 gap-4 lg:grid xl:grid-cols-5">
        {products.slice(0, 10).map((product) => (
          <QuickCommerceProductCard
            key={product._id}
            {...cardProps(product)}
            layout="grid"
          />
        ))}
      </div>
    </section>
  );
}
