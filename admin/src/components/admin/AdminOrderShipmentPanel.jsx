import { useEffect, useMemo, useState } from "react";
import {
  createAdminOrderShipment,
  cancelAdminOrderShipment,
  linkAdminOrderShipment,
  quoteAdminOrderShipmentRates,
  syncAdminOrderShipment,
  uploadImageFile,
} from "../../api/api";
import { getOrderNumber } from "../../utils/orderNumber";
import {
  SHIPPING_SERVICES,
  getShippingServiceCarriers,
  mapQuotesToShippingServices,
  normalizePackageWeight,
} from "@shared/shipping/shippingServices.js";
import {
  SHIPMENT_CONTENTS,
} from "@shared/shipping/shipmentContents.js";
import {
  isOrderCodPayment,
  isOrderPrepaidShipment,
} from "@shared/shipping/shipmentPayment.js";
import { UPLOAD_FOLDERS } from "../../utils/uploadFolders";
import { adminFilterInputClass, cardClass } from "./adminStyles";
import { formatDateTime, formatPrice } from "./sections/adminOrderUtils";

const compactInputClass =
  "w-full min-w-0 rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-text-primary focus:border-primary focus:outline-none";

const compactFieldLabelClass = "mb-0.5 block text-[11px] font-semibold text-neutral-500";

const EMPTY_PACKAGE = {
  weight: "",
  weightUnit: "KG",
  length: "",
  width: "",
  height: "",
  content: "",
};

function validatePackageForm(packageForm) {
  const content = String(packageForm.content || "").trim();
  const weight = Number(packageForm.weight);
  const length = Number(packageForm.length);
  const width = Number(packageForm.width);
  const height = Number(packageForm.height);

  if (!content) return "Select shipment content.";
  if (!Number.isFinite(weight) || weight <= 0) return "Enter package weight.";
  if (!Number.isFinite(length) || length <= 0) return "Enter package length.";
  if (!Number.isFinite(width) || width <= 0) return "Enter package width.";
  if (!Number.isFinite(height) || height <= 0) return "Enter package height.";
  return "";
}

function buildPackagePayload(form) {
  const normalized = normalizePackageWeight(form.weight, form.weightUnit);
  return {
    weight: normalized.weight,
    weightUnit: normalized.weightUnit,
    length: Number(form.length),
    width: Number(form.width),
    height: Number(form.height),
    content: String(form.content || "").trim(),
  };
}

function buildShipmentPayload(packageForm, paymentForm, metadataForm = {}, options = {}) {
  const note = String(metadataForm.shipmentNote ?? "").trim();
  const evidenceUrl = String(metadataForm.evidenceUrl ?? "").trim();
  const evidenceName = String(metadataForm.evidenceName ?? "").trim();
  const { order = null, paymentTouched = false } = options;
  const orderRequiresCod = order ? isOrderCodPayment(order) : false;

  const payload = {
    ...buildPackagePayload(packageForm),
    ...(note ? { shipmentNote: note } : {}),
    ...(evidenceUrl ? { evidenceUrl, evidenceName } : {}),
  };

  if (paymentForm.isCod) {
    payload.isCod = true;
    if (paymentForm.codAmount) {
      payload.codAmount = Number(paymentForm.codAmount);
    }
  } else if (paymentTouched) {
    payload.isCod = false;
    if (orderRequiresCod) {
      payload.allowPrepaidShipment = true;
    }
  }

  return payload;
}

function buildInitialPaymentForm(order) {
  if (!order) {
    return { isCod: false, codAmount: "" };
  }

  const isCod = isOrderCodPayment(order);
  if (!isCod) {
    return { isCod: false, codAmount: "" };
  }

  const total = Number(order.total) || 0;
  const advance =
    Number(order.advancePaidAmount) > 0
      ? Number(order.advancePaidAmount)
      : Number(order.codAdvanceAmount) || 0;
  const remaining = Math.max(0, total - advance);
  const codAmount = remaining > 0 ? remaining : total;

  return {
    isCod: true,
    codAmount: String(codAmount),
  };
}

