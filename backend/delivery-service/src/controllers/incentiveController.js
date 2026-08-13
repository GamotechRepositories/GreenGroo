import Incentive from "../models/Incentive.js";
import Rider from "../models/Rider.js";

/**
 * Rider (their own) or Manager (any rider in store) — Returns incentive history for a rider.
 */
export const getRiderIncentives = async (req, res) => {
  try {
    let riderId = req.query.riderId;

    if (req.user?.role !== "delivery_manager") {
      // Rider can only access their own incentive history
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
 * Manager only — Aggregates total earnings/orders across all riders in the store for a date range.
 */
export const getStoreIncentiveSummary = async (req, res) => {
  try {
    if (req.user?.role !== "delivery_manager") {
      return res.status(403).json({
        success: false,
        message: "Only delivery managers can access store incentive analytics",
      });
    }

    const storeId = req.query.storeId || req.user.id;
    const { startDate, endDate } = req.query;

    const matchQuery = { storeId };
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const summary = await Incentive.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$storeId",
          totalOrders: { $sum: "$totalOrders" },
          totalEarnings: { $sum: "$totalEarnings" },
          totalTargetBonusEarned: { $sum: "$targetBonusEarned" },
          activeRiderCount: { $addToSet: "$riderId" },
        },
      },
      {
        $project: {
          _id: 0,
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
          storeId,
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
