import ProductImageFrame from "./ProductImageFrame";

function ProductThumb({ src, alt, className = "" }) {
  return <ProductImageFrame src={src} alt={alt} className={className} />;
}

export default ProductThumb;
