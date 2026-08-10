import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  FARMER_PRODUCT_FORM_STATUS,
  PRODUCT_UNITS,
  STOCK_GRADES,
  STOCK_REASONS,
} from "../../utils/constants";
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_OUTLINE,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PANEL,
  EXCEL_SELECT,
} from "../../utils/excelStyles";
import { GROCERY_CATEGORIES } from "../../data/groceryCategories";
import { adjustStock } from "../../api/farmerApi";
import Modal from "../ui/Modal";

const gradeRowSchema = z.object({
  label: z.string().min(1, "Grade name is required"),
  quantity: z.coerce.number().min(0, "Enter quantity"),
});

const fullSchema = z.object({
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

const inventorySchema = z.object({
  productId: z.string().min(1, "Select a product"),
  name: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Select a unit"),
  availableQuantity: z.coerce.number().min(0).optional(),
  harvestDate: z.string().optional(),
  farmLocation: z.string().min(2, "Farm location is required"),
  produceType: z.enum(["organic", "non-organic"], { message: "Select produce type" }),
  grades: z.array(gradeRowSchema).min(2, "Grade A and B are required"),
  availableForDelivery: z.enum(["yes", "no"], { message: "Select delivery availability" }),
  status: z.string().min(1, "Select product status"),
});

const basicSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  farmLocation: z.string().min(2, "Farm location is required"),
});

const inputClass = `${EXCEL_INPUT} py-1`;
const selectClass = `${EXCEL_SELECT} py-1`;

function nextGradeLabel(count) {
  return `Grade ${String.fromCharCode(65 + count)}`;
}

function productToInventoryForm(product) {
  if (!product) {
    return mapDefaultValues({}, "inventory");
  }

  return mapDefaultValues(
    {
      productId: product.id,
      name: product.name,
      category: product.category,
      unit: product.unit || "Kg",
      availableQuantity: product.availableQuantity ?? product.stock ?? 0,
      harvestDate: product.harvestDate || "",
      farmLocation: product.farmLocation || "",
      produceType: product.produceType ?? (product.organic === false ? "non-organic" : "organic"),
      availableForDelivery: product.availableForDelivery === false ? "no" : "yes",
      status: product.status || "Draft",
      grades: product.grades?.length
        ? product.grades
        : [
            { label: "Grade A", quantity: product.gradeAQty ?? 0 },
            { label: "Grade B", quantity: product.gradeBQty ?? 0 },
          ],
      description: product.description,
      images: product.images,
      sellingPrice: product.sellingPrice,
      mrp: product.mrp,
      lowStockLimit: product.lowStockLimit,
      minOrderQty: product.minOrderQty,
      maxOrderQty: product.maxOrderQty,
      pricingType: product.pricingType,
    },
    "inventory"
  );
}

