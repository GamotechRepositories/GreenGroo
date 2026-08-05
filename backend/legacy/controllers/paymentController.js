import crypto from "crypto";
import razorpay, { isRazorpayConfigured } from "../config/razorpay.js";
import Order from "../models/order/Order.js";
import Payment from "../models/payment/Payment.js";
import {
  finalizeOrder,
  normalizeOrderMessage,
  prepareOrderData,
  upsertCheckoutAttemptOrder,
} from "../utils/orderHelpers.js";
import { resolveImageForStorage } from "../utils/imageValidation.js";
import { UPLOAD_FOLDERS } from "../utils/uploadFolders.js";
import {
  calculatePayableAmount,
  getRazorpayPaidAt,
  getRazorpayPaymentId,
  getRazorpayTransactionAmount,
  RAZORPAY_SUCCESS_PAYMENT_STATUSES,
} from "../utils/paymentHelpers.js";
import { buildPaginatedResponse, getPaginationParams } from "../utils/pagination.js";
import { buildOrderSearchFilter } from "../utils/adminSearch.js";
import {
  notifyOrderCreated,
  notifyPaymentFailed,
  notifyPaymentSuccess,
} from "../services/orderNotificationDispatcher.js";

function normalizeText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

const SUCCESSFUL_RAZORPAY_STATUSES = new Set(["captured", "authorized"]);

async function fetchRazorpayCapturedAmount(paymentId) {
  if (!isRazorpayConfigured() || !paymentId) return null;

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    if (!payment || !SUCCESSFUL_RAZORPAY_STATUSES.has(payment.status)) {
      return null;
    }

    return Math.round(Number(payment.amount) / 100 * 100) / 100;
  } catch {
    return null;
  }
}

async function resolveOrderRazorpayAmount(order) {
  const paymentId = getRazorpayPaymentId(order);
  const apiAmount = await fetchRazorpayCapturedAmount(paymentId);

  if (apiAmount != null) {
    const updates = {};
    if (Number(order.razorpayPaidAmount) !== apiAmount) {
      updates.razorpayPaidAmount = apiAmount;
    }
    if (order.paymentStatus === "paid_10" && Number(order.codAdvanceAmount) !== apiAmount) {
      updates.codAdvanceAmount = apiAmount;
    }
    if (Object.keys(updates).length) {
      await Order.updateOne({ _id: order._id }, { $set: updates });
    }
    return apiAmount;
  }

  return getRazorpayTransactionAmount(order);
}

