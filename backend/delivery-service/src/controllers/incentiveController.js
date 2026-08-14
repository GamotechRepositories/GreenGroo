import Incentive from "../models/Incentive.js";

/**
 * Internal helper function (not a route endpoint):
 * Upserts today's Incentive record for a rider upon order completion (delivered).
 */
export async function upsertDailyIncentive({
  riderId,
  managerId,
  orderEarnings = 0,
  peakBonus = 0,
  todayOrderCount = 1,
}) {
  try {
    if (!riderId || !managerId) {
      console.warn("[upsertDailyIncentive] Missing riderId or managerId");
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Target bonus check e.g. 20 orders completed in a day gives bonus
    const targetBonus = todayOrderCount >= 20 ? 100 : 0;

    const incentive = await Incentive.findOneAndUpdate(
      { riderId, date: today },
      {
        $setOnInsert: { managerId, storeId: managerId, date: today },
        $inc: {
          totalOrders: 1,
          totalEarnings: orderEarnings,
          targetBonusEarned: peakBonus + targetBonus,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return incentive;
  } catch (error) {
    console.error("[upsertDailyIncentive] Error:", error.message);
    return null;
  }
}

/**
 * Rider (their own data) or Manager (any rider under their managerId).
 * Returns incentive history, optionally filtered by date range.
 */
export const getRiderIncentives = async (req, res) => {
  try {
    let riderId = req.query.riderId;

    if (req.user?.role !== "delivery_manager") {
      riderId = req.user.id;
    } else if (!riderId) {
      return res.status(400).json({
        success: false,
        message: "riderId query parameter is required for managers",
      });
    }

    const { startDate, endDate } = req.query;

    const filter = { riderId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Security check for manager: rider must belong to managerId store if queried by manager
    if (req.user?.role === "delivery_manager") {
      filter.$or = [{ managerId: req.user.id }, { storeId: req.user.id }];
    }

    const incentives = await Incentive.find(filter).sort({ date: -1 });

    res.json({
      success: true,
      data: incentives,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch rider incentives",
    });
  }
};

/**
 * Manager only — Aggregates total earnings/orders across all riders under their managerId.
 */
export const getStoreIncentiveSummary = async (req, res) => {
  try {
    if (req.user?.role !== "delivery_manager") {
      return res.status(403).json({
        success: false,
        message: "Only delivery managers can access store incentive analytics",
      });
    }

    const managerId = req.query.managerId || req.query.storeId || req.user.id;

    // Ownership check: Manager can only access their own store summary
    if (managerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to another store's analytics",
      });
    }

    const { startDate, endDate } = req.query;

    const matchQuery = {
      $or: [{ managerId }, { storeId: managerId }],
    };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const summary = await Incentive.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$managerId",
          totalOrders: { $sum: "$totalOrders" },
          totalEarnings: { $sum: "$totalEarnings" },
          totalTargetBonusEarned: { $sum: "$targetBonusEarned" },
          activeRiderCount: { $addToSet: "$riderId" },
        },
      },
      {
        $project: {
          _id: 0,
          managerId: "$_id",
          storeId: "$_id",
          totalOrders: 1,
          totalEarnings: 1,
          totalTargetBonusEarned: 1,
          totalRidersWithEarnings: { $size: "$activeRiderCount" },
        },
      },
    ]);

    const perRiderBreakdown = await Incentive.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$riderId",
          totalOrders: { $sum: "$totalOrders" },
          totalEarnings: { $sum: "$totalEarnings" },
          targetBonusEarned: { $sum: "$targetBonusEarned" },
        },
      },
      {
        $lookup: {
          from: "deliveryboys",
          localField: "_id",
          foreignField: "_id",
          as: "riderDetails",
        },
      },
      {
        $unwind: { path: "$riderDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          riderId: "$_id",
          _id: 0,
          riderName: "$riderDetails.name",
          riderPhone: "$riderDetails.phone",
          totalOrders: 1,
          totalEarnings: 1,
          targetBonusEarned: 1,
        },
      },
      { $sort: { totalEarnings: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: summary[0] || {
          managerId,
          storeId: managerId,
          totalOrders: 0,
          totalEarnings: 0,
          totalTargetBonusEarned: 0,
          totalRidersWithEarnings: 0,
        },
        perRiderBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch store incentive summary",
    });
  }
};