export default function AdminOrderShipmentPanel({
  order,
  onOrderUpdated,
  onError,
  onSuccess,
}) {
  const [packageForm, setPackageForm] = useState(EMPTY_PACKAGE);
  const [paymentForm, setPaymentForm] = useState({ isCod: false, codAmount: "" });
  const [paymentTouched, setPaymentTouched] = useState(false);
  const [quotedPayment, setQuotedPayment] = useState(null);
  const [metadataForm, setMetadataForm] = useState({
    shipmentNote: "",
    evidenceUrl: "",
    evidenceName: "",
  });
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(SHIPPING_SERVICES[0]?.id || "");
  const [quoteErrors, setQuoteErrors] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [linkingTracking, setLinkingTracking] = useState(false);
  const [syncingTracking, setSyncingTracking] = useState(false);
  const [cancellingLabel, setCancellingLabel] = useState(false);
  const [mode, setMode] = useState("create");

  const hasTracking = Boolean(order?.shipment?.trackingNumber);
  const orderId = getOrderNumber(order);

  useEffect(() => {
    setPackageForm(EMPTY_PACKAGE);
    setMetadataForm({ shipmentNote: "", evidenceUrl: "", evidenceName: "" });
    setPaymentTouched(false);
    setPaymentForm(buildInitialPaymentForm(order));
    setQuotedPayment(null);
    setServiceOptions([]);
    setQuoteErrors([]);
    setTrackingInput("");
    setMode("create");
  }, [order?._id, order?.paymentMethod, order?.paymentStatus, order?.total, order?.codAdvanceAmount, order?.advancePaidAmount]);

  useEffect(() => {
    setQuotedPayment(null);
    setServiceOptions([]);
    setQuoteErrors([]);
    setSelectedServiceId(SHIPPING_SERVICES[0]?.id || "");
  }, [paymentForm.isCod]);

  const selectedService = useMemo(() => {
    const list = serviceOptions.length ? serviceOptions : SHIPPING_SERVICES;
    return list.find((entry) => entry.id === selectedServiceId);
  }, [serviceOptions, selectedServiceId]);

  const isPrepaidOrder = isOrderPrepaidShipment(order);

  const updatePackageField = (field, value) => {
    setPackageForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePaymentField = (field, value) => {
    setPaymentTouched(true);
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateMetadataField = (field, value) => {
    setMetadataForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEvidenceUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError("Please upload an image file (JPG, PNG, WEBP).");
      return;
    }

    setUploadingEvidence(true);
    onError("");
    try {
      const { data } = await uploadImageFile(file, UPLOAD_FOLDERS.SHIPMENT_EVIDENCE);
      const uploadedUrl = data?.data?.url ?? data?.url ?? "";
      if (!uploadedUrl) {
        throw new Error("Upload succeeded but no image URL was returned.");
      }
      setMetadataForm((prev) => ({
        ...prev,
        evidenceUrl: uploadedUrl,
        evidenceName: file.name,
      }));
      onSuccess("Shipment evidence uploaded.");
    } catch (err) {
      onError(err.response?.data?.message || err.message || "Failed to upload evidence");
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleFetchRates = async () => {
    if (!order || loadingRates) return;
    const packageError = validatePackageForm(packageForm);
    if (packageError) {
      onError(packageError);
      return;
    }
    if (paymentForm.isCod && (!paymentForm.codAmount || Number(paymentForm.codAmount) <= 0)) {
      onError("Enter the COD collection amount.");
      return;
    }
    setLoadingRates(true);
    onError("");
    onSuccess("");
    try {
      const carriers = getShippingServiceCarriers();

      const { data } = await quoteAdminOrderShipmentRates(order._id, {
        ...buildShipmentPayload(packageForm, paymentForm, metadataForm, {
          order,
          paymentTouched,
        }),
        carriers,
      });

      const quotes = data?.data?.quotes || [];
      const mapped = mapQuotesToShippingServices(quotes);
      setServiceOptions(mapped);
      setQuoteErrors(data?.data?.errors || []);
      setQuotedPayment(data?.data?.paymentType || null);

      const firstAvailable =
        mapped.find((entry) => entry.quote)?.id || mapped[0]?.id || "";
      setSelectedServiceId(firstAvailable);

      const availableCount = mapped.filter((entry) => entry.quote).length;
      if (!availableCount) {
        onError("No rates returned for these services. Check weight, address, and Envia settings.");
      } else {
        onSuccess(`Rates loaded for ${availableCount} of ${mapped.length} services.`);
      }
    } catch (err) {
      onError(err.response?.data?.message || "Failed to fetch rates");
      setServiceOptions([]);
      setQuoteErrors([]);
      setQuotedPayment(null);
    } finally {
      setLoadingRates(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!order || creatingLabel || !selectedService?.quote) return;
    const packageError = validatePackageForm(packageForm);
    if (packageError) {
      onError(packageError);
      return;
    }
    if (paymentForm.isCod && (!paymentForm.codAmount || Number(paymentForm.codAmount) <= 0)) {
      onError("Enter the COD collection amount.");
      return;
    }
    setCreatingLabel(true);
    onError("");
    onSuccess("");
    try {
      const { data } = await createAdminOrderShipment(order._id, {
        ...buildShipmentPayload(packageForm, paymentForm, metadataForm, {
          order,
          paymentTouched,
        }),
        carrier: selectedService.quote.carrier,
        service: selectedService.quote.service,
      });
      onOrderUpdated(data.data);
      setMetadataForm({ shipmentNote: "", evidenceUrl: "", evidenceName: "" });
      onSuccess("Shipping label created. Tracking is linked to the order.");
      setServiceOptions([]);
    } catch (err) {
      onError(err.response?.data?.message || "Failed to create label");
    } finally {
      setCreatingLabel(false);
    }
  };

  const handleLinkTracking = async (event) => {
    event.preventDefault();
    if (!order || linkingTracking || !trackingInput.trim()) return;
    setLinkingTracking(true);
    onError("");
    onSuccess("");
    try {
      const { data } = await linkAdminOrderShipment(order._id, {
        trackingNumber: trackingInput.trim(),
      });
      onOrderUpdated(data.data);
      setTrackingInput("");
      onSuccess("Tracking linked. Customer will get live updates.");
    } catch (err) {
      onError(err.response?.data?.message || "Failed to link tracking");
    } finally {
      setLinkingTracking(false);
    }
  };

  const handleSyncTracking = async () => {
    if (!order || syncingTracking || !order.shipment?.trackingNumber) return;
    setSyncingTracking(true);
    onError("");
    onSuccess("");
    try {
      const { data } = await syncAdminOrderShipment(order._id);
      onOrderUpdated(data.data);
      onSuccess("Tracking updated from Envia.");
    } catch (err) {
      onError(err.response?.data?.message || "Failed to refresh tracking");
    } finally {
      setSyncingTracking(false);
    }
  };

  const handleCancelLabel = async ({ clearOnly = false, forceClear = false } = {}) => {
    if (!order || cancellingLabel || !order.shipment?.trackingNumber) return;

    const confirmMessage = clearOnly
      ? "Clear this shipment from the order without calling Envia? Use this if you already cancelled/deleted the label on Envia. You can create a new label after."
      : forceClear
        ? "Envia could not cancel this label. Clear it from the order anyway so you can create a new label? (The label may still exist on Envia.)"
        : "Cancel this Envia label and clear shipment from the order so you can create a new one?";

    if (!window.confirm(confirmMessage)) return;

    setCancellingLabel(true);
    onError("");
    onSuccess("");
    try {
      const { data } = await cancelAdminOrderShipment(order._id, { clearOnly, forceClear });
      onOrderUpdated(data.data);
      setServiceOptions([]);
      setQuoteErrors([]);
      setQuotedPayment(null);
      setMode("create");
      onSuccess(data.message || "Shipment cancelled. You can create a new label.");
    } catch (err) {
      const response = err.response?.data;
      if (response?.canForceClear && !forceClear && !clearOnly) {
        const clearAnyway = window.confirm(
          `${response.message || "Envia could not cancel this label."}\n\nClear shipment from this order anyway so you can create a new label?`
        );
        if (clearAnyway) {
          setCancellingLabel(false);
          await handleCancelLabel({ forceClear: true });
          return;
        }
      }
      onError(response?.message || "Failed to cancel shipment");
    } finally {
      setCancellingLabel(false);
    }
  };

  return (
    <div className={cardClass}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral-900">Shipment</h3>
        {!hasTracking ? (
          <div className="flex rounded-md border border-neutral-200 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`rounded px-2.5 py-1 font-semibold ${
                mode === "create" ? "bg-neutral-900 text-white" : "text-neutral-600"
              }`}
            >
              Create label
            </button>
            <button
              type="button"
              onClick={() => setMode("link")}
              className={`rounded px-2.5 py-1 font-semibold ${
                mode === "link" ? "bg-neutral-900 text-white" : "text-neutral-600"
              }`}
            >
              Link tracking
            </button>
          </div>
        ) : null}
      </div>

      {hasTracking ? (
        <div className="space-y-2 text-xs text-neutral-700">
          <div className="grid gap-1 sm:grid-cols-2">
            <p>
              Tracking:{" "}
              <span className="font-semibold text-neutral-900">{order.shipment.trackingNumber}</span>
            </p>
            <p>
              Carrier:{" "}
              <span className="font-medium">
                {[order.shipment.carrier, order.shipment.service].filter(Boolean).join(" / ") || "—"}
              </span>
            </p>
            <p>
              Status:{" "}
              <span className="font-medium">
                {order.shipment.status || order.shipment.statusMessage || "Not available"}
              </span>
            </p>
            {order.shipment.syncedAt ? (
              <p className="text-neutral-500">Updated {formatDateTime(order.shipment.syncedAt)}</p>
            ) : null}
          </div>
          {order.shipment.note ? (
            <p className="text-sm text-neutral-700">
              Shipment note:{" "}
              <span className="font-medium text-neutral-900">{order.shipment.note}</span>
            </p>
          ) : null}
          {order.shipment.evidenceUrl ? (
            <div className="text-sm text-neutral-700">
              <span className="font-medium text-neutral-900">Shipment evidence:</span>{" "}
              <a
                href={order.shipment.evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sky-700 underline"
              >
                {order.shipment.evidenceName || "View image"}
              </a>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSyncTracking}
              disabled={syncingTracking || cancellingLabel}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            >
              {syncingTracking ? "Refreshing…" : "Refresh tracking"}
            </button>
            {order.shipment.labelUrl ? (
              <a
                href={order.shipment.labelUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                Download label
              </a>
            ) : null}
            {order.shipment.trackUrl ? (
              <a
                href={order.shipment.trackUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                Open tracking
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => handleCancelLabel()}
              disabled={cancellingLabel || syncingTracking || order.status === "delivered"}
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {cancellingLabel ? "Cancelling…" : "Cancel label"}
            </button>
            <button
              type="button"
              onClick={() => handleCancelLabel({ clearOnly: true })}
              disabled={cancellingLabel || syncingTracking || order.status === "delivered"}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              title="Use if the label was already deleted on Envia"
            >
              Clear & recreate
            </button>
          </div>
          {order.shipment.events?.length > 0 ? (
            <div className="border-t border-neutral-200 pt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
                Tracking history
              </p>
              <ul className="space-y-2">
                {order.shipment.events.map((event, index) => (
                  <li key={`${event.date}-${index}`} className="text-xs text-neutral-600">
                    <span className="font-medium text-neutral-800">
                      {event.status || event.description || "Update"}
                    </span>
                    {event.date ? ` · ${event.date}` : ""}
                    {event.location ? ` · ${event.location}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

        </div>
      ) : mode === "link" ? (
        <div className="space-y-3 text-sm text-neutral-600">
          <p>
            Shipment created outside the app (Envia portal, Delhivery, etc.)? Paste the tracking
            number for order #{orderId}.
          </p>
          <form onSubmit={handleLinkTracking} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Tracking number"
              className={adminFilterInputClass}
            />
            <button
              type="submit"
              disabled={linkingTracking || !trackingInput.trim()}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {linkingTracking ? "Linking…" : "Link tracking"}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-neutral-700">
          <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="min-w-0">
              <span className={compactFieldLabelClass}>
                Content <span className="text-red-600">*</span>
              </span>
              <select
                value={packageForm.content}
                onChange={(e) => updatePackageField("content", e.target.value)}
                className={compactInputClass}
              >
                <option value="">Select content</option>
                {SHIPMENT_CONTENTS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="shrink-0">
              <span className={compactFieldLabelClass}>Unit</span>
              <div className="inline-flex rounded-md border border-neutral-300 p-0.5">
                <button
                  type="button"
                  onClick={() => updatePackageField("weightUnit", "KG")}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold ${
                    packageForm.weightUnit === "KG"
                      ? "bg-sky-600 text-white"
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  KG / CM
                </button>
                <button
                  type="button"
                  onClick={() => updatePackageField("weightUnit", "G")}
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold ${
                    packageForm.weightUnit === "G"
                      ? "bg-sky-600 text-white"
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  G / CM
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <label className="block">
              <span className={compactFieldLabelClass}>
                Weight <span className="text-red-600">*</span>
              </span>
              <div className="flex overflow-hidden rounded-md border border-neutral-300">
                <input
                  type="number"
                  min="0.01"
                  step={packageForm.weightUnit === "G" ? "1" : "0.01"}
                  value={packageForm.weight}
                  onChange={(e) => updatePackageField("weight", e.target.value)}
                  className={`${compactInputClass} border-0 focus:ring-0`}
                  placeholder="Enter weight"
                />
                <span className="flex min-w-[2.25rem] items-center justify-center border-l border-neutral-300 bg-neutral-50 px-1.5 text-[10px] font-semibold text-neutral-600">
                  {packageForm.weightUnit === "G" ? "G" : "KG"}
                </span>
              </div>
            </label>
            {[
              { key: "length", label: "Length" },
              { key: "width", label: "Width" },
              { key: "height", label: "Height" },
            ].map(({ key, label }) => (
              <label key={key} className="block">
                <span className={compactFieldLabelClass}>
                  {label} <span className="text-red-600">*</span>
                </span>
                <div className="flex overflow-hidden rounded-md border border-neutral-300">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={packageForm[key]}
                    onChange={(e) => updatePackageField(key, e.target.value)}
                    className={`${compactInputClass} border-0 focus:ring-0`}
                    placeholder={`Enter ${label.toLowerCase()}`}
                  />
                  <span className="flex min-w-[2.25rem] items-center justify-center border-l border-neutral-300 bg-neutral-50 px-1.5 text-[10px] font-semibold text-neutral-600">
                    CM
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div className="rounded-md border border-neutral-200 p-2.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <label
                className={`inline-flex items-center gap-1.5 text-xs text-neutral-800 ${
                  isPrepaidOrder ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={paymentForm.isCod}
                  disabled={isPrepaidOrder}
                  onChange={(e) => updatePaymentField("isCod", e.target.checked)}
                  className="rounded border-neutral-300 disabled:cursor-not-allowed"
                />
                <span className="font-semibold">COD shipment</span>
              </label>
              {isPrepaidOrder ? (
                <span className="text-[11px] text-neutral-500">Prepaid order — COD unavailable</span>
              ) : !paymentForm.isCod ? (
                <span className="text-[11px] text-neutral-500">Prepaid rates (no COD fees)</span>
              ) : (
                <label className="flex min-w-[10rem] flex-1 items-center gap-1.5 sm:max-w-xs">
                  <span className="shrink-0 text-[11px] font-semibold text-neutral-500">
                    Collect <span className="text-red-600">*</span>
                  </span>
                  <div className="flex min-w-0 flex-1 overflow-hidden rounded-md border border-neutral-300">
                    <span className="flex items-center border-r border-neutral-300 bg-neutral-50 px-2 text-[10px] font-semibold text-neutral-600">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={paymentForm.codAmount}
                      onChange={(e) => updatePaymentField("codAmount", e.target.value)}
                      className={`${compactInputClass} border-0 focus:ring-0`}
                      placeholder="Amount"
                    />
                  </div>
                </label>
              )}
            </div>
            {paymentForm.isCod &&
            (order?.advancePaidAmount > 0 || order?.codAdvanceAmount > 0) ? (
              <p className="mt-1.5 text-[11px] text-neutral-500">
                Total {formatPrice(order.total)} · Advance{" "}
                {formatPrice(order.advancePaidAmount || order.codAdvanceAmount)}
              </p>
            ) : null}
          </div>

          <div className="rounded-md border border-neutral-200 p-2.5">
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <label className="block min-w-0">
                <span className={compactFieldLabelClass}>Note</span>
                <textarea
                  rows={2}
                  value={metadataForm.shipmentNote}
                  onChange={(e) => updateMetadataField("shipmentNote", e.target.value)}
                  className={`${compactInputClass} min-h-[2.5rem] resize-y`}
                  placeholder="Carrier instructions or internal note"
                  maxLength={500}
                />
              </label>
              <div className="shrink-0">
                <span className={compactFieldLabelClass}>Evidence</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <label className="inline-flex cursor-pointer items-center rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-neutral-800 hover:bg-neutral-50">
                    {uploadingEvidence ? "Uploading…" : "Upload"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={uploadingEvidence || creatingLabel}
                      onChange={handleEvidenceUpload}
                    />
                  </label>
                  {metadataForm.evidenceUrl ? (
                    <>
                      <a
                        href={metadataForm.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="max-w-[8rem] truncate text-[11px] font-medium text-sky-700 underline"
                      >
                        {metadataForm.evidenceName || "View"}
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setMetadataForm((prev) => ({
                            ...prev,
                            evidenceUrl: "",
                            evidenceName: "",
                          }))
                        }
                        className="text-[11px] font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className={compactFieldLabelClass}>Shipping partner</span>
            <div className="grid grid-cols-2 gap-1.5 rounded-md border border-neutral-200 p-2 lg:grid-cols-5">
              {(serviceOptions.length ? serviceOptions : SHIPPING_SERVICES).map((entry) => {
                const quote = entry.quote;
                const isSelected = selectedServiceId === entry.id;
                return (
                  <label
                    key={entry.id}
                    className={`flex h-full cursor-pointer flex-col gap-1 rounded-md border px-1.5 py-1.5 ${
                      isSelected
                        ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <span className="flex items-start gap-1.5">
                      <input
                        type="radio"
                        name="shipping-service"
                        checked={isSelected}
                        onChange={() => setSelectedServiceId(entry.id)}
                        className="mt-0.5 shrink-0"
                      />
                      <span className="min-w-0 text-[11px] font-medium leading-snug text-neutral-900">
                        {entry.label}
                      </span>
                    </span>
                    {quote ? (
                      <span className="pl-4 text-[10px] leading-snug text-neutral-600">
                        <span className="block font-semibold text-neutral-800">
                          {formatPrice(quote.totalPrice)}
                        </span>
                        {quote.deliveryEstimate ? (
                          <span className="block truncate">{quote.deliveryEstimate}</span>
                        ) : null}
                      </span>
                    ) : serviceOptions.length > 0 ? (
                      <span className="pl-4 text-[10px] text-amber-700">N/A</span>
                    ) : (
                      <span className="pl-4 text-[10px] text-neutral-500">—</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleFetchRates}
              disabled={loadingRates}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            >
              {loadingRates ? "Fetching…" : "Compare rates"}
            </button>
            <button
              type="button"
              onClick={handleCreateLabel}
              disabled={creatingLabel || !selectedService?.quote}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {creatingLabel ? "Creating…" : "Create label"}
            </button>
          </div>

          {quotedPayment ? (
            <p className="text-[11px] font-medium text-neutral-600">
              Quoted for{" "}
              <span className="font-semibold text-neutral-900">
                {quotedPayment.isCod
                  ? `COD (₹${Number(quotedPayment.codAmount || 0).toLocaleString("en-IN")})`
                  : "Prepaid"}
              </span>
            </p>
          ) : paymentForm.isCod ? (
            <p className="text-[11px] text-neutral-500">
              Compare rates for COD prices at the collection amount above.
            </p>
          ) : null}

          {quoteErrors.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
              {quoteErrors.map((entry) => (
                <p key={entry.carrier}>
                  {entry.carrier}: {entry.message}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