export const createRazorpayOrder = async (req, res) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(500).json({
        success: false,
        message: "Online payment is not configured. Please contact support.",
      });
    }

    const { addressId, paymentMode = "online", checkoutItems, checkoutMode, buyNow, couponCode } =
      req.body;
    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    if (!["online", "cod_advance"].includes(paymentMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment mode",
      });
    }

    const result = await prepareOrderData(req.user._id, addressId, {
      checkoutItems,
      checkoutMode,
      buyNow,
      couponCode,
    });
    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error,
        ...(result.code ? { code: result.code } : {}),
        ...(result.removedItems ? { removedItems: result.removedItems } : {}),
      });
    }

    const attemptedOrder = await upsertCheckoutAttemptOrder(
      req.user._id,
      {
        orderItems: result.orderItems,
        deliveryAddress: result.deliveryAddress,
        subtotal: result.subtotal,
        couponCode: result.couponCode,
        couponDiscount: result.couponDiscount,
        deliveryCharges: result.deliveryCharges,
        gstAmount: result.gstAmount,
        total: result.total,
        cart: result.cart,
        checkoutMode: result.checkoutMode,
      },
      paymentMode === "cod_advance" ? "cod" : "online"
    );

    const payableAmount = calculatePayableAmount(result.total, paymentMode);
    const amountPaise = Math.round(payableAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `bmm_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        addressId: String(addressId),
        paymentMode,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        keyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        paymentMode,
        payableAmount,
        orderTotal: result.total,
        attemptedOrderId: attemptedOrder._id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment order",
    });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(500).json({
        success: false,
        message: "Online payment is not configured",
      });
    }

    const {
      addressId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMode = "online",
      checkoutItems,
      checkoutMode,
      buyNow,
      attemptedOrderId,
      couponCode,
    } = req.body;
    const orderMessage = normalizeOrderMessage(req.body);

    if (!["online", "cod_advance"].includes(paymentMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment mode",
      });
    }

    if (!addressId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment details are incomplete",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Please try again.",
      });
    }

    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    const result = await prepareOrderData(req.user._id, addressId, {
      checkoutItems,
      checkoutMode,
      buyNow,
      couponCode,
    });

    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error,
        ...(result.code ? { code: result.code } : {}),
        ...(result.removedItems ? { removedItems: result.removedItems } : {}),
      });
    }

    const payableAmount = calculatePayableAmount(result.total, paymentMode);
    const expectedAmount = Math.round(payableAmount * 100);
    if (Number(razorpayOrder.amount) !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: "Payment amount does not match order total",
      });
    }

    const isCodAdvance = paymentMode === "cod_advance";

    const order = await finalizeOrder({
      userId: req.user._id,
      orderItems: result.orderItems,
      deliveryAddress: result.deliveryAddress,
      subtotal: result.subtotal,
      couponCode: result.couponCode,
      couponDiscount: result.couponDiscount,
      deliveryCharges: result.deliveryCharges,
      gstAmount: result.gstAmount,
      total: result.total,
      cart: result.cart,
      checkoutMode: result.checkoutMode,
      paymentMethod: isCodAdvance ? "cod" : "online",
      paymentStatus: isCodAdvance ? "paid_10" : "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: isCodAdvance ? "" : razorpay_payment_id,
      codAdvanceAmount: isCodAdvance ? payableAmount : 0,
      codAdvanceRazorpayPaymentId: isCodAdvance ? razorpay_payment_id : "",
      razorpayPaidAmount: payableAmount,
      paidAt: isCodAdvance ? null : new Date(),
      ...(isCodAdvance ? { codAdvancePaidAt: new Date() } : {}),
      message: orderMessage,
      attemptedOrderId,
    });

    void notifyOrderCreated(order, {
      previousStatus: attemptedOrderId ? "attempted" : null,
    });
    void notifyPaymentSuccess(order, { paymentMode });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
};

export const submitUpiPaymentProof = async (req, res) => {
  try {
    const {
      addressId,
      paymentMode = "online",
      checkoutItems,
      checkoutMode,
      buyNow,
      attemptedOrderId,
      couponCode,
    } = req.body;
    const orderMessage = normalizeOrderMessage(req.body);
    const screenshot = typeof req.body.screenshot === "string" ? req.body.screenshot : "";
    const screenshotName = normalizeText(req.body.screenshotName, 200);
    const upiTransactionRef = normalizeText(req.body.upiTransactionRef, 100);

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    if (!["online", "cod_advance"].includes(paymentMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment mode",
      });
    }

    if (!screenshot) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot is required",
      });
    }

    const resolvedScreenshot = await resolveImageForStorage(
      screenshot,
      UPLOAD_FOLDERS.PAYMENT_PROOFS
    );
    if (resolvedScreenshot.error) {
      return res.status(400).json({
        success: false,
        message: resolvedScreenshot.error,
      });
    }

    const result = await prepareOrderData(req.user._id, addressId, {
      checkoutItems,
      checkoutMode,
      buyNow,
      couponCode,
    });
    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error,
        ...(result.code ? { code: result.code } : {}),
        ...(result.removedItems ? { removedItems: result.removedItems } : {}),
      });
    }

    const isCodAdvance = paymentMode === "cod_advance";
    const payableAmount = isCodAdvance
      ? Math.round(result.total * 0.1 * 100) / 100
      : result.total;

    const order = await finalizeOrder({
      userId: req.user._id,
      orderItems: result.orderItems,
      deliveryAddress: result.deliveryAddress,
      subtotal: result.subtotal,
      couponCode: result.couponCode,
      couponDiscount: result.couponDiscount,
      deliveryCharges: result.deliveryCharges,
      gstAmount: result.gstAmount,
      total: result.total,
      cart: result.cart,
      checkoutMode: result.checkoutMode,
      paymentMethod: isCodAdvance ? "cod" : "online",
      paymentStatus: "pending_verification",
      status: "confirm",
      codAdvanceAmount: isCodAdvance ? payableAmount : 0,
      message: orderMessage,
      attemptedOrderId,
    });

    void notifyOrderCreated(order, {
      previousStatus: attemptedOrderId ? "attempted" : null,
    });

    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      orderNumber: order.orderNumber,
      paymentMethod: isCodAdvance ? "cod" : "online",
      paymentType: paymentMode,
      source: "upi_manual",
      amount: payableAmount,
      orderTotal: result.total,
      subtotal: result.subtotal,
      couponCode: result.couponCode,
      couponDiscount: result.couponDiscount,
      deliveryCharges: result.deliveryCharges,
      items: result.orderItems,
      deliveryAddress: result.deliveryAddress,
      screenshot: resolvedScreenshot.url,
      screenshotName,
      upiTransactionRef,
      customerMessage: orderMessage,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message:
        "Order confirmed. We will verify your UPI payment screenshot shortly.",
      data: {
        order,
        paymentId: payment._id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit payment proof",
    });
  }
};

export const getPaymentUnreadCount = async (req, res) => {
  try {
    const { since } = req.query;
    const filter = { status: "pending" };

    if (since) {
      const sinceDate = new Date(since);
      if (Number.isNaN(sinceDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid since date" });
      }
      filter.createdAt = { $gt: sinceDate };
    }

    const count = await Payment.countDocuments(filter);

    return res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load unread payment count",
    });
  }
};

export const getAdminRazorpayTransactions = async (req, res) => {
  try {
    const { startDate, endDate, status, search } = req.query;
    const { page, limit, skip } = getPaginationParams(req.query);
    const andClauses = [
      {
        $or: [
          { razorpayPaymentId: { $nin: ["", null] } },
          { codAdvanceRazorpayPaymentId: { $nin: ["", null] } },
        ],
      },
      {
        paymentStatus: { $in: RAZORPAY_SUCCESS_PAYMENT_STATUSES },
      },
    ];

    if (status && status !== "all") {
      andClauses.push({ status });
    }

    if (startDate || endDate) {
      const paidAtRange = {};
      if (startDate) {
        paidAtRange.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        paidAtRange.$lte = end;
      }

      andClauses.push({
        $or: [{ paidAt: paidAtRange }, { codAdvancePaidAt: paidAtRange }],
      });
    }

    const searchClause = await buildOrderSearchFilter(search);
    if (searchClause) {
      andClauses.push(searchClause);
    }

    const filter = { $and: andClauses };

    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .populate("user", "name email phone")
        .sort({ paidAt: -1, codAdvancePaidAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const data = await Promise.all(
      orders.map(async (order) => {
        const razorpayTransactionAmount = await resolveOrderRazorpayAmount(order);

        return {
          ...order,
          razorpayTransactionId: getRazorpayPaymentId(order),
          razorpayTransactionAmount,
          razorpayPaidAmount: razorpayTransactionAmount || order.razorpayPaidAmount || 0,
          razorpayPaidAt: getRazorpayPaidAt(order),
        };
      })
    );

    res.status(200).json(buildPaginatedResponse(data, total, page, limit));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load Razorpay transactions",
    });
  }
};

export const getAdminPayments = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, orderIds } = req.query;
    const filter = {};

    if (status && ["pending", "verified", "rejected"].includes(status)) {
      filter.status = status;
    }

    if (orderIds) {
      const ids = String(orderIds)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        filter.order = { $in: ids };
      }
    }

    const [total, payments] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email phone")
        .populate("order", "orderNumber status paymentStatus total")
        .lean(),
    ]);

    res.status(200).json(buildPaginatedResponse(payments, total, page, limit));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load payment records",
    });
  }
};

export const getAdminPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("order", "orderNumber status paymentStatus total paymentMethod")
      .lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load payment record",
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { status, rejectionReason = "" } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be verified or rejected",
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This payment has already been reviewed",
      });
    }

    payment.status = status;
    payment.verifiedAt = new Date();
    payment.verifiedBy = req.user._id;

    if (status === "rejected") {
      payment.rejectionReason = normalizeText(rejectionReason, 300);
    } else {
      payment.rejectionReason = "";
    }

    await payment.save();

    const order = await Order.findById(payment.order);

    if (status === "verified") {
      if (payment.paymentType === "online") {
        await Order.findByIdAndUpdate(payment.order, {
          status: "confirm",
          paymentStatus: "paid",
          paidAt: new Date(),
        });
      } else {
        await Order.findByIdAndUpdate(payment.order, {
          status: "confirm",
          paymentStatus: "paid_10",
          codAdvanceAmount: payment.amount,
          codAdvancePaidAt: new Date(),
        });
      }

      if (order) {
        void notifyPaymentSuccess(order, { source: "upi_manual" });
      }
    } else {
      await Order.findByIdAndUpdate(payment.order, {
        status: "cancelled",
        paymentStatus: "unpaid",
      });

      if (order) {
        void notifyPaymentFailed(order, { source: "upi_manual", reason: "payment_rejected" });
      }
    }

    res.status(200).json({
      success: true,
      message:
        status === "verified"
          ? "Payment approved successfully"
          : "Payment proof rejected and order cancelled",
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update payment status",
    });
  }
};
