import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Admin from "../models/admin.js";
import Order from "../models/order/Order.js";
import { buildPaginatedResponse, getPaginationParams } from "../utils/pagination.js";
import { escapeRegex } from "../utils/adminSearch.js";
import {
  normalizeIndianPhone,
  sendLoginOtp as dispatchLoginOtp,
  verifyLoginOtp as validateLoginOtp,
  markPhoneOtpVerified,
  consumeVerifiedPhone,
} from "../utils/msg91.js";

const signToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured on the server");
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const formatAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  shopNo: user.shopNo || "",
  shopName: user.shopName || "",
  shopAddress: user.shopAddress || "",
  gstNumber: user.gstNumber || "",
  role: user.role,
  rewardPoints: user.rewardPoints || 0,
});

function pickSignupProfileFields(body) {
  const fields = {};
  if (body.shopName?.trim()) fields.shopName = body.shopName.trim();
  if (body.shopAddress?.trim()) fields.shopAddress = body.shopAddress.trim();
  if (body.shopNo?.trim()) fields.shopNo = body.shopNo.trim();
  if (body.gstNumber?.trim()) fields.gstNumber = body.gstNumber.trim().toUpperCase();
  return fields;
}

function validateSignupProfile(body) {
  const shopName = body.shopName?.trim() || "";
  const shopAddress = body.shopAddress?.trim() || "";
  const gstNumber = body.gstNumber?.trim() || "";

  // Shop fields are optional for customer signup
  if (shopName && shopName.length < 2) {
    return "Shop name must be at least 2 characters";
  }
  if (shopAddress && shopAddress.length < 5) {
    return "Please enter a complete shop address";
  }
  if (gstNumber && !GST_PATTERN.test(gstNumber.toUpperCase())) {
    return "Please provide a valid GST number";
  }
  return null;
}

export const signup = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);
    const { name, password, role = "user" } = req.body;
    const profileFields = pickSignupProfileFields(req.body);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone must be 10 digits starting with 6, 7, 8, or 9",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const Model = role === "vendor" ? Vendor : role === "admin" ? Admin : User;

    const existingPhoneUser = await Model.findOne({ phone });
    if (existingPhoneUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this phone number already exists. Please sign in instead.",
      });
    }

    const user = await Model.create({
      name: name.trim(),
      phone,
      email: req.body.email?.trim().toLowerCase() || undefined,
      password: String(password).trim(),
      role,
      ...profileFields,
    });

    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      data: {
        user: formatAuthUser(user),
        token,
      },
    });
  } catch (error) {
    return respondWithControllerError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const normalizedPhone = phone ? normalizeIndianPhone(phone) : null;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedPhone && !normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Phone number or email is required",
      });
    }

    if (normalizedPhone && normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Please sign in with either phone or email, not both",
      });
    }

    if (normalizedPhone) {
      return loginWithPhoneCredentials(req, res, normalizedPhone, password);
    }

    let user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) user = await Admin.findOne({ email: normalizedEmail }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: formatAuthUser(user),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginWithPhone = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const normalizedPhone = normalizeIndianPhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone must be 10 digits starting with 6, 7, 8, or 9",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    return loginWithPhoneCredentials(req, res, normalizedPhone, password);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function loginWithPhoneCredentials(_req, res, phone, password) {
  let user = await User.findOne({ phone }).select("+password");
  if (!user) user = await Admin.findOne({ phone }).select("+password");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid phone number or password",
    });
  }

  if (!user.password) {
    return res.status(401).json({
      success: false,
      message: "No password set for this account. Please sign up again or reset your password.",
    });
  }

  if (!(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Invalid phone number or password",
    });
  }

  const token = signToken(user._id);

  return res.status(200).json({
    success: true,
    data: {
      user: formatAuthUser(user),
      token,
    },
  });
}

export const sendOtpLogin = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);
    const purpose = String(req.body.purpose || req.body.mode || "login")
      .trim()
      .toLowerCase();

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone must be 10 digits starting with 6, 7, 8, or 9",
      });
    }

    const user = await User.findOne({ phone });

    if (purpose === "signup") {
      if (user && user.role !== "admin") {
        return res.status(400).json({
          success: false,
          message:
            "An account with this phone number already exists. Please sign in instead.",
        });
      }
    } else {
      // Login (and any other purpose): only send OTP for existing customers.
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account found with this number. Please sign up first.",
        });
      }
      if (user.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Please use the admin panel to sign in.",
        });
      }
    }

    const result = await dispatchLoginOtp(phone);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { phone },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
};

function respondWithControllerError(res, error) {
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((err) => err.message)
      .join(", ");
    return res.status(400).json({ success: false, message });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    if (field === "phone") {
      return res.status(400).json({
        success: false,
        message: "An account with this phone number already exists. Try logging in instead.",
      });
    }
    if (field === "email") {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
    return res.status(400).json({
      success: false,
      message: "An account with these details already exists.",
    });
  }

  return res.status(500).json({ success: false, message: error.message });
}

