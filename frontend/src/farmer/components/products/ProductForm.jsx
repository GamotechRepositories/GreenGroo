import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FARMER_PRODUCT_FORM_STATUS, PRODUCT_UNITS } from "../../utils/constants";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PANEL,
  EXCEL_SELECT,
} from "../../utils/excelStyles";
import { GROCERY_CATEGORIES } from "../../../data/groceryCategories";

const gradeRowSchema = z.object({
  label: z.string().min(1, "Grade name is required"),
  quantity: z.coerce.number().min(0, "Enter quantity"),
});

const schema = z.object({
  name: z.string().min(2, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().optional(),
  description: z.string().min(10, "Add a short description"),
  unit: z.string().min(1, "Select a unit"),
  availableQuantity: z.coerce.number().min(0, "Enter available quantity"),
  harvestDate: z.string().optional(),
  farmLocation: z.string().min(2, "Farm location is required"),
  produceType: z.enum(["organic", "non-organic"], { message: "Select produce type" }),
  grades: z.array(gradeRowSchema).min(1, "Add at least one grade"),
  availableForDelivery: z.enum(["yes", "no"], { message: "Select delivery availability" }),
  status: z.string().min(1, "Select product status"),
});

const inputClass = `${EXCEL_INPUT} py-1`;
const selectClass = `${EXCEL_SELECT} py-1`;

function nextGradeLabel(count) {
  return `Grade ${String.fromCharCode(65 + count)}`;
}

function mapDefaultValues(defaultValues = {}) {
  const base = {
    name: "",
    category: "Vegetables",
    imageUrl: "",
    description: "",
    unit: "Kg",
    availableQuantity: 0,
    harvestDate: "",
    farmLocation: "",
    produceType: "organic",
    availableForDelivery: "yes",
    status: "Draft",
    ...defaultValues,
  };

  const grades =
    base.grades?.length > 0
      ? base.grades.map((g) => ({
          label: g.label || "Grade",
          quantity: Number(g.quantity) || 0,
        }))
      : [
          { label: "Grade A", quantity: Number(base.gradeAQty) || 0 },
          { label: "Grade B", quantity: Number(base.gradeBQty) || 0 },
        ];

  return {
    ...base,
    unit: base.unit || "Kg",
    availableQuantity: base.availableQuantity ?? base.stock ?? 0,
    produceType:
      base.produceType ?? (base.organic === false ? "non-organic" : "organic"),
    availableForDelivery:
      base.availableForDelivery === false || base.availableForDelivery === "no" ? "no" : "yes",
    imageUrl: base.imageUrl ?? base.images?.[0] ?? "",
    grades,
  };
}

function buildPayload(values, defaultValues) {
  const grades = (values.grades || []).map((g) => ({
    label: g.label,
    quantity: Number(g.quantity) || 0,
  }));

  return {
    name: values.name,
    category: values.category,
    description: values.description,
    unit: values.unit,
    stock: Number(values.availableQuantity) || 0,
    availableQuantity: Number(values.availableQuantity) || 0,
    harvestDate: values.harvestDate || "",
    farmLocation: values.farmLocation,
    organic: values.produceType === "organic",
    produceType: values.produceType,
    grades,
    gradeAQty: Number(grades[0]?.quantity) || 0,
    gradeBQty: Number(grades[1]?.quantity) || 0,
    minOrderQty: Number(defaultValues?.minOrderQty) || 1,
    maxOrderQty: Number(defaultValues?.maxOrderQty) || 50,
    availableForDelivery: values.availableForDelivery === "yes",
    status: values.status,
    images: values.imageUrl
      ? [values.imageUrl]
      : defaultValues?.images?.length
        ? defaultValues.images
        : ["/categories/grocery.webp"],
    sellingPrice: Number(defaultValues?.sellingPrice) || 0,
    mrp: Number(defaultValues?.mrp) || 0,
    lowStockLimit: Number(defaultValues?.lowStockLimit) || 10,
    pricingType: defaultValues?.pricingType || "Per Kg",
  };
}

function ProductForm({ defaultValues, onSubmit, submitting }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: mapDefaultValues(defaultValues),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "grades",
  });

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(buildPayload(values, defaultValues)))}
      className={EXCEL_PANEL}
    >
      <div className="space-y-2 p-2">
        <SectionLabel>Product Information</SectionLabel>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Product Name" error={errors.name?.message}>
            <input className={inputClass} {...register("name")} />
          </Field>
          <Field label="Category" error={errors.category?.message}>
            <select className={selectClass} {...register("category")}>
              {GROCERY_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Product Image" className="sm:col-span-2" error={errors.imageUrl?.message}>
            <input className={inputClass} {...register("imageUrl")} placeholder="Image URL" />
          </Field>
          <Field label="Description" className="sm:col-span-2 lg:col-span-4" error={errors.description?.message}>
            <textarea rows={2} className={inputClass} {...register("description")} />
          </Field>
        </div>

        <SectionLabel>Produce Details</SectionLabel>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Unit" error={errors.unit?.message}>
            <select className={selectClass} {...register("unit")}>
              {PRODUCT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Available Qty" error={errors.availableQuantity?.message}>
            <input type="number" min="0" className={inputClass} {...register("availableQuantity")} />
          </Field>
          <Field label="Harvest Date">
            <input type="date" className={inputClass} {...register("harvestDate")} />
          </Field>
          <Field label="Farm Location" error={errors.farmLocation?.message}>
            <input className={inputClass} {...register("farmLocation")} placeholder="Location" />
          </Field>
          <Field label="Organic" error={errors.produceType?.message}>
            <select className={selectClass} {...register("produceType")}>
              <option value="organic">Organic</option>
              <option value="non-organic">Non-Organic</option>
            </select>
          </Field>
        </div>

        <SectionLabel>Grade & Pricing</SectionLabel>
        <div className="space-y-2">
          {chunkPairs(fields.length).map(([first, second]) => (
            <div
              key={`grade-row-${first}`}
              className="grid gap-2 border border-[#D4D4D4] bg-[#FAFAFA] p-2 sm:grid-cols-2"
            >
              <GradePair
                index={first}
                register={register}
                errors={errors}
                canRemove={first >= 2}
                onRemove={() => remove(first)}
              />
              {second !== null ? (
                <GradePair
                  index={second}
                  register={register}
                  errors={errors}
                  canRemove={second >= 2}
                  onRemove={() => remove(second)}
                />
              ) : null}
            </div>
          ))}

          <button
            type="button"
            onClick={() => append({ label: nextGradeLabel(fields.length), quantity: 0 })}
            className={`${EXCEL_BTN} py-1`}
          >
            + Add
          </button>
        </div>
        {errors.grades?.message ? (
          <p className="text-xs text-[#DC2626]">{errors.grades.message}</p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Available for Delivery" error={errors.availableForDelivery?.message}>
            <select className={selectClass} {...register("availableForDelivery")}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <Field label="Product Status" error={errors.status?.message}>
            <select className={selectClass} {...register("status")}>
              {FARMER_PRODUCT_FORM_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="flex justify-end border-t border-[#D4D4D4] px-2 py-1.5">
        <button type="submit" disabled={submitting} className={`${EXCEL_BTN_PRIMARY} py-1`}>
          {submitting ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}

function chunkPairs(length) {
  const rows = [];
  for (let i = 0; i < length; i += 2) {
    rows.push([i, i + 1 < length ? i + 1 : null]);
  }
  return rows;
}

function GradePair({ index, register, errors, canRemove, onRemove }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Grade" error={errors.grades?.[index]?.label?.message}>
        <input className={inputClass} {...register(`grades.${index}.label`)} />
      </Field>
      <Field label="Qty (Kg)" error={errors.grades?.[index]?.quantity?.message}>
        <div className="flex gap-1">
          <input type="number" min="0" className={`${inputClass} min-w-0 flex-1`} {...register(`grades.${index}.quantity`)} />
          {canRemove ? (
            <button type="button" onClick={onRemove} className={`${EXCEL_BTN} shrink-0 px-1.5 py-1`} title="Remove grade">
              ✕
            </button>
          ) : null}
        </div>
      </Field>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="border-b border-[#D4D4D4] bg-[#F2F2F2] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#374151]">
      {children}
    </p>
  );
}

function Field({ label, error, children, className = "" }) {
  return (
    <div className={className}>
      {label ? (
        <label className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">{label}</label>
      ) : null}
      {children}
      {error ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{error}</p> : null}
    </div>
  );
}

export default ProductForm;
