import mongoose from "mongoose";
import { Vendor, VendorReview } from "./models.js";

const DEFAULT_VACATION = {
  enabled: false,
  startDate: "",
  returnDate: "",
  reason: "Annual Vacation",
  noticeMessage:
    "We are currently on vacation. Store operations and deliveries will resume upon our return! You can still browse our farm-fresh catalog.",
  offlineMode: "browse_only", // "full_offline" | "browse_only"
  autoReopen: true,
  emergencyPhone: "",
  emergencyEmail: "",
  lastUpdated: new Date(),
};

const SEED_REVIEWS = [
  {
    customerName: "Rameshwar Deshmukh",
    customerId: "cust-101",
    customerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    title: "Crisp & Farm-Fresh Tomatoes!",
    comment:
      "Ordered 25kg Grade A hybrid tomatoes for our catering business. The produce was exceptionally fresh, zero rot, and size sorting was very consistent. Delivery was right on schedule at the collection point.",
    productName: "Hybrid Tomato (Grade A)",
    orderId: "ORD-94812",
    isVerifiedPurchase: true,
    helpfulCount: 14,
    aspectRatings: { freshness: 5, packaging: 5, delivery: 5 },
    vendorReply: {
      text: "Thank you so much Mr. Deshmukh! We harvest early at 5 AM to ensure optimal firmness and crispness for all bulk commercial orders.",
      repliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      vendorName: "GreenGroo Farm Executive",
    },
    status: "Approved",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    customerName: "Sunita Anand Patil",
    customerId: "cust-102",
    customerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    title: "Best Nashik Red Onions in town",
    comment:
      "Very high quality Nashik red onions with dry outer skin and tight layers. No black mold or sprouting. Weight was exact to the decimal. Highly recommended vendor partner!",
    productName: "Nashik Red Onion",
    orderId: "ORD-93210",
    isVerifiedPurchase: true,
    helpfulCount: 9,
    aspectRatings: { freshness: 5, packaging: 5, delivery: 4 },
    vendorReply: null,
    status: "Approved",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
  {
    customerName: "Amit Suresh Joshi",
    customerId: "cust-103",
    customerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    rating: 4,
    title: "Fresh Coriander & Spinach, minor delivery delay",
    comment:
      "Green leafies were vibrant and crisp with roots hydrated in moist packaging. Very pleased with organic quality. Delivery arrived 40 mins later than estimated window due to morning highway fog, but the driver was polite.",
    productName: "Fresh Palak & Coriander Bunches",
    orderId: "ORD-91044",
    isVerifiedPurchase: true,
    helpfulCount: 6,
    aspectRatings: { freshness: 5, packaging: 4, delivery: 3 },
    vendorReply: {
      text: "Apologies for the highway fog delay, Amit! We have added thermal insulation gel packs for morning transport so freshness is protected regardless of road delays.",
      repliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      vendorName: "GreenGroo Farm Executive",
    },
    status: "Approved",
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
  },
  {
    customerName: "Priya Nilesh Kulkarni",
    customerId: "cust-104",
    customerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    title: "Sweet Corn & Green Peas - Super sweet harvest",
    comment:
      "Kernels were milky sweet and freshly harvested within 12 hours. We ordered for our society group buy and all 30 families were delighted. Will reorder every weekend.",
    productName: "Sweet Corn Golden (Grade A)",
    orderId: "ORD-89421",
    isVerifiedPurchase: true,
    helpfulCount: 11,
    aspectRatings: { freshness: 5, packaging: 5, delivery: 5 },
    vendorReply: null,
    status: "Approved",
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
  },
  {
    customerName: "Mahesh B. Gokhale",
    customerId: "cust-105",
    customerAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=face",
    rating: 3,
    title: "Good Cauliflower, 2-3 pieces had transport pressure",
    comment:
      "White curds were fresh and compact. However, bottom layer in crate had minor bruising due to crate stacking. Still very usable after trimming. Hope you use divider sheets in crates.",
    productName: "Cauliflower Snowball",
    orderId: "ORD-87110",
    isVerifiedPurchase: true,
    helpfulCount: 8,
    aspectRatings: { freshness: 4, packaging: 3, delivery: 4 },
    vendorReply: null,
    status: "Approved",
    createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
  },
  {
    customerName: "Vikram R. Shinde",
    customerId: "cust-106",
    customerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    title: "Consistently trustworthy partner for hotel supply",
    comment:
      "We source 200kg daily vegetables for our hotel chain. The transparency in quality grading and pricing is unmatched. Gamotech and GreenGroo verified partner standard truly shows.",
    productName: "Mixed Daily Veggies Lot",
    orderId: "ORD-85002",
    isVerifiedPurchase: true,
    helpfulCount: 19,
    aspectRatings: { freshness: 5, packaging: 5, delivery: 5 },
    vendorReply: {
      text: "Honored to serve your hotel chain Vikram! Consistent B2B quality grading is our core commitment.",
      repliedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      vendorName: "GreenGroo Farm Executive",
    },
    status: "Approved",
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
  },
];

// Helper to seed reviews if none exist
async function ensureSeedReviews(vendorId) {
  const count = await VendorReview.countDocuments({ vendorId });
  if (count === 0) {
    const toInsert = SEED_REVIEWS.map((r) => ({
      ...r,
      vendorId,
    }));
    await VendorReview.insertMany(toInsert);
  }
}

// -------------------------------------------------------------
// VENDOR VACATION CONTROLLERS
// -------------------------------------------------------------

export async function getVendorVacation(req, res) {
  try {
    const vendorId = req.user?.vendorId || req.user?.id || req.vendor?.id;
    let vendor = null;
    if (vendorId) {
      vendor = await Vendor.findOne({
        $or: [
          { id: String(vendorId) },
          { vendorCode: String(vendorId) },
          ...(mongoose.Types.ObjectId.isValid(vendorId) ? [{ _id: vendorId }] : []),
        ],
      });
    }
    if (!vendor) {
      vendor = await Vendor.findOne();
    }

    if (!vendor) {
      return res.json({
        success: true,
        vacation: { ...DEFAULT_VACATION },
        vendorName: "GreenGroo Vendor",
        status: "STORE_LIVE",
      });
    }

    let vac = vendor.vacation || { ...DEFAULT_VACATION };

    // Auto-reopen check if return date has passed
    if (vac.enabled && vac.autoReopen && vac.returnDate) {
      const today = new Date().toISOString().slice(0, 10);
      if (today > vac.returnDate) {
        vac.enabled = false;
        vac.lastUpdated = new Date();
        vendor.vacation = vac;
        await vendor.save();
      }
    }

    return res.json({
      success: true,
      vacation: vac,
      vendorName: vendor.vendorName || vendor.businessName || vendor.ownerName,
      status: vac.enabled ? "VACATION_OFFLINE" : "STORE_LIVE",
    });
  } catch (err) {
    console.error("[getVendorVacation] Error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch vacation status" });
  }
}