export const verifyOtpLogin = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);
    const { otp } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone must be 10 digits starting with 6, 7, 8, or 9",
      });
    }

    const verification = await validateLoginOtp(phone, otp);
    if (!verification.ok) {
      return res.status(400).json({
        success: false,
        message: verification.message,
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      markPhoneOtpVerified(phone);
      return res.status(200).json({
        success: true,
        data: {
          needsSignup: true,
          phone,
        },
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Please use the admin panel to sign in.",
      });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: formatAuthUser(user),
        token,
      },
    });
  } catch (error) {
    respondWithControllerError(res, error);
  }
};

export const completeOtpSignup = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);
    const { name } = req.body;
    const optionalSignupFields = pickSignupProfileFields(req.body);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone must be 10 digits starting with 6, 7, 8, or 9",
      });
    }

    if (!consumeVerifiedPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "OTP verification expired. Please verify your phone again.",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const profileError = validateSignupProfile(req.body);
    if (profileError) {
      return res.status(400).json({
        success: false,
        message: profileError,
      });
    }

    const existingPhoneUser = await User.findOne({ phone });
    if (existingPhoneUser) {
      const token = signToken(existingPhoneUser._id);
      return res.status(200).json({
        success: true,
        data: {
          user: formatAuthUser(existingPhoneUser),
          token,
        },
      });
    }

    const user = await User.create({
      name: name.trim(),
      phone,
      role: "user",
      ...optionalSignupFields,
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: formatAuthUser(user),
        token,
      },
    });
  } catch (error) {
    respondWithControllerError(res, error);
  }
};

export const resetPasswordWithPhoneOtp = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);
    const otp = String(req.body.otp || "").trim();
    const newPassword = String(req.body.newPassword || "").trim();

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone must be 10 digits starting with 6, 7, 8, or 9",
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this phone number",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Please use the admin panel to reset your password.",
      });
    }

    const verification = await validateLoginOtp(phone, otp);
    if (!verification.ok) {
      return res.status(400).json({
        success: false,
        message: verification.message,
      });
    }

    user.password = newPassword;
    await user.save();

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: "Password set successfully",
      data: {
        user: formatAuthUser(user),
        token,
      },
    });
  } catch (error) {
    respondWithControllerError(res, error);
  }
};

