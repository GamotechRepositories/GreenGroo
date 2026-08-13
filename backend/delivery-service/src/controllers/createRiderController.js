import DeliveryBoy from "../models/DeliveryBoy.js";
import DeliveryManager from "../models/DeliveryManager.js";

const normalizePhone = (phone) =>
  String(phone || "").replace(/\D/g, "").slice(-10);

export const createDeliveryBoyByManager = async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || "");
    const name = String(req.body.name || "").trim();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existing = await DeliveryBoy.findOne({ phone });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Delivery boy already registered with this phone number",
      });
    }

    const manager = await DeliveryManager.findById(req.user.id);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Delivery manager not found",
      });
    }

    const deliveryBoy = await DeliveryBoy.create({
      phone,
      password,
      name,
      city: manager.city,
      cityId: manager.cityId,
      area: manager.area,
      verificationStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Delivery boy account created — pending verification",
      deliveryBoy: deliveryBoy.toSafeJSON(),
    });
  } catch (error) {
    next(error);
  }
};
