import { formatPrice } from "./sections/adminOrderUtils";
import { getAdminProductPriceDisplay } from "../../utils/productPricing";

function AdminProductPrice({ product, size = "table" }) {
  const display = getAdminProductPriceDisplay(product);

  if (size === "detail") {
    return (
      <div className="space-y-1">
        <div className="flex flex-wrap items-baseline gap-2">
          {display.hasDiscount && display.secondaryPrice ? (
            <span className="text-text-muted line-through">
              {formatPrice(display.secondaryPrice)}
            </span>
          ) : null}
          <span className="font-semibold text-primary">
            {formatPrice(display.primaryPrice)}
          </span>
          {display.isBulk && display.bulkRange ? (
            <span className="text-xs font-medium text-text-secondary">
              {display.bulkRange}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <>
      {display.hasDiscount && display.secondaryPrice ? (
        <span className="block text-[10px] text-neutral-500 line-through">
          {formatPrice(display.secondaryPrice)}
        </span>
      ) : null}
      <span className="block font-semibold text-neutral-900">
        {formatPrice(display.primaryPrice)}
      </span>
      {display.bulkRange ? (
        <span className="block text-[10px] text-neutral-500">{display.bulkRange}</span>
      ) : null}
    </>
  );
}

export default AdminProductPrice;