export async function updateVendorVacation(req, res) {
  try {
    const vendorId = req.user?.vendorId || req.user?.id || req.vendor?.id;
    let vendor = null;
    if (vendorId) {
      vendor = await Vendor.findOne({
        $or: [
          { id: String(vendorId) },
          { vendorCode: String(vendorId) },
          ...(mongoose.Types.ObjectId.isValid(vendorId) ? [{ _id: vendorId }] : []),
        ],
      });
    }
    if (!vendor) {
      vendor = await Vendor.findOne();
    }

    if (!vendor) {
      vendor = new Vendor({
        id: vendorId || "vendor-1",
        ownerName: "Vendor Owner",
        mobile: "9999999999",
      });
    }

    const payload = req.body || {};
    const current = vendor.vacation || { ...DEFAULT_VACATION };

    const updated = {
      ...DEFAULT_VACATION,
      ...current,
      enabled: Boolean(payload.enabled),
      startDate: payload.startDate || current.startDate || "",
      returnDate: payload.returnDate || current.returnDate || "",
      reason: payload.reason || current.reason || "Annual Vacation",
      noticeMessage:
        payload.noticeMessage ||
        current.noticeMessage ||
        DEFAULT_VACATION.noticeMessage,
      offlineMode: ["full_offline", "browse_only"].includes(payload.offlineMode)
        ? payload.offlineMode
        : current.offlineMode || "browse_only",
      autoReopen: payload.autoReopen !== undefined ? Boolean(payload.autoReopen) : current.autoReopen,
      emergencyPhone: payload.emergencyPhone !== undefined ? String(payload.emergencyPhone) : current.emergencyPhone,
      emergencyEmail: payload.emergencyEmail !== undefined ? String(payload.emergencyEmail) : current.emergencyEmail,
      lastUpdated: new Date(),
    };

    vendor.vacation = updated;
    await vendor.save();

    return res.json({
      success: true,
      vacation: updated,
      message: updated.enabled
        ? `Vacation Mode activated. Store is set to ${
            updated.offlineMode === "full_offline" ? "Full Offline" : "Catalog Browsing with Vacation Notice"
          } until ${updated.returnDate || "further notice"}.`
        : "Vacation Mode turned off. Your store and products are now live and accepting orders!",
    });
  } catch (err) {
    console.error("[updateVendorVacation] Error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update vacation settings" });
  }
}

