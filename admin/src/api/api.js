import axios from "axios";
import { ADMIN_STORAGE_KEY } from "../utils/authStorage";
import { uploadFileWithProgress } from "../utils/presignedUpload.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: API_URL,
});

function getRequestToken() {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!stored) return null;

  try {
    const { token } = JSON.parse(stored);
    return token || null;
  } catch {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    return null;
  }
}

api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const token = getRequestToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const getAllHeroBanners = (params) => api.get("/api/herobanners/all", { params });
export const addHeroBanner = (data) =>
  api.post("/api/herobanners", data, {
    params: { device: data.bannerFor || data.device },
  });
export const updateHeroBanner = (id, data) =>
  api.put(`/api/herobanners/${id}`, data, {
    params: { device: data.bannerFor || data.device },
  });
export const deleteHeroBanner = (id) => api.delete(`/api/herobanners/${id}`);

export const getOfferBanners = (device = "desktop") =>
  api.get("/api/offerbanners", { params: { device } });
export const getAllOfferBanners = (params) => api.get("/api/offerbanners/all", { params });
export const addOfferBanner = (data) =>
  api.post("/api/offerbanners", data, {
    params: { device: data?.device || data?.bannerFor },
  });
export const updateOfferBanner = (id, data) =>
  api.put(`/api/offerbanners/${id}`, data, {
    params: { device: data?.device || data?.bannerFor },
  });
export const deleteOfferBanner = (id) => api.delete(`/api/offerbanners/${id}`);

export const getAllCategories = (params) => api.get("/api/categories/all", { params });
export const addCategory = (data) => api.post("/api/categories", data);
export const updateCategory = (id, data) => api.put(`/api/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/api/categories/${id}`);

export const getAllBrands = (params) => api.get("/api/brands/all", { params });
export const addBrand = (data) => api.post("/api/brands", data);
export const updateBrand = (id, data) => api.put(`/api/brands/${id}`, data);
export const deleteBrand = (id) => api.delete(`/api/brands/${id}`);

export const getAllTestimonials = (params) => api.get("/api/testimonials/all", { params });
export const addTestimonial = (data) => api.post("/api/testimonials", data);
export const updateTestimonial = (id, data) =>
  api.put(`/api/testimonials/${id}`, data);
export const deleteTestimonial = (id) => api.delete(`/api/testimonials/${id}`);

export const getStoreSettings = () => api.get("/api/settings/admin");
export const updateStoreSettings = (data) => api.put("/api/settings", data);
export const getEnviaWebhookSetup = () => api.get("/api/settings/envia/webhook");
export const registerEnviaWebhook = () => api.post("/api/settings/envia/webhook/register");

export const getAllProducts = (params) => api.get("/api/products/all", { params });
export const addProduct = (data) => api.post("/api/products", data);
export const updateProduct = (id, data) => api.put(`/api/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/api/products/${id}`);

export const loginUser = (data) => api.post("/api/users/login", data);
export const requestAdminPasswordReset = (data) =>
  api.post("/api/users/admin/forgot-password", data);
export const resetAdminPassword = (data) =>
  api.post("/api/users/admin/reset-password", data);
export const getUsers = (params) => api.get("/api/users", { params });
export const getUserOrderStats = (id) => api.get(`/api/users/${id}/order-stats`);
export const getCurrentUser = () => api.get("/api/users/me");
export const sendAdminSecurityOtp = () => api.post("/api/users/me/security-otp");
export const updateCurrentUser = (data) => api.patch("/api/users/me", data);
export const changeMyPassword = (data) => api.patch("/api/users/me/password", data);
export const createUser = (data) => api.post("/api/users", data);
export const getUserAddresses = (userId) => api.get(`/api/users/${userId}/addresses`);
export const createUserAddress = (userId, data) =>
  api.post(`/api/users/${userId}/addresses`, data);
export const updateUserAddress = (userId, addressId, data) =>
  api.put(`/api/users/${userId}/addresses/${addressId}`, data);
export const updateUser = (id, data) => api.put(`/api/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/api/users/${id}`);

export const getOrderById = (id) => api.get(`/api/orders/${id}`);
export const getAdminOrders = (params) => api.get("/api/orders/admin/all", { params });
export const getAdminOrderUnreadCount = (params) =>
  api.get("/api/orders/admin/unread-count", { params });
export const getDashboardStats = (params) =>
  api.get("/api/orders/admin/dashboard-stats", { params });
export const getEligibleAdminOrderCoupons = (id) =>
  api.get(`/api/orders/admin/${id}/eligible-coupons`);
