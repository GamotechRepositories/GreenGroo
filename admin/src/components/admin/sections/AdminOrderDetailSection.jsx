import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatAddressLine, getAddressFullName } from "../../../utils/addressDisplay";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getOrderById,
  getEligibleAdminOrderCoupons,
  getStoreSettings,
  updateAdminOrder,
  deleteAdminOrder,
  updateAdminGiftHamper,
  uploadImageFile,
} from "../../../api/api";
import { adminQueryKeys } from "../../../hooks/queries/queryKeys";
import AdminOrderShipmentPanel from "../AdminOrderShipmentPanel";
import { getOrderNumber } from "../../../utils/orderNumber";
import { getInvoiceFilename } from "@shared/invoice/invoiceHelpers.js";
import { shareInvoicePdf } from "@shared/invoice/downloadInvoiceFromElement.js";
import AdminAlert from "../AdminAlert";
import AdminOrderItemsEditor from "../AdminOrderItemsEditor";
import AdminAddressForm from "../AdminAddressForm";
import { UPLOAD_FOLDERS } from "../../../utils/uploadFolders";
import { IconTrash, IconWhatsApp } from "../AdminIcons";
import {
  adminFilterInputClass,
  btnDanger,
  btnPrimary,
  btnSecondary,
  cardClass,
  iconBtnDangerClass,
} from "../adminStyles";
import {
  ADMIN_DETAIL_ORDER_STATUS_OPTIONS,
  ADMIN_DETAIL_PAYMENT_STATUS_OPTIONS,
  ORDER_PROGRESS_STEPS,
  ORDER_STATUS_STEP_INDEX,
  canEditOrderItems,
  formatDateTime,
  formatPrice,
  getOrderAdvanceBillingSummary,
  getOrderCouponBillingSummary,
  getPaymentStatus,
} from "./adminOrderUtils";

function normalizeIndianWhatsAppPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length > 10) return digits;
  return "";
}