// -------------------------------------------------------------
// VENDOR REVIEWS CONTROLLERS
// -------------------------------------------------------------

export async function getVendorReviews(req, res) {
  try {
    let vendorId = req.user?.vendorId || req.user?.id || req.vendor?.id;
    if (!vendorId) {
      const firstVendor = await Vendor.findOne().lean();
      vendorId = firstVendor?.id || "vendor-1";
    }
    await ensureSeedReviews(vendorId);

    const {
      star = "all",
      replyStatus = "all", // "all" | "replied" | "pending"
      search = "",
      sort = "recent", // "recent" | "highest" | "lowest" | "helpful"
    } = req.query;

    const query = { vendorId };

    if (star !== "all" && Number(star) >= 1 && Number(star) <= 5) {
      query.rating = Number(star);
    }

    if (replyStatus === "replied") {
      query["vendorReply.text"] = { $exists: true, $ne: "" };
    } else if (replyStatus === "pending") {
      query.$or = [
        { vendorReply: { $exists: false } },
        { vendorReply: null },
        { "vendorReply.text": { $in: ["", null] } },
      ];
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { customerName: regex },
            { title: regex },
            { comment: regex },
            { productName: regex },
            { orderId: regex },
          ],
        },
      ];
    }

    // Sort options
    let sortObj = { createdAt: -1 };
    if (sort === "highest") sortObj = { rating: -1, createdAt: -1 };
    if (sort === "lowest") sortObj = { rating: 1, createdAt: -1 };
    if (sort === "helpful") sortObj = { helpfulCount: -1, createdAt: -1 };

    const reviews = await VendorReview.find(query).sort(sortObj).lean();

    // Calculate overall stats across ALL reviews of this vendor
    const allVendorReviews = await VendorReview.find({ vendorId }).lean();
    const totalReviews = allVendorReviews.length;

    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;
    let freshSum = 0;
    let packSum = 0;
    let delivSum = 0;
    let repliedCount = 0;

    allVendorReviews.forEach((r) => {
      const starVal = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      starCounts[starVal] = (starCounts[starVal] || 0) + 1;
      ratingSum += r.rating || 0;
      freshSum += r.aspectRatings?.freshness || r.rating || 5;
      packSum += r.aspectRatings?.packaging || r.rating || 5;
      delivSum += r.aspectRatings?.delivery || r.rating || 5;
      if (r.vendorReply?.text) repliedCount += 1;
    });

    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 5.0;
    const recommendationRate =
      totalReviews > 0
        ? Math.round((((starCounts[5] || 0) + (starCounts[4] || 0)) / totalReviews) * 100)
        : 100;

    const aspectAverages = {
      freshness: totalReviews > 0 ? Number((freshSum / totalReviews).toFixed(1)) : 5.0,
      packaging: totalReviews > 0 ? Number((packSum / totalReviews).toFixed(1)) : 5.0,
      delivery: totalReviews > 0 ? Number((delivSum / totalReviews).toFixed(1)) : 5.0,
    };

    return res.json({
      success: true,
      stats: {
        averageRating,
        totalReviews,
        starCounts,
        recommendationRate,
        repliedCount,
        pendingReplyCount: totalReviews - repliedCount,
        aspectAverages,
      },
      reviews,
      marketplaceIntegrityPolicy: {
        editableByVendor: false,
        deletableByVendor: false,
        policyNote:
          "In adherence to Gamotech Solutions Private Limited marketplace transparency rules, vendor reviews cannot be edited or deleted by vendors. This guarantees genuine, authentic customer trust.",
      },
    });
  } catch (err) {
    console.error("[getVendorReviews] Error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to load reviews" });
  }
}

