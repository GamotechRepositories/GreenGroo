import Shift from "../models/Shift.js";
import StoreOrder from "../models/StoreOrder.js";
import {
  istDateString,
  istDayRange,
  listRecentIstDates,
  listIstDatesInMonth,
  liveOnlineMinutes,
  formatOnlineMinutes,
} from "../utils/onlineHoursHelper.js";

function dayLabelFor(dateString) {
  const { start } = istDayRange(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  }).format(start);
}

/**
 * Build day-wise (or month for year) activity for a delivery partner.
 * Includes online time, earnings, trips, shift bookings + time slots.
 */
export async function buildRiderActivityHistory(rider, range = "week") {
  const normalized = String(range || "week").trim().toLowerCase();
  const todayStr = istDateString();
  const activityMap = new Map(
    (rider.dailyActivity || []).map((row) => [row.date, row])
  );

  const riderIdStr = rider._id.toString();
  const riderPhone = (rider.phone || "").trim();

  const buildDayRows = async (dateList) => {
    if (!dateList.length) {
      return {
        days: [],
        totals: {
          earnings: 0,
          onlineMinutes: 0,
          onlineTime: formatOnlineMinutes(0),
          shiftsBooked: 0,
          shiftsCompleted: 0,
          trips: 0,
          total: 0,
        },
      };
    }

    const shifts = await Shift.find({
      dateString: { $in: dateList },
      $or: [
        { "slots.bookings.deliveryPartnerId": rider._id },
        { "slots.bookings.deliveryPartnerPhone": riderPhone },
      ],
    }).lean();

    const shiftStatsByDate = {};
    const shiftSlotsByDate = {};
    for (const date of dateList) {
      shiftStatsByDate[date] = { booked: 0, completed: 0 };
      shiftSlotsByDate[date] = [];
    }

    for (const shift of shifts) {
      const date = shift.dateString;
      if (!shiftStatsByDate[date]) continue;
      for (const slot of shift.slots || []) {
        for (const booking of slot.bookings || []) {
          const bRiderId = booking.deliveryPartnerId
            ? booking.deliveryPartnerId.toString()
            : "";
          const bPhone = (booking.deliveryPartnerPhone || "").trim();
          const match =
            bRiderId === riderIdStr || (riderPhone && bPhone === riderPhone);
          if (!match) continue;
          if (booking.status !== "CANCELLED") shiftStatsByDate[date].booked += 1;
          if (booking.status === "COMPLETED") shiftStatsByDate[date].completed += 1;
          shiftSlotsByDate[date].push({
            shiftId: shift._id?.toString?.() || String(shift._id),
            shiftName: shift.name || "Shift",
            shiftType: shift.type || "",
            startTime: slot.startTime,
            endTime: slot.endTime,
            bookingStatus: booking.status || "UPCOMING",
            bookedAt: booking.bookedAt || null,
            onlineAt: booking.onlineAt || null,
            completedAt: booking.completedAt || null,
          });
        }
      }
    }

    const rangeStart = istDayRange(dateList[0]).start;
    const rangeEnd = istDayRange(dateList[dateList.length - 1]).end;
    const allOrders = await StoreOrder.find({
      assignedRiderId: rider._id,
      status: "delivered",
      deliveredAt: { $gte: rangeStart, $lte: rangeEnd },
    }).select("riderDeliveryEarning deliveredAt");

    const orderStatsByDate = {};
    for (const date of dateList) {
      orderStatsByDate[date] = { earnings: 0, trips: 0 };
    }
    for (const order of allOrders) {
      const d = istDateString(order.deliveredAt);
      if (!orderStatsByDate[d]) continue;
      orderStatsByDate[d].trips += 1;
      orderStatsByDate[d].earnings += Number(order.riderDeliveryEarning || 0);
    }

    const rows = [];
    let totalEarnings = 0;
    let totalTrips = 0;
    let totalOnline = 0;
    let totalShiftsBooked = 0;
    let totalShiftsCompleted = 0;

    for (const date of dateList) {
      const snap = activityMap.get(date);
      let earnings = orderStatsByDate[date].earnings;
      let trips = orderStatsByDate[date].trips;
      let onlineMinutes = Number(snap?.onlineMinutes || 0);
      let shiftsBooked = shiftStatsByDate[date].booked;
      let shiftsCompleted = shiftStatsByDate[date].completed;

      if (snap) {
        if (earnings <= 0 && snap.earnings > 0) earnings = Number(snap.earnings);
        if (trips <= 0 && snap.trips > 0) trips = Number(snap.trips);
        shiftsBooked = Math.max(shiftsBooked, Number(snap.shiftsBooked || 0));
        shiftsCompleted = Math.max(
          shiftsCompleted,
          Number(snap.shiftsCompleted || 0)
        );
      }

      if (date === todayStr) {
        onlineMinutes = Math.max(onlineMinutes, liveOnlineMinutes(rider));
      }

      totalEarnings += earnings;
      totalTrips += trips;
      totalOnline += onlineMinutes;
      totalShiftsBooked += shiftsBooked;
      totalShiftsCompleted += shiftsCompleted;

      rows.push({
        date,
        dayLabel: dayLabelFor(date),
        isToday: date === todayStr,
        earnings,
        walletEarned: earnings,
        onlineMinutes,
        onlineTime: formatOnlineMinutes(onlineMinutes),
        shiftsBooked,
        shiftsCompleted,
        trips,
        total: earnings,
        shifts: shiftSlotsByDate[date] || [],
      });
    }

    return {
      days: [...rows].reverse(), // newest first
      totals: {
        earnings: totalEarnings,
        onlineMinutes: totalOnline,
        onlineTime: formatOnlineMinutes(totalOnline),
        shiftsBooked: totalShiftsBooked,
        shiftsCompleted: totalShiftsCompleted,
        trips: totalTrips,
        total: totalEarnings,
      },
    };
  };

  if (normalized === "year") {
    const months = [];
    let totalEarnings = 0;
    let totalTrips = 0;
    let totalOnline = 0;
    let totalShiftsBooked = 0;
    let totalShiftsCompleted = 0;

    const nowParts = todayStr.split("-").map(Number);
    let y = nowParts[0];
    let m = nowParts[1];

    for (let i = 0; i < 12; i++) {
      const monthDates = listIstDatesInMonth(y, m).filter((d) => d <= todayStr);
      const { days, totals } = await buildDayRows(monthDates);
      const label = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
        year: "numeric",
      }).format(istDayRange(monthDates[0] || todayStr).start);

      months.push({
        date: `${y}-${String(m).padStart(2, "0")}`,
        dayLabel: label,
        isToday: y === nowParts[0] && m === nowParts[1],
        earnings: totals.earnings,
        walletEarned: totals.earnings,
        onlineMinutes: totals.onlineMinutes,
        onlineTime: totals.onlineTime,
        shiftsBooked: totals.shiftsBooked,
        shiftsCompleted: totals.shiftsCompleted,
        trips: totals.trips,
        total: totals.total,
        dayCount: days.length,
        days, // nested day breakdown for the month
      });

      totalEarnings += totals.earnings;
      totalTrips += totals.trips;
      totalOnline += totals.onlineMinutes;
      totalShiftsBooked += totals.shiftsBooked;
      totalShiftsCompleted += totals.shiftsCompleted;

      m -= 1;
      if (m < 1) {
        m = 12;
        y -= 1;
      }
    }

    return {
      range: "year",
      granularity: "month",
      days: months,
      totals: {
        earnings: totalEarnings,
        onlineMinutes: totalOnline,
        onlineTime: formatOnlineMinutes(totalOnline),
        shiftsBooked: totalShiftsBooked,
        shiftsCompleted: totalShiftsCompleted,
        trips: totalTrips,
        total: totalEarnings,
      },
    };
  }

  const dayCount = normalized === "month" ? 30 : 7;
  const dateList = listRecentIstDates(dayCount).filter((d) => d <= todayStr);
  const { days, totals } = await buildDayRows(dateList);

  return {
    range: normalized === "month" ? "month" : "week",
    granularity: "day",
    days,
    totals,
  };
}
