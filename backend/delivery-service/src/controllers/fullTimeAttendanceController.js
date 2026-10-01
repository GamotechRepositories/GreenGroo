import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";
import FullTimeRule from "../models/FullTimeRule.js";
import FullTimeAttendance from "../models/FullTimeAttendance.js";
import { haversineKm } from "../services/darkStoreResolver.js";

function istDateString() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/** POST /api/delivery-boys/attendance/mark */
export const markFullTimeAttendance = async (req, res, next) => {
  try {
    const rider = await DeliveryBoy.findById(req.user.id);
    if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });

    if (rider.employmentType !== 'FULL_TIME') {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for Full-Time drivers",
      });
    }

    const today = istDateString();
    const rule = rider.managerId
      ? await FullTimeRule.findOne({ managerId: rider.managerId, isActive: true })
      : null;

    let distanceFromStoreMeters = null;
    let validationPassed = true;

    if (rule?.requireLocationValidation && rider.managerId) {
      const manager = await DeliveryManager.findById(rider.managerId);
      const lat = parseFloat(req.body.lat ?? req.body.latitude);
      const lng = parseFloat(req.body.lng ?? req.body.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          message: "GPS coordinates required for attendance (lat, lng)",
        });
      }

      if (manager?.latitude != null && manager?.longitude != null) {
        distanceFromStoreMeters = haversineKm(lat, lng, manager.latitude, manager.longitude) * 1000;
        const allowedRadius = rule.attendanceRadiusMeters || 200;
        validationPassed = distanceFromStoreMeters <= allowedRadius;

        if (!validationPassed) {
          return res.status(400).json({
            success: false,
            code: "OUT_OF_ATTENDANCE_RADIUS",
            message: `You are ${Math.round(distanceFromStoreMeters)}m from the dark store. Must be within ${allowedRadius}m to mark attendance.`,
            distanceFromStoreMeters,
            allowedRadius,
          });
        }
      }
    }

    const lat = parseFloat(req.body.lat ?? req.body.latitude);
    const lng = parseFloat(req.body.lng ?? req.body.longitude);

    const attendance = await FullTimeAttendance.findOneAndUpdate(
      { deliveryBoyId: rider._id, date: today },
      {
        $set: {
          managerId: rider.managerId,
          status: "present",
          markedAt: new Date(),
          locationLat: !isNaN(lat) ? lat : null,
          locationLng: !isNaN(lng) ? lng : null,
          distanceFromStoreMeters,
          validationPassed,
        },
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: "Attendance marked successfully",
      attendance: {
        date: attendance.date,
        status: attendance.status,
        markedAt: attendance.markedAt,
        distanceFromStoreMeters: attendance.distanceFromStoreMeters,
        validationPassed: attendance.validationPassed,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/delivery-boys/attendance/fulltime-today */
export const getFullTimeAttendanceToday = async (req, res, next) => {
  try {
    const rider = await DeliveryBoy.findById(req.user.id);
    if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });

    const today = istDateString();
    const [attendance, rule, manager] = await Promise.all([
      FullTimeAttendance.findOne({ deliveryBoyId: rider._id, date: today }),
      rider.managerId ? FullTimeRule.findOne({ managerId: rider.managerId, isActive: true }) : null,
      rider.managerId ? DeliveryManager.findById(rider.managerId) : null,
    ]);

    return res.json({
      success: true,
      today,
      attendance: attendance
        ? {
            date: attendance.date,
            status: attendance.status,
            markedAt: attendance.markedAt,
            distanceFromStoreMeters: attendance.distanceFromStoreMeters,
            validationPassed: attendance.validationPassed,
          }
        : { date: today, status: "pending", markedAt: null },
      rule: rule
        ? {
            ruleName: rule.ruleName,
            attendanceStartTime: rule.attendanceStartTime,
            attendanceEndTime: rule.attendanceEndTime,
            requireLocationValidation: rule.requireLocationValidation,
            attendanceRadiusMeters: rule.attendanceRadiusMeters,
            workingDays: rule.workingDays,
            minimumAttendanceDays: rule.minimumAttendanceDays,
          }
        : null,
      darkStore: manager
        ? {
            name: manager.storeName || `${manager.area} Dark Store`,
            latitude: manager.latitude,
            longitude: manager.longitude,
            monthlySalary: manager.fullTimeMonthlySalary || 0,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/delivery-boys/fulltime-rules */
export const getFullTimeRulesForRider = async (req, res, next) => {
  try {
    const rider = await DeliveryBoy.findById(req.user.id);
    if (!rider) return res.status(404).json({ success: false, message: "Rider not found" });

    const [rules, manager] = await Promise.all([
      rider.managerId ? FullTimeRule.find({ managerId: rider.managerId, isActive: true }) : [],
      rider.managerId ? DeliveryManager.findById(rider.managerId) : null,
    ]);

    return res.json({
      success: true,
      rules,
      monthlySalary: manager?.fullTimeMonthlySalary || 0,
      darkStoreName: manager ? manager.storeName || `${manager.area} Dark Store` : "",
    });
  } catch (err) {
    next(err);
  }
};
