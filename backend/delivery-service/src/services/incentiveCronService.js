import cron from "node-cron";
import Gig from "../models/Gig.js";
import Incentive from "../models/Incentive.js";
import DeliveryBoy from "../models/DeliveryBoy.js";
import { formatDateStringIST, timeToMinutes } from "../controllers/shiftController.js";
import { checkAndTrackIncentive } from "../controllers/incentiveController.js";

/**
 * Finalizes Incentive docs once a Gig's window has ended.
 * Locks targetBonusEarned as final, adds it into rider's DeliveryBoy.todayEarnings,
 * and marks the Incentive document as settled (settled: true).
 */
export const finalizeEndedIncentives = async () => {
  try {
    const now = new Date();
    const todayStrIST = formatDateStringIST(now);
    const todayStart = new Date(`${todayStrIST}T00:00:00.000Z`);

    const nowISTFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    const currentMinIST = timeToMinutes(nowISTFormatter.format(now));

    // Find all active Gigs for today
    const gigs = await Gig.find({
      isActive: true,
      dateString: todayStrIST,
    });

    if (!gigs || gigs.length === 0) {
      return;
    }

    // Filter Gigs whose window has ended
    const endedGigs = gigs.filter((gig) => {
      const endMin = timeToMinutes(gig.endTime);
      return currentMinIST >= endMin;
    });

    if (endedGigs.length === 0) {
      return;
    }

    // Find unsettled Incentive records for today
    const unsettledIncentives = await Incentive.find({
      date: todayStart,
      settled: false,
    });

    let settledCount = 0;

    for (const incentive of unsettledIncentives) {
      const rider = await DeliveryBoy.findById(incentive.riderId);
      if (!rider) continue;

      // Re-run checkAndTrackIncentive to get latest progress before settling
      const latestIncentive = await checkAndTrackIncentive(rider._id, incentive.storeId);
      const finalBonus = latestIncentive?.targetBonusEarned || incentive.targetBonusEarned || 0;

      if (finalBonus > 0) {
        rider.todayEarnings = (rider.todayEarnings || 0) + finalBonus;
        await rider.save().catch((err) => {
          console.error(`[IncentiveCron] Failed to update earnings for rider ${rider._id}:`, err.message);
        });
      }

      incentive.targetBonusEarned = finalBonus;
      incentive.settled = true;
      await incentive.save();
      settledCount += 1;
    }

    if (settledCount > 0) {
      console.log(`[IncentiveCron] Finalized and settled ${settledCount} incentive records for ended Gigs on ${todayStrIST}.`);
    }
  } catch (error) {
    console.error("[IncentiveCron] Error during incentive finalization:", error.message);
  }
};

/**
 * Initializes the 15-minute cron job to finalize ended Gigs and settle incentives.
 */
export const initIncentiveCron = () => {
  // Run every 15 minutes: */15 * * * *
  cron.schedule("*/15 * * * *", async () => {
    console.log("[IncentiveCron] Running 15-minute incentive settlement check...");
    await finalizeEndedIncentives();
  });
  console.log("[IncentiveCron] Incentive settlement cron job scheduled (every 15 min).");
};