export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        shopNo: req.user.shopNo || "",
        shopName: req.user.shopName || "",
        shopAddress: req.user.shopAddress || "",
        gstNumber: req.user.gstNumber || "",
        role: req.user.role,
        rewardPoints: req.user.rewardPoints || 0,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, otp } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      const verification = await verifyAdminSecurityOtp(user, otp);
      if (!verification.ok) {
        return res.status(400).json({
          success: false,
          message: verification.message || "Invalid OTP",
        });
      }
    } else {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
      }

      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: "Password change is not available for OTP sign-in accounts",
        });
      }

      const isCurrentValid = await user.comparePassword(currentPassword);
      if (!isCurrentValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

function maskPhoneNumber(phone) {
  const digits = String(phone || "");
  if (digits.length < 4) return "your registered phone";
  return `******${digits.slice(-4)}`;
}

async function verifyAdminSecurityOtp(user, otp) {
  const code = String(otp || "").trim();
  if (!code) {
    return { ok: false, message: "OTP is required to confirm this change" };
  }

  if (!user?.phone) {
    return { ok: false, message: "No registered phone number found for this admin account" };
  }

  return validateLoginOtp(user.phone, code);
}

export const sendAdminSecurityOtp = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin accounts can request security OTP",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user?.phone) {
      return res.status(400).json({
        success: false,
        message: "No registered phone number found for this admin account",
      });
    }

    await dispatchLoginOtp(user.phone);

    res.status(200).json({
      success: true,
      message: `OTP sent to ${maskPhoneNumber(user.phone)}`,
      data: {
        phoneHint: maskPhoneNumber(user.phone),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
};

export const requestAdminPasswordReset = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email, role: "admin" });

    if (!user?.phone) {
      return res.status(200).json({
        success: true,
        message:
          "If an admin account exists for this email, an OTP will be sent to the registered phone number.",
      });
    }

    await dispatchLoginOtp(user.phone);

    res.status(200).json({
      success: true,
      message: `OTP sent to ${maskPhoneNumber(user.phone)}`,
      data: {
        email,
        phoneHint: maskPhoneNumber(user.phone),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
};

export const resetAdminPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const newPassword = String(req.body.newPassword || "");

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findOne({ email, role: "admin" }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset request",
      });
    }

    const verification = await validateLoginOtp(user.phone, otp);
    if (!verification.ok) {
      return res.status(400).json({
        success: false,
        message: verification.message || "Invalid OTP",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can sign in with your new password.",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, email, phone, otp } = req.body;
    const updates = {};

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, message: "Name is required" });
      }
      updates.name = String(name).trim();
    }

    if (email !== undefined) {
      const trimmedEmail = String(email).trim();
      if (trimmedEmail) {
        updates.email = trimmedEmail.toLowerCase();
      } else {
        updates.email = undefined;
      }
    }

    if (phone !== undefined) {
      if (!String(phone).trim()) {
        return res.status(400).json({ success: false, message: "Phone is required" });
      }
      updates.phone = String(phone).trim();
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "No profile fields to update",
      });
    }

    const emailChanging =
      updates.email !== undefined &&
      String(updates.email || "").toLowerCase() !== String(user.email || "").toLowerCase();
    const phoneChanging =
      updates.phone !== undefined && String(updates.phone) !== String(user.phone || "");

    if (user.role === "admin" && (emailChanging || phoneChanging)) {
      const verification = await verifyAdminSecurityOtp(user, otp);
      if (!verification.ok) {
        return res.status(400).json({
          success: false,
          message: verification.message || "Invalid OTP",
        });
      }
    }

    const conflictFilters = [];
    if (updates.email) conflictFilters.push({ email: updates.email });
    if (updates.phone) conflictFilters.push({ phone: updates.phone });

    if (conflictFilters.length) {
      const existingUser = await User.findOne({
        _id: { $ne: req.user._id },
        $or: conflictFilters,
      });

      if (existingUser) {
        const field = existingUser.email === updates.email ? "Email" : "Phone";
        return res.status(409).json({
          success: false,
          message: `${field} is already registered`,
        });
      }
    }

    if (updates.name) user.name = updates.name;
    if (updates.phone) user.phone = updates.phone;
    if (email !== undefined) {
      user.email = updates.email;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        shopNo: user.shopNo || "",
        shopName: user.shopName || "",
        shopAddress: user.shopAddress || "",
        gstNumber: user.gstNumber || "",
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    const conflictFilters = [{ phone: phone.trim() }];
    if (email?.trim()) {
      conflictFilters.push({ email: email.trim().toLowerCase() });
    }

    const existingUser = await User.findOne({ $or: conflictFilters });

    if (existingUser) {
      const field = existingUser.phone === phone.trim() ? "Phone" : "Email";
      return res.status(409).json({
        success: false,
        message: `${field} is already registered`,
      });
    }

    const user = await User.create({
      name: name.trim(),
      ...(email?.trim() ? { email: email.trim().toLowerCase() } : {}),
      phone: phone.trim(),
      ...(password ? { password } : {}),
      role: "user",
    });

    res.status(201).json({
      success: true,
      message: "User created",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = { role: { $ne: "admin" } };

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const name = typeof req.query.name === "string" ? req.query.name.trim() : "";
    const phone = typeof req.query.phone === "string" ? req.query.phone.trim() : "";

    if (search) {
      const pattern = { $regex: escapeRegex(search), $options: "i" };
      filter.$or = [
        { name: pattern },
        { phone: pattern },
        { email: pattern },
        { shopName: pattern },
      ];
    } else {
      if (name) {
        filter.name = { $regex: escapeRegex(name), $options: "i" };
      }

      if (phone) {
        filter.phone = { $regex: escapeRegex(phone), $options: "i" };
      }
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    res.status(200).json(buildPaginatedResponse(users, total, page, limit));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserOrderStats = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("_id name role");
    if (!user || user.role === "admin") {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [stats] = await Order.aggregate([
      {
        $match: {
          user: user._id,
          status: { $ne: "attempted" },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$total", 0] } },
        },
      },
    ]);

    const totalOrders = stats?.totalOrders || 0;
    const totalRevenue = Number(stats?.totalRevenue) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        customerName: user.name,
        totalOrders,
        totalRevenue,
        averageOrderValue,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load customer history",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (email?.trim()) {
      const existing = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: user._id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered",
        });
      }
      user.email = email.trim();
    }

    if (phone?.trim()) {
      const existing = await User.findOne({
        phone: phone.trim(),
        _id: { $ne: user._id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Phone is already registered",
        });
      }
      user.phone = phone.trim();
    }

    if (name?.trim()) user.name = name.trim();
    if (password) user.password = password;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export async function seedDefaultAdminIfEmpty() {
  try {
    const adminEmails = ["admin@greengrocc.com", "admin@greengrocc.in"];
    for (const email of adminEmails) {
      let existing = await User.findOne({ email: email.toLowerCase() });
      if (!existing) {
        existing = await Admin.findOne({ email: email.toLowerCase() });
      }
      if (!existing) {
        await User.create({
          name: "Super Admin",
          email: email.toLowerCase(),
          phone: email.includes(".com") ? "9876543210" : "9876543211",
          password: "admin123",
          role: "admin",
        });
        console.log(`Seeded default admin account (${email})`);
      }
    }
  } catch (error) {
    console.error("Failed to seed default admin:", error.message);
  }
}