function mapDefaultValues(defaultValues = {}, mode = "full") {
  const base = {
    productId: "",
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

  if (mode === "basic") {
    return {
      name: base.name,
      category: base.category,
      farmLocation: base.farmLocation,
      grades: [
        { label: "Grade A", quantity: 0 },
        { label: "Grade B", quantity: 0 },
      ],
    };
  }

  if (mode === "inventory") {
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
      productId: base.productId || "",
      name: base.name,
      category: base.category,
      unit: base.unit || "Kg",
      availableQuantity: base.availableQuantity ?? base.stock ?? 0,
      harvestDate: base.harvestDate || "",
      farmLocation: base.farmLocation,
      produceType:
        base.produceType ?? (base.organic === false ? "non-organic" : "organic"),
      availableForDelivery:
        base.availableForDelivery === false || base.availableForDelivery === "no" ? "no" : "yes",
      status: base.status || "Draft",
      grades,
    };
  }

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

function buildPayload(values, defaultValues, mode = "full") {
  if (mode === "basic") {
    return {
      name: values.name,
      category: values.category,
      farmLocation: values.farmLocation,
      description: defaultValues?.description || `${values.name} — farm produce`,
      unit: defaultValues?.unit || "Kg",
      stock: Number(defaultValues?.stock) || 0,
      availableQuantity: Number(defaultValues?.availableQuantity) || 0,
      harvestDate: defaultValues?.harvestDate || "",
      organic: defaultValues?.organic ?? true,
      produceType: defaultValues?.produceType || "organic",
      grades: defaultValues?.grades?.length
        ? defaultValues.grades
        : [
            { label: "Grade A", quantity: 0 },
            { label: "Grade B", quantity: 0 },
          ],
      gradeAQty: Number(defaultValues?.gradeAQty) || 0,
      gradeBQty: Number(defaultValues?.gradeBQty) || 0,
      minOrderQty: Number(defaultValues?.minOrderQty) || 1,
      maxOrderQty: Number(defaultValues?.maxOrderQty) || 50,
      availableForDelivery: defaultValues?.availableForDelivery ?? true,
      status: defaultValues?.status || "Draft",
      images: defaultValues?.images?.length ? defaultValues.images : ["/categories/grocery.webp"],
      sellingPrice: Number(defaultValues?.sellingPrice) || 0,
      mrp: Number(defaultValues?.mrp) || 0,
      lowStockLimit: Number(defaultValues?.lowStockLimit) || 10,
      pricingType: defaultValues?.pricingType || "Per Kg",
    };
  }

  if (mode === "inventory") {
    const grades = (values.grades || []).map((g) => ({
      label: g.label,
      quantity: Number(g.quantity) || 0,
    }));
    const gradeAQty = Number(grades[0]?.quantity) || 0;
    const gradeBQty = Number(grades[1]?.quantity) || 0;
    const totalQty = gradeAQty + gradeBQty;

    return {
      productId: values.productId,
      name: values.name,
      category: values.category,
      unit: values.unit,
      stock: totalQty,
      availableQuantity: totalQty,
      harvestDate: values.harvestDate || "",
      farmLocation: values.farmLocation,
      organic: values.produceType === "organic",
      produceType: values.produceType,
      grades,
      gradeAQty,
      gradeBQty,
      availableForDelivery: values.availableForDelivery === "yes",
      status: values.status,
    };
  }

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

function ProductForm({
  defaultValues,
  onSubmit,
  submitting,
  mode = "full",
  submitLabel,
  availableProducts = [],
  initialProductId = "",
  disableProductSelect = false,
  onStockAdjusted,
}) {
  const isBasic = mode === "basic";
  const isInventory = mode === "inventory";
  const schema = isBasic ? basicSchema : isInventory ? inventorySchema : fullSchema;
  const saveLabel = submitLabel || (isInventory ? "Save Inventory" : "Save Product");

  const [stockModal, setStockModal] = useState(null);
  const [stockQty, setStockQty] = useState("");
  const [stockGrade, setStockGrade] = useState("Grade A");
  const [stockReason, setStockReason] = useState("Manual Update");
  const [stockBusy, setStockBusy] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: mapDefaultValues(defaultValues, mode),
  });

  const selectedProductId = watch("productId");
  const unit = watch("unit") || "Kg";
  const gradeAQty = watch("grades.0.quantity");
  const gradeBQty = watch("grades.1.quantity");
  const inventoryAvailQty = Number(gradeAQty || 0) + Number(gradeBQty || 0);
  const activeProductId = selectedProductId || initialProductId;
  const canAdjustStock = Boolean(isInventory && activeProductId);

  useEffect(() => {
    if (!isInventory) return;
    setValue("availableQuantity", inventoryAvailQty);
  }, [inventoryAvailQty, isInventory, setValue]);

  useEffect(() => {
    if (!isInventory || !availableProducts.length) return;
    const productId = selectedProductId || initialProductId;
    if (!productId) return;
    const product = availableProducts.find((item) => item.id === productId);
    if (product) {
      reset(productToInventoryForm(product));
    }
  }, [selectedProductId, initialProductId, availableProducts, isInventory, reset]);

  const openStockModal = (modeType) => {
    if (!activeProductId) {
      toast.error("Select a product first");
      return;
    }
    setStockModal(modeType);
    setStockQty("");
    setStockGrade("Grade A");
    setStockReason(modeType === "add" ? "Harvest" : "Manual Update");
  };

  const closeStockModal = () => {
    if (stockBusy) return;
    setStockModal(null);
  };

  const handleStockAdjust = async () => {
    const qty = Number(stockQty);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    setStockBusy(true);
    try {
      const change = stockModal === "add" ? qty : -qty;
      const { product } = await adjustStock({
        productId: activeProductId,
        change,
        grade: stockGrade,
        reason: stockReason,
        updatedBy: "Farmer",
      });
      reset(productToInventoryForm(product));
      onStockAdjusted?.(product);
      toast.success(stockModal === "add" ? "Stock added" : "Stock removed");
      setStockModal(null);
    } catch (err) {
      toast.error(err.message || "Failed to update stock");
    } finally {
      setStockBusy(false);
    }
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "grades",
    disabled: isBasic,
  });

  if (isBasic) {
    return (
      <form
        onSubmit={handleSubmit((values) => onSubmit(buildPayload(values, defaultValues, mode)))}
        className={EXCEL_PANEL}
      >
        <div className="grid gap-2 p-2 sm:grid-cols-3">
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
          <Field label="Farm Location" error={errors.farmLocation?.message}>
            <input className={inputClass} {...register("farmLocation")} placeholder="Location" />
          </Field>
        </div>
        <div className="flex justify-end border-t border-[#D4D4D4] px-2 py-1.5">
          <button type="submit" disabled={submitting} className={`${EXCEL_BTN_PRIMARY} py-1`}>
            {submitting ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    );
  }

  if (isInventory) {
    return (
      <>
        <form
          onSubmit={handleSubmit((values) => onSubmit(buildPayload(values, defaultValues, mode)))}
          className={EXCEL_PANEL}
        >
          <div className="space-y-2 p-2">
            <div className="flex flex-wrap items-end justify-between gap-2 border border-[#D4D4D4] bg-[#FAFAFA] p-2">
              <Field label="Current Stock" className="min-w-[140px]">
                <input
                  type="text"
                  readOnly
                  value={`${inventoryAvailQty} ${unit}`}
                  className={`${inputClass} bg-[#F2F2F2] tabular-nums font-semibold`}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canAdjustStock || stockBusy}
                  onClick={() => openStockModal("add")}
                  className={`${EXCEL_BTN_PRIMARY} py-1`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  disabled={!canAdjustStock || stockBusy || inventoryAvailQty <= 0}
                  onClick={() => openStockModal("remove")}
                  className={`${EXCEL_BTN_DANGER} py-1`}
                >
                  Remove Stock
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Product Name" error={errors.productId?.message}>
                <select
                  className={selectClass}
                  {...register("productId")}
                  disabled={disableProductSelect}
                >
                  <option value="">Select product</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </Field>
              <input type="hidden" {...register("name")} />
              <Field label="Category" error={errors.category?.message}>
                <select className={selectClass} {...register("category")}>
                  {GROCERY_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Unit" error={errors.unit?.message}>
                <select className={selectClass} {...register("unit")}>
                  {PRODUCT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
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
              <Field label="Gr A (Kg)" error={errors.grades?.[0]?.quantity?.message}>
                <input
                  type="number"
                  min="0"
                  readOnly
                  className={`${inputClass} bg-[#F2F2F2] tabular-nums`}
                  {...register("grades.0.quantity")}
                />
              </Field>
              <Field label="Gr B (Kg)" error={errors.grades?.[1]?.quantity?.message}>
                <input
                  type="number"
                  min="0"
                  readOnly
                  className={`${inputClass} bg-[#F2F2F2] tabular-nums`}
                  {...register("grades.1.quantity")}
                />
              </Field>
              <Field label="Avail. Qty">
                <input
                  type="number"
                  readOnly
                  value={inventoryAvailQty}
                  className={`${inputClass} bg-[#F2F2F2] tabular-nums`}
                  title="Gr A (Kg) + Gr B (Kg)"
                />
                <input type="hidden" {...register("availableQuantity")} />
              </Field>
              <Field label="Delivery" error={errors.availableForDelivery?.message}>
                <select className={selectClass} {...register("availableForDelivery")}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Field>
              <Field label="Status" error={errors.status?.message}>
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
              {submitting ? "Saving..." : saveLabel}
            </button>
          </div>
        </form>

        <Modal
          open={Boolean(stockModal)}
          title={stockModal === "add" ? "Add Stock" : "Remove Stock"}
          onClose={closeStockModal}
          size="sm"
          footer={
            <>
              <button type="button" className={EXCEL_BTN_OUTLINE} onClick={closeStockModal} disabled={stockBusy}>
                Cancel
              </button>
              <button
                type="button"
                className={stockModal === "add" ? EXCEL_BTN_PRIMARY : EXCEL_BTN_DANGER}
                onClick={handleStockAdjust}
                disabled={stockBusy}
              >
                {stockBusy ? "Saving..." : stockModal === "add" ? "Add Stock" : "Remove Stock"}
              </button>
            </>
          }
        >
          <div className="grid gap-2">
            <Field label="Grade">
              <select
                className={selectClass}
                value={stockGrade}
                onChange={(e) => setStockGrade(e.target.value)}
              >
                {STOCK_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                className={inputClass}
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                placeholder="Enter quantity"
              />
            </Field>
            <Field label="Reason">
              <select
                className={selectClass}
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
              >
                {STOCK_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-[#6B7280]">
              Current {stockGrade}:{" "}
              <span className="font-semibold text-[#1F2937] tabular-nums">
                {stockGrade === "Grade B" ? Number(gradeBQty || 0) : Number(gradeAQty || 0)} {unit}
              </span>
            </p>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(buildPayload(values, defaultValues, mode)))}
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