export const updateAdminOrder = (id, data) => api.patch(`/api/orders/admin/${id}`, data);
export const deleteAdminOrder = (id) => api.delete(`/api/orders/admin/${id}`);
export const createAdminOrder = (data) => api.post("/api/orders/admin/create", data);
export const getAdminGiftHamperOrders = (params) =>
  api.get("/api/orders/admin/gift-hampers", { params });
export const updateAdminGiftHamper = (id, data) =>
  api.patch(`/api/orders/admin/${id}/gift-hamper`, data);
export const quoteAdminOrderShipmentRates = (id, data) =>
  api.post(`/api/orders/admin/${id}/shipment/envia/rates`, data);
export const createAdminOrderShipment = (id, data) =>
  api.post(`/api/orders/admin/${id}/shipment/envia`, data);
export const syncAdminOrderShipment = (id) =>
  api.post(`/api/orders/admin/${id}/shipment/envia/sync`);
export const cancelAdminOrderShipment = (id, data) =>
  api.post(`/api/orders/admin/${id}/shipment/envia/cancel`, data);
export const linkAdminOrderShipment = (id, data) =>
  api.post(`/api/orders/admin/${id}/shipment/envia/link`, data);

export const getAdminRazorpayTransactions = (params) =>
  api.get("/api/payments/admin/razorpay", { params });
export const getAdminPaymentProofs = (params) => api.get("/api/payments/admin", { params });
export const getAdminPaymentUnreadCount = (params) =>
  api.get("/api/payments/admin/unread-count", { params });
export const getAdminPaymentProof = (id) => api.get(`/api/payments/admin/${id}`);
export const updateAdminPaymentProof = (id, data) =>
  api.patch(`/api/payments/admin/${id}`, data);

export const getAdminSupportMessages = (params) => api.get("/api/support/admin", { params });
export const getAdminSupportUnreadCount = (params) =>
  api.get("/api/support/admin/unread-count", { params });
export const getAdminInboxSummary = (params) =>
  api.get("/api/admin/notifications/inbox-summary", { params });
export const getAdminInboxAlerts = () =>
  api.get("/api/admin/notifications/inbox");
export const createAdminInboxAlert = (data) =>
  api.post("/api/admin/notifications/inbox", data);
export const markAdminInboxAlertRead = (id) =>
  api.put(`/api/admin/notifications/inbox/${id}/read`);
export const markAllAdminInboxAlertsRead = () =>
  api.put("/api/admin/notifications/inbox/read-all");
export const getPromotionalAudienceStats = () =>
  api.get("/api/admin/notifications/promotional/audience");
export const getPromotionalNotificationHistory = (params) =>
  api.get("/api/admin/notifications/promotional/history", { params });
export const sendPromotionalNotification = (data) =>
  api.post("/api/admin/notifications/promotional/send", data);
export const getAdminSupportMessage = (id) => api.get(`/api/support/admin/${id}`);
export const updateAdminSupportStatus = (id, data) =>
  api.patch(`/api/support/admin/${id}`, data);

export const getAllCoupons = (params) => api.get("/api/coupons", { params });
export const createCoupon = (data) => api.post("/api/coupons", data);
export const updateCoupon = (id, data) => api.put(`/api/coupons/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/api/coupons/${id}`);
export const validateCoupon = (data) => api.post("/api/coupons/validate", data);

/**
 * Upload an image directly to S3 via a presigned URL.
 */
export const uploadImageFile = async (file, folder) => {
  const { data: presignRes } = await api.post("/api/upload/presign", {
    folder,
    mimeType: file.type,
    filename: file.name,
  });

  const { uploadUrl, cloudFrontUrl } = presignRes.data;

  // 2. PUT the file directly to S3 — no auth header, just the correct Content-Type
  const s3Res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!s3Res.ok) {
    throw new Error(`S3 upload failed (${s3Res.status}). Check your S3 CORS configuration.`);
  }

  // 3. Return in the same shape the old route returned so callers need no changes
  return { data: { data: { url: cloudFrontUrl } } };
};

export const uploadVideoFile = async (file, folder, { onProgress } = {}) => {
  const { data: presignRes } = await api.post("/api/upload/presign", {
    folder,
    mimeType: file.type,
    filename: file.name,
  });

  const { uploadUrl, cloudFrontUrl } = presignRes.data;

  await uploadFileWithProgress({
    url: uploadUrl,
    file,
    contentType: file.type,
    onProgress,
  });

  return { data: { data: { url: cloudFrontUrl } } };
};

export default api;