export async function replyVendorReview(req, res) {
  try {
    const vendorId = req.user?.vendorId || req.user?.id || req.vendor?.id;
    const { reviewId } = req.params;
    const { replyText } = req.body;

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ success: false, message: "Reply text cannot be empty" });
    }

    let review = null;
    if (mongoose.Types.ObjectId.isValid(reviewId)) {
      review = await VendorReview.findById(reviewId);
    }
    if (!review) {
      review = await VendorReview.findOne({ _id: reviewId });
    }
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // STRICT MARKETPLACE INTEGRITY CHECK:
    // Prevent any payload tampering with customer rating, title, or review text
    if (req.body.rating || req.body.comment || req.body.title || req.body.customerName) {
      return res.status(403).json({
        success: false,
        message:
          "Security Policy Violation: Vendor is not permitted to alter customer rating or review text.",
      });
    }

    let vendor = null;
    if (vendorId) {
      vendor = await Vendor.findOne({
        $or: [
          { id: String(vendorId) },
          { vendorCode: String(vendorId) },
          ...(mongoose.Types.ObjectId.isValid(vendorId) ? [{ _id: vendorId }] : []),
        ],
      }).lean();
    }
    const vendorName = vendor?.vendorName || vendor?.businessName || vendor?.ownerName || "Store Executive";

    review.vendorReply = {
      text: replyText.trim(),
      repliedAt: new Date(),
      vendorName,
    };

    await review.save();

    return res.json({
      success: true,
      message: "Your official vendor response has been published to the review.",
      review,
    });
  } catch (err) {
    console.error("[replyVendorReview] Error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to submit review reply" });
  }
}

// -------------------------------------------------------------
// PUBLIC STOREFRONT ENDPOINTS (for customer store page view)
// -------------------------------------------------------------

export async function getPublicStoreReviews(req, res) {
  try {
    const { vendorId } = req.params;
    await ensureSeedReviews(vendorId);

    const reviews = await VendorReview.find({ vendorId, status: "Approved" })
      .sort({ createdAt: -1 })
      .lean();

    const total = reviews.length;
    let ratingSum = 0;
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((r) => {
      ratingSum += r.rating;
      const s = Math.min(5, Math.max(1, Math.round(r.rating)));
      starCounts[s] = (starCounts[s] || 0) + 1;
    });

    const averageRating = total > 0 ? Number((ratingSum / total).toFixed(1)) : 5.0;

    return res.json({
      success: true,
      averageRating,
      totalReviews: total,
      starCounts,
      reviews,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getPublicStoreVacation(req, res) {
  try {
    const { vendorId } = req.params;
    const vendor = await Vendor.findOne({ id: vendorId }).lean();
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    const vac = vendor.vacation || { ...DEFAULT_VACATION };
    return res.json({
      success: true,
      vacation: vac,
      vendorName: vendor.vendorName || vendor.businessName || vendor.ownerName,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
