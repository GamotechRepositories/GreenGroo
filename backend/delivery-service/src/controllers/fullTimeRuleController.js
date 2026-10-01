import DeliveryManager from "../models/DeliveryManager.js";
import FullTimeRule from "../models/FullTimeRule.js";

/** GET /api/delivery-managers/fulltime-rules */
export const listFullTimeRules = async (req, res, next) => {
  try {
    const rules = await FullTimeRule.find({ managerId: req.user.id, isActive: true });
    return res.json({ success: true, rules });
  } catch (err) {
    next(err);
  }
};

/** POST /api/delivery-managers/fulltime-rules */
export const createFullTimeRule = async (req, res, next) => {
  try {
    const rule = await FullTimeRule.create({
      managerId: req.user.id,
      ruleName: req.body.ruleName,
      attendanceStartTime: req.body.attendanceStartTime,
      attendanceEndTime: req.body.attendanceEndTime,
      requireLocationValidation: req.body.requireLocationValidation,
      attendanceRadiusMeters: req.body.attendanceRadiusMeters,
      workingDays: req.body.workingDays,
      minimumAttendanceDays: req.body.minimumAttendanceDays,
      notes: req.body.notes,
    });
    return res.status(201).json({ success: true, rule });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/delivery-managers/fulltime-rules/:id */
export const updateFullTimeRule = async (req, res, next) => {
  try {
    const rule = await FullTimeRule.findOneAndUpdate(
      { _id: req.params.id, managerId: req.user.id },
      {
        $set: {
          ruleName: req.body.ruleName,
          attendanceStartTime: req.body.attendanceStartTime,
          attendanceEndTime: req.body.attendanceEndTime,
          requireLocationValidation: req.body.requireLocationValidation,
          attendanceRadiusMeters: req.body.attendanceRadiusMeters,
          workingDays: req.body.workingDays,
          minimumAttendanceDays: req.body.minimumAttendanceDays,
          notes: req.body.notes,
        },
      },
      { new: true }
    );
    if (!rule) return res.status(404).json({ success: false, message: "Rule not found" });
    return res.json({ success: true, rule });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/delivery-managers/fulltime-rules/:id */
export const deleteFullTimeRule = async (req, res, next) => {
  try {
    await FullTimeRule.findOneAndUpdate(
      { _id: req.params.id, managerId: req.user.id },
      { $set: { isActive: false } }
    );
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/** GET /api/delivery-managers/fulltime-config */
export const getFullTimeConfig = async (req, res, next) => {
  try {
    const manager = await DeliveryManager.findById(req.user.id);
    if (!manager) return res.status(404).json({ success: false, message: "Manager not found" });
    return res.json({
      success: true,
      fullTimeMonthlySalary: manager.fullTimeMonthlySalary || 0,
    });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/delivery-managers/fulltime-config */
export const setFullTimeConfig = async (req, res, next) => {
  try {
    const salary = Number(req.body.fullTimeMonthlySalary);
    if (isNaN(salary) || salary < 0) {
      return res.status(400).json({ success: false, message: "Invalid salary amount" });
    }
    const manager = await DeliveryManager.findByIdAndUpdate(
      req.user.id,
      { $set: { fullTimeMonthlySalary: salary } },
      { new: true }
    );
    if (!manager) return res.status(404).json({ success: false, message: "Manager not found" });
    return res.json({
      success: true,
      fullTimeMonthlySalary: manager.fullTimeMonthlySalary,
      message: "Monthly salary updated successfully",
    });
  } catch (err) {
    next(err);
  }
};
