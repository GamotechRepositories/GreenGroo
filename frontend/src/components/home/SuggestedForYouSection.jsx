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
  section = null,
}) {
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const [apiProducts, setApiProducts] = useState([]);
  const locationKey = useDeliveryLocationKey();

  useEffect(() => {
    if (customProducts && customProducts.length > 0) return;
    let isMounted = true;
    const params = { limit: 12 };
    if (section) params.section = section;
    getProducts(params)
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
  }, [customProducts, locationKey, section]);

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
    <section className="bg-white px-2 sm:px-3 py-3 lg:px-4 lg:py-4 lg:rounded-2xl lg:shadow-sm">
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
      <div className="hidden gap-4 lg:grid lg:grid-cols-6">
        {products.slice(0, 12).map((product) => (
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
