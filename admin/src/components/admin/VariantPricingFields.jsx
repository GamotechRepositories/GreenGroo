import { inputClass, labelClass } from "./adminStyles";

const EMPTY_SLAB = {
  maxQuantity: "",
  price: "",
};

function getSlabStartQuantity(minOrderQuantity, slabs, index) {
  const moq = Number(minOrderQuantity);
  let start = Number.isFinite(moq) && moq >= 1 ? moq : 1;

  for (let i = 0; i < index; i += 1) {
    const max = Number(slabs[i]?.maxQuantity);
    if (!Number.isFinite(max)) return "—";
    start = max + 1;
  }

  return start;
}

function ProductQuantityRulesFields({ minOrderQuantity = "", stepByQuantity = "", onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 [&>div]:min-w-0">
      <div>
        <label className={labelClass}>MOQ</label>
        <input
          type="number"
          min="1"
          placeholder="e.g. 50"
          value={minOrderQuantity}
          onChange={(e) => onChange({ minOrderQuantity: e.target.value, stepByQuantity })}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Step by QTY</label>
        <input
          type="number"
          min="1"
          placeholder="e.g. 10"
          value={stepByQuantity}
          onChange={(e) => onChange({ minOrderQuantity, stepByQuantity: e.target.value })}
          className={inputClass}
        />
      </div>
    </div>
  );
}

function VariantPricingFields({
  variant,
  onChange,
  showPricingType = true,
  showInStock = true,
  showQuantityRules = true,
  slabMinOrderQuantity = "",
}) {
  const updateField = (field, value) => {
    onChange({ ...variant, [field]: value });
  };

  const updateSlab = (index, field, value) => {
    const slabs = variant.slabs.map((slab, i) =>
      i === index ? { ...slab, [field]: value } : slab
    );
    onChange({ ...variant, slabs });
  };

  const addSlab = () => {
    onChange({ ...variant, slabs: [...variant.slabs, { ...EMPTY_SLAB }] });
  };

  const removeSlab = (index) => {
    onChange({
      ...variant,
      slabs:
        variant.slabs.length === 1
          ? [{ ...EMPTY_SLAB }]
          : variant.slabs.filter((_, i) => i !== index),
    });
  };

  const isBulk = variant.pricingType === "bulk";

  return (
    <div className="space-y-4">
      {showPricingType || showInStock ? (
        <div
          className={`grid items-center gap-2 sm:gap-4 ${
            showPricingType && showInStock ? "grid-cols-3" : showPricingType ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {showPricingType ? (
            <>
              <label className="flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
                <input
                  type="radio"
                  checked={variant.pricingType === "single"}
                  onChange={() => updateField("pricingType", "single")}
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                <span className="leading-tight">Single price</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
                <input
                  type="radio"
                  checked={variant.pricingType === "bulk"}
                  onChange={() => updateField("pricingType", "bulk")}
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                <span className="leading-tight">Bulk price</span>
              </label>
            </>
          ) : null}
          {showInStock ? (
            <label className="flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
              <input
                type="checkbox"
                checked={variant.inStock !== false}
                onChange={(e) => updateField("inStock", e.target.checked)}
                className="h-4 w-4 shrink-0 accent-primary"
              />
              <span className="font-medium leading-tight text-text-primary">In stock</span>
            </label>
          ) : null}
        </div>
      ) : null}

      {showQuantityRules ? (
        <ProductQuantityRulesFields
          minOrderQuantity={variant.minOrderQuantity ?? ""}
          stepByQuantity={variant.stepByQuantity ?? ""}
          onChange={({ minOrderQuantity, stepByQuantity }) =>
            onChange({ ...variant, minOrderQuantity, stepByQuantity })
          }
        />
      ) : null}

      {!isBulk ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 [&>div]:min-w-0">
          <div>
            <label className={labelClass}>Price (₹) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={variant.price}
              onChange={(e) => updateField("price", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Discounted price (₹) *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={variant.discountedPrice}
              onChange={(e) => updateField("discountedPrice", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      ) : (
        <div>
          <label className={labelClass}>Pricing slabs *</label>
          <div className="space-y-3">
            {variant.slabs.map((slab, index) => {
                const rangeStart = getSlabStartQuantity(
                  showQuantityRules ? variant.minOrderQuantity : slabMinOrderQuantity,
                  variant.slabs,
                  index
                );
                const isLast = index === variant.slabs.length - 1;

                return (
                  <div
                    key={index}
                    className={`grid gap-1.5 rounded-lg border border-border-light p-2 sm:gap-3 sm:p-3 [&>div]:min-w-0 ${
                      variant.slabs.length > 1 ? "grid-cols-4" : "grid-cols-3"
                    }`}
                  >
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium leading-tight text-text-secondary sm:mb-1 sm:text-xs">
                        Range starts at
                      </label>
                      <div className="rounded-lg border border-border-light bg-mobile-surface px-2 py-2 text-xs text-text-primary sm:px-3 sm:py-2.5 sm:text-sm">
                        {rangeStart}
                      </div>
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium leading-tight text-text-secondary sm:mb-1 sm:text-xs">
                        Max qty {isLast ? "(optional)" : "*"}
                      </label>
                      <input
                        type="number"
                        required={!isLast}
                        min="1"
                        placeholder={isLast ? "Open-ended" : "e.g. 200"}
                        value={slab.maxQuantity}
                        onChange={(e) => updateSlab(index, "maxQuantity", e.target.value)}
                        className={`${inputClass} !px-2 !py-2 text-xs sm:!px-3 sm:!py-2.5 sm:text-sm`}
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium leading-tight text-text-secondary sm:mb-1 sm:text-xs">
                        Price per unit (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={slab.price}
                        onChange={(e) => updateSlab(index, "price", e.target.value)}
                        className={`${inputClass} !px-2 !py-2 text-xs sm:!px-3 sm:!py-2.5 sm:text-sm`}
                      />
                    </div>
                    <div className="flex items-end">
                      {variant.slabs.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeSlab(index)}
                          className="w-full rounded-lg border border-border-light px-1.5 py-2 text-[10px] font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 sm:px-3 sm:py-2.5 sm:text-sm"
                        >
                          <span className="sm:hidden">Remove</span>
                          <span className="hidden sm:inline">Remove slab</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addSlab}
              className="mt-3 text-sm font-semibold text-accent hover:underline"
            >
              + Add pricing slab
            </button>
        </div>
      )}
    </div>
  );
}

export { EMPTY_SLAB, ProductQuantityRulesFields };

export default VariantPricingFields;
