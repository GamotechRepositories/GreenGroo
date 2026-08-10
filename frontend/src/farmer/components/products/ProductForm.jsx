import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PRICING_TYPES, PRODUCT_STATUS } from "../../utils/constants";
import { GROCERY_CATEGORIES } from "../../../data/groceryCategories";

const schema = z.object({
  name: z.string().min(2, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().optional(),
  description: z.string().min(10, "Add a short description"),
  unit: z.string().min(1, "Unit is required"),
  weight: z.string().optional(),
  pricingType: z.string().min(1),
  sellingPrice: z.coerce.number().positive("Selling price required"),
  mrp: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().min(0),
  minOrderQty: z.coerce.number().min(1),
  maxOrderQty: z.coerce.number().min(1),
  organic: z.boolean(),
  harvestDate: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.string().min(1),
  lowStockLimit: z.coerce.number().min(0),
  imageUrl: z.string().optional(),
});

const inputClass =
  "w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/15";

function ProductForm({ defaultValues, onSubmit, submitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: "Vegetables",
      subCategory: "",
      description: "",
      unit: "Kg",
      weight: "1",
      pricingType: "Per Kg",
      sellingPrice: 0,
      mrp: 0,
      stock: 0,
      minOrderQty: 1,
      maxOrderQty: 50,
      organic: true,
      harvestDate: "",
      expiryDate: "",
      status: "Draft",
      lowStockLimit: 10,
      imageUrl: "",
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          images: values.imageUrl ? [values.imageUrl] : defaultValues?.images || [],
        })
      )}
      className="space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product Name" error={errors.name?.message}>
          <input className={inputClass} {...register("name")} />
        </Field>
        <Field label="Category" error={errors.category?.message}>
          <select className={inputClass} {...register("category")}>
            {GROCERY_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sub Category">
          <input className={inputClass} {...register("subCategory")} />
        </Field>
        <Field label="Unit" error={errors.unit?.message}>
          <input className={inputClass} {...register("unit")} placeholder="Kg / Litre / Piece" />
        </Field>
        <Field label="Weight / Quantity">
          <input className={inputClass} {...register("weight")} />
        </Field>
        <Field label="Pricing Type">
          <select className={inputClass} {...register("pricingType")}>
            {PRICING_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Selling Price" error={errors.sellingPrice?.message}>
          <input type="number" step="0.01" className={inputClass} {...register("sellingPrice")} />
        </Field>
        <Field label="MRP">
          <input type="number" step="0.01" className={inputClass} {...register("mrp")} />
        </Field>
        <Field label="Stock" error={errors.stock?.message}>
          <input type="number" className={inputClass} {...register("stock")} />
        </Field>
        <Field label="Low Stock Limit">
          <input type="number" className={inputClass} {...register("lowStockLimit")} />
        </Field>
        <Field label="Min Order Qty">
          <input type="number" className={inputClass} {...register("minOrderQty")} />
        </Field>
        <Field label="Max Order Qty">
          <input type="number" className={inputClass} {...register("maxOrderQty")} />
        </Field>
        <Field label="Harvest Date">
          <input type="date" className={inputClass} {...register("harvestDate")} />
        </Field>
        <Field label="Expiry Date">
          <input type="date" className={inputClass} {...register("expiryDate")} />
        </Field>
        <Field label="Product Status">
          <select className={inputClass} {...register("status")}>
            {PRODUCT_STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Image URL">
          <input className={inputClass} {...register("imageUrl")} placeholder="/categories/vegetables.webp" />
        </Field>
      </div>

      <Field label="Description" error={errors.description?.message}>
        <textarea rows={4} className={inputClass} {...register("description")} />
      </Field>

      <label className="inline-flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" {...register("organic")} className="h-4 w-4 rounded border-[#E5E7EB]" />
        Organic product
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-[#2E7D32] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#256628] disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-[#1F2937]">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-[#DC2626]">{error}</p> : null}
    </div>
  );
}

export default ProductForm;