function OrderProgressStepper({ order }) {
  const activeIndex = ORDER_STATUS_STEP_INDEX[order.status] ?? 0;
  const isCancelled = order.status === "cancelled";
  const isReturn = order.status === "return";
  const isTerminal = isCancelled || isReturn;

  return (
    <div className="w-full overflow-x-hidden py-2">
      <div className="flex w-full items-start">
        {ORDER_PROGRESS_STEPS.map((label, index) => {
          const isComplete = !isTerminal && index <= activeIndex;
          const isTerminalStep =
            (isCancelled && index === 4) || (isReturn && index === 5);
          const isActiveStep = isComplete || isTerminalStep;

          return (
            <div key={label} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={`h-0.5 flex-1 ${
                    index === 0
                      ? "invisible"
                      : !isTerminal && index <= activeIndex
                        ? "bg-green-600"
                        : "bg-neutral-200"
                  }`}
                />
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold sm:h-10 sm:w-10 ${
                    isActiveStep
                      ? isReturn && isTerminalStep
                        ? "border-amber-600 bg-amber-600 text-white"
                        : "border-green-600 bg-green-600 text-white"
                      : "border-neutral-200 bg-white text-neutral-400"
                  }`}
                >
                  {isActiveStep ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div
                  className={`h-0.5 flex-1 ${
                    index === ORDER_PROGRESS_STEPS.length - 1
                      ? "invisible"
                      : !isTerminal && index < activeIndex
                        ? "bg-green-600"
                        : "bg-neutral-200"
                  }`}
                />
              </div>
              <p
                className={`mt-2 text-center text-[10px] font-semibold sm:text-xs ${
                  isActiveStep ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                {label}
              </p>
              {index === 0 && isComplete && (
                <p className="mt-0.5 text-center text-[10px] text-neutral-500 sm:text-xs">
                  {formatDateTime(order.createdAt)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminOrderDetailSection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updating, setUpdating] = useState(false);
  const [editingDeliveryCharge, setEditingDeliveryCharge] = useState(false);
  const [deliveryChargeInput, setDeliveryChargeInput] = useState("");
  const [editingAddress, setEditingAddress] = useState(false);
  const [manualTrackingEnabled, setManualTrackingEnabled] = useState(false);
  const [manualTrackingNote, setManualTrackingNote] = useState("");
  const [manualTrackingEvidenceUrl, setManualTrackingEvidenceUrl] = useState("");
  const [manualTrackingEvidenceName, setManualTrackingEvidenceName] = useState("");
  const [uploadingManualTrackingEvidence, setUploadingManualTrackingEvidence] = useState(false);
  const [eligibleCoupons, setEligibleCoupons] = useState([]);
  const [selectedCouponCode, setSelectedCouponCode] = useState("");
  const [couponEligibilityReason, setCouponEligibilityReason] = useState("");
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [sharingInvoice, setSharingInvoice] = useState(false);

  const loadEligibleCoupons = async (orderId) => {
    setLoadingCoupons(true);
    try {
      const { data } = await getEligibleAdminOrderCoupons(orderId);
      const result = data.data || {};
      const coupons = result.coupons || [];
      setEligibleCoupons(coupons);
      setSelectedCouponCode(coupons[0]?.code || "");
      setCouponEligibilityReason(result.reason || "");
    } catch (err) {
      setEligibleCoupons([]);
      setSelectedCouponCode("");
      setCouponEligibilityReason(
        err.response?.data?.message || "Failed to load eligible coupons"
      );
    } finally {
      setLoadingCoupons(false);
    }
  };

  const loadOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getOrderById(id);
      let orderData = data.data;

      if (orderData.status === "delivered" && getPaymentStatus(orderData) === "unpaid") {
        const { data: fixed } = await updateAdminOrder(orderData._id, {
          status: "delivered",
          paymentStatus: "paid",
        });
        orderData = fixed.data;
      }

      setOrder(orderData);
      await loadEligibleCoupons(orderData._id);
    } catch {
      setError("Order not found");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  useEffect(() => {
    const manual = order?.shipment?.manualTracking || {};
    setManualTrackingEnabled(Boolean(manual.enabled));
    setManualTrackingNote(String(manual.note || ""));
    setManualTrackingEvidenceUrl(String(manual.evidenceUrl || ""));
    setManualTrackingEvidenceName(String(manual.evidenceName || ""));
  }, [order?._id, order?.shipment?.manualTracking]);

  const invalidateOrdersList = () => {
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.orders.all });
  };

  const applyUpdatedOrder = (updatedOrder) => {
    setOrder(updatedOrder);
    invalidateOrdersList();
  };

  const handleStatusChange = async (field, value) => {
    if (!order || updating) return;
    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      const payload = { [field]: value };
      if (field === "status" && value === "delivered") {
        payload.paymentStatus = "paid";
      }

      const { data } = await updateAdminOrder(order._id, payload);
      applyUpdatedOrder(data.data);
      setSuccess("Order updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  const handleItemsUpdated = (updatedOrder) => {
    applyUpdatedOrder(updatedOrder);
    setSuccess("Order items updated");
    loadEligibleCoupons(updatedOrder._id);
  };

  const handleApplyCoupon = async () => {
    if (!order || updating || !selectedCouponCode) return;

    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await updateAdminOrder(order._id, {
        couponCode: selectedCouponCode,
      });
      applyUpdatedOrder(data.data);
      setEligibleCoupons([]);
      setSelectedCouponCode("");
      setCouponEligibilityReason("A coupon is already applied to this order");
      setSuccess(`Coupon ${data.data.couponCode || selectedCouponCode} applied`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to apply coupon");
      await loadEligibleCoupons(order._id);
    } finally {
      setUpdating(false);
    }
  };

  const handleStartEditDeliveryCharge = () => {
    if (!order || updating) return;
    setError("");
    setSuccess("");
    setDeliveryChargeInput(String(Number(order.deliveryCharges) || 0));
    setEditingDeliveryCharge(true);
  };

  const handleCancelEditDeliveryCharge = () => {
    setEditingDeliveryCharge(false);
    setDeliveryChargeInput("");
  };

  const handleSaveDeliveryCharge = async () => {
    if (!order || updating) return;

    const nextCharge = Number(deliveryChargeInput);
    if (!Number.isFinite(nextCharge) || nextCharge < 0) {
      setError("Delivery charge must be a valid non-negative number.");
      return;
    }

    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await updateAdminOrder(order._id, { deliveryCharges: nextCharge });
      applyUpdatedOrder(data.data);
      setEditingDeliveryCharge(false);
      setDeliveryChargeInput("");
      setSuccess("Delivery charge updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update delivery charge");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveOrderAddress = async (addressPayload) => {
    if (!order || updating) return;
    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await updateAdminOrder(order._id, {
        deliveryAddress: {
          fullName: addressPayload.fullName,
          number: addressPayload.number,
          email: addressPayload.email,
          shopNo: addressPayload.shopNo,
          shopName: addressPayload.shopName,
          fullAddress: addressPayload.fullAddress,
          landmark: addressPayload.landmark,
          city: addressPayload.city,
          state: addressPayload.state,
          pincode: addressPayload.pincode,
        },
      });
      setOrder(data.data);
      setEditingAddress(false);
      setSuccess("Order delivery address updated");
      invalidateOrdersList();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update delivery address");
    } finally {
      setUpdating(false);
    }
  };

  const handleManualTrackingEvidenceUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP).");
      return;
    }

    setUploadingManualTrackingEvidence(true);
    setError("");
    try {
      const { data } = await uploadImageFile(file, UPLOAD_FOLDERS.SHIPMENT_EVIDENCE);
      const uploadedUrl = data?.data?.url ?? data?.url ?? "";
      if (!uploadedUrl) {
        throw new Error("Upload succeeded but no image URL was returned.");
      }
      setManualTrackingEvidenceUrl(uploadedUrl);
      setManualTrackingEvidenceName(file.name);
      setSuccess("Manual tracking image uploaded");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to upload image");
    } finally {
      setUploadingManualTrackingEvidence(false);
    }
  };

  const handleSaveManualTracking = async () => {
    if (!order || updating) return;
    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await updateAdminOrder(order._id, {
        manualTracking: {
          enabled: manualTrackingEnabled,
          note: manualTrackingNote,
          evidenceUrl: manualTrackingEvidenceUrl,
          evidenceName: manualTrackingEvidenceName,
        },
      });
      applyUpdatedOrder(data.data);
      setSuccess("Manual tracking update saved");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save manual tracking update");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!order || updating) return;
    if (!window.confirm("Delete this order permanently? This cannot be undone.")) return;

    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      await deleteAdminOrder(order._id);
      invalidateOrdersList();
      navigate("/orders", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete order");
      setUpdating(false);
    }
  };

  const handleGiftHamperReview = async (status) => {
    if (!order || updating) return;

    const adminNote =
      status === "rejected"
        ? window.prompt("Optional reason for rejection:") || ""
        : "";

    if (status === "rejected" && adminNote === null) return;

    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await updateAdminGiftHamper(order._id, { status, adminNote });
      applyUpdatedOrder(data.data);
      setSuccess(status === "approved" ? "Gift hamper approved" : "Gift hamper rejected");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update gift hamper");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-w-0 animate-pulse space-y-4">
        <div className="h-12 rounded-xl bg-white" />
        <div className="h-28 rounded-xl bg-white" />
        <div className="h-24 rounded-xl bg-white" />
        <div className="h-40 rounded-xl bg-white" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-w-0 text-center">
        <p className="mb-4 text-text-secondary">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Back to Orders
        </button>
      </div>
    );
  }

  const addr = order.deliveryAddress;
  const payment = getPaymentStatus(order);
  const orderId = getOrderNumber(order);
  const customerEmail = order.user?.email || "";
  const customerName = order.user?.name || getAddressFullName(addr) || "—";
  const addressLine = formatAddressLine(addr);
  const advanceBilling = getOrderAdvanceBillingSummary(order);
  const couponBilling = getOrderCouponBillingSummary(order);
  const customerPhoneRaw = addr?.number || order.user?.phone || "";
  const customerWaPhone = normalizeIndianWhatsAppPhone(customerPhoneRaw);
  const selectedCoupon = eligibleCoupons.find(
    (coupon) => coupon.code === selectedCouponCode
  );

  const handleShareInvoice = async () => {
    if (!order || sharingInvoice) return;

    setSharingInvoice(true);
    setError("");
    setSuccess("");
    try {
      const settingsRes = await getStoreSettings().catch(() => null);
      const storeSettings = settingsRes?.data?.data || null;
      const filename = getInvoiceFilename(order);
      const result = await shareInvoicePdf(
        { order, customer: order.user, storeSettings },
        filename
      );

      if (result.method === "download") {
        setSuccess("Invoice PDF downloaded");
      }
    } catch (err) {
      setError(err?.message || "Failed to share invoice PDF");
    } finally {
      setSharingInvoice(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!customerWaPhone) {
      setError("Customer phone number not available for WhatsApp.");
      return;
    }
    setError("");
    const text = `Hi, speaking from Bulk Mobile Mart.`;
    const url = `https://wa.me/${customerWaPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-w-0 space-y-4">
      <AdminAlert
        error={error}
        success={success}
        onClear={() => {
          setError("");
          setSuccess("");
        }}
      />

      {/* Top bar */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="shrink-0 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          ← Orders
        </button>
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto hide-scrollbar">
          <Link
            to={`/orders/${order._id}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50 sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">Invoice</span>
            <span className="hidden sm:inline">Bill Invoice</span>
          </Link>
          <button
            type="button"
            onClick={handleShareInvoice}
            disabled={sharingInvoice}
            className="inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border border-border-light px-3 py-2 text-xs font-medium text-text-primary transition hover:border-primary hover:text-primary disabled:opacity-50 sm:px-4 sm:text-sm"
          >
            {sharingInvoice ? "Preparing..." : "Share Invoice"}
          </button>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            aria-label="Open WhatsApp"
            title="WhatsApp"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white text-green-600 transition hover:bg-neutral-50 sm:h-10 sm:w-10"
          >
            <IconWhatsApp className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={updating}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-50 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <IconTrash className="h-4 w-4" />
            Delete Order
          </button>
        </div>
      </div>

      {/* Order ID + status dropdowns */}
      <div className={`${cardClass} flex flex-wrap items-start justify-between gap-4`}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Order ID
          </p>
          <p className="mt-1 text-lg font-bold text-neutral-900">#{orderId}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[140px]">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Order Status
            </label>
            <select
              value={order.status}
              disabled={updating}
              onChange={(e) => handleStatusChange("status", e.target.value)}
              className={adminFilterInputClass}
            >
              {ADMIN_DETAIL_ORDER_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Payment Status
            </label>
            <select
              value={payment}
              disabled={updating}
              onChange={(e) => handleStatusChange("paymentStatus", e.target.value)}
              className={adminFilterInputClass}
            >
              {ADMIN_DETAIL_PAYMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {(order.message || order.customerNote || order.customerMessage)?.trim() && (
        <div className={cardClass}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">
            Customer Message
          </h3>
          <p className="text-sm leading-relaxed text-neutral-700">
            {order.message || order.customerNote || order.customerMessage}
          </p>
        </div>
      )}

      {/* Progress stepper */}
      <div className={cardClass}>
        <OrderProgressStepper order={order} />
      </div>

      {/* Customer + Address */}
      <div className={`${cardClass} grid gap-6 md:grid-cols-2`}>
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
            Customer
          </h3>
          <p className="font-semibold text-neutral-900">
            {customerName}
            {customerEmail && (
              <span className="font-normal text-neutral-500"> ({customerEmail})</span>
            )}
          </p>
          <p className="mt-1 text-sm text-neutral-600">{addr?.number || order.user?.phone}</p>
          <p className="mt-6 text-xs font-bold uppercase tracking-wide text-neutral-500">Total</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{formatPrice(order.total)}</p>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
            Address
          </h3>
          {!editingAddress ? (
            <>
              <p className="text-sm leading-relaxed text-neutral-700">{addressLine}</p>
              <button
                type="button"
                onClick={() => setEditingAddress(true)}
                disabled={updating || ["delivered", "cancelled", "return"].includes(order.status)}
                className="mt-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >
                Edit address
              </button>
              {["delivered", "cancelled", "return"].includes(order.status) ? (
                <p className="mt-1 text-xs text-neutral-500">
                  Address can not be edited for delivered/cancelled/return orders.
                </p>
              ) : null}
            </>
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <AdminAddressForm
                initial={{
                  fullName: addr?.fullName || "",
                  number: addr?.number || "",
                  email: addr?.email || "",
                  shopNo: addr?.shopNo || "",
                  shopName: addr?.shopName || "",
                  fullAddress: addr?.fullAddress || "",
                  landmark: addr?.landmark || "",
                  city: addr?.city || "",
                  state: addr?.state || "",
                  pincode: addr?.pincode || "",
                }}
                onSubmit={handleSaveOrderAddress}
                onCancel={() => setEditingAddress(false)}
                submitting={updating}
                submitLabel="Update Address"
              />
            </div>
          )}
          <p className="mt-3 text-sm text-neutral-600">
            Payment Mode:{" "}
            <span className="capitalize">
              {order.paymentMethod === "cod" ? "cash" : order.paymentMethod}
            </span>
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Payment Status: <span className="lowercase">{payment}</span>
          </p>
          {order.paymentMethod === "online" && order.razorpayPaymentId && (
            <p className="mt-3 text-sm text-neutral-600">
              Payment Time:{" "}
              <span className="font-medium text-neutral-800">
                {formatDateTime(order.paidAt || order.createdAt)}
              </span>
            </p>
          )}
          <p className="mt-4 text-right text-sm text-neutral-600">
            Items total: {formatPrice(order.subtotal)}
          </p>
        </div>
      </div>

      <AdminOrderShipmentPanel
        order={order}
        onOrderUpdated={applyUpdatedOrder}
        onError={setError}
        onSuccess={setSuccess}
      />

      <div className={cardClass}>
        <h3 className="mb-3 text-sm font-bold text-neutral-900">Manual Tracking Update</h3>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-neutral-800">
          <input
            type="checkbox"
            checked={manualTrackingEnabled}
            onChange={(event) => setManualTrackingEnabled(event.target.checked)}
            className="rounded border-neutral-300"
          />
          Show manual tracking update to customer
        </label>

        {manualTrackingEnabled ? (
          <div className="mt-3 space-y-2">
            <textarea
              rows={3}
              value={manualTrackingNote}
              onChange={(event) => setManualTrackingNote(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-800"
              placeholder="Add shipment note visible to customer"
              maxLength={500}
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50">
                {uploadingManualTrackingEvidence ? "Uploading..." : "Upload shipment image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploadingManualTrackingEvidence || updating}
                  onChange={handleManualTrackingEvidenceUpload}
                />
              </label>
              {manualTrackingEvidenceUrl ? (
                <>
                  <a
                    href={manualTrackingEvidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-[14rem] truncate text-xs font-medium text-sky-700 underline"
                  >
                    {manualTrackingEvidenceName || "View image"}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setManualTrackingEvidenceUrl("");
                      setManualTrackingEvidenceName("");
                    }}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSaveManualTracking}
          disabled={updating}
          className={`${btnPrimary} mt-3`}
        >
          {updating ? "Saving..." : "Save Manual Tracking"}
        </button>
      </div>

      <AdminOrderItemsEditor
        order={order}
        disabled={updating || !canEditOrderItems(order.status)}
        itemsEditable={canEditOrderItems(order.status)}
        onUpdated={handleItemsUpdated}
        onError={setError}
        onSuccess={setSuccess}
      />

      {order.giftHamper?.gift?.name ? (
        <div className={cardClass}>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Gift Hamper</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Threshold: {formatPrice(order.giftHamper.minOrderAmount)} · Status:{" "}
                <span className="font-semibold capitalize">{order.giftHamper.status}</span>
              </p>
            </div>
            {order.giftHamper.status === "pending" ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleGiftHamperReview("approved")}
                  className={btnPrimary}
                >
                  Approve hamper
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleGiftHamperReview("rejected")}
                  className={btnSecondary}
                >
                  Reject
                </button>
              </div>
            ) : null}
          </div>
          <div className="flex items-start gap-4">
            {order.giftHamper.gift.image ? (
              <img
                src={order.giftHamper.gift.image}
                alt=""
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : null}
            <div>
              <p className="font-semibold text-neutral-900">{order.giftHamper.gift.name}</p>
              {order.giftHamper.gift.description ? (
                <p className="mt-1 text-sm text-neutral-600">{order.giftHamper.gift.description}</p>
              ) : null}
              {order.giftHamper.adminNote ? (
                <p className="mt-2 text-xs text-neutral-500">Note: {order.giftHamper.adminNote}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Billing summary */}
      <div className={cardClass}>
        <h3 className="mb-4 text-sm font-bold text-neutral-900">Billing Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {couponBilling.hasCoupon ? (
            <div className="flex justify-between text-green-700">
              <span>
                Coupon Applied
                {couponBilling.couponCode ? ` (${couponBilling.couponCode})` : ""}
              </span>
              <span>-{formatPrice(couponBilling.couponDiscount)}</span>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Apply eligible coupon
              </p>
              {loadingCoupons ? (
                <p className="mt-2 text-xs text-neutral-500">Checking eligible coupons...</p>
              ) : eligibleCoupons.length > 0 ? (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    value={selectedCouponCode}
                    onChange={(event) => setSelectedCouponCode(event.target.value)}
                    disabled={updating}
                    className={`${adminFilterInputClass} min-w-0 flex-1`}
                    aria-label="Select eligible coupon"
                  >
                    {eligibleCoupons.map((coupon) => (
                      <option key={coupon.code} value={coupon.code}>
                        {coupon.code}
                        {coupon.title ? ` — ${coupon.title}` : ""}
                        {` (save ${formatPrice(coupon.discountAmount)})`}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={updating || !selectedCouponCode}
                    className={btnPrimary}
                  >
                    {updating ? "Applying..." : "Apply Coupon"}
                  </button>
                  {selectedCoupon ? (
                    <span className="shrink-0 text-xs font-semibold text-green-700">
                      -{formatPrice(selectedCoupon.discountAmount)}
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-xs text-neutral-500">
                  {couponEligibilityReason || "No eligible coupons for this order."}
                </p>
              )}
            </div>
          )}
          <div className="flex justify-between text-neutral-600">
            <span>Delivery Charges</span>
            {editingDeliveryCharge ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deliveryChargeInput}
                  onChange={(e) => setDeliveryChargeInput(e.target.value)}
                  className="w-28 rounded-md border border-neutral-300 px-2 py-1 text-right text-sm"
                  disabled={updating}
                />
                <button
                  type="button"
                  className={btnPrimary}
                  onClick={handleSaveDeliveryCharge}
                  disabled={updating}
                >
                  Save
                </button>
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={handleCancelEditDeliveryCharge}
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span>
                  {order.deliveryCharges === 0 ? "Free" : formatPrice(order.deliveryCharges)}
                </span>
                <button
                  type="button"
                  onClick={handleStartEditDeliveryCharge}
                  disabled={updating}
                  className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-neutral-500">All prices include GST.</p>
          {advanceBilling.hasAdvance ? (
            <>
              <div className="flex justify-between border-t border-neutral-200 pt-3 text-neutral-900">
                <span className="font-semibold">Order Total</span>
                <span className="font-semibold">{formatPrice(advanceBilling.orderTotal)}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Advance Paid (10%)</span>
                <span>-{formatPrice(advanceBilling.advancePaid)}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold text-neutral-900">
                <span>Balance Due on Delivery</span>
                <span>{formatPrice(advanceBilling.remainingBalance)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold text-neutral-900">
              <span>Total Amount</span>
              <span>{formatPrice(advanceBilling.orderTotal)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminOrderDetailSection;
