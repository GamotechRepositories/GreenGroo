import Address from "../models/address/Address.js";
import User from "../models/user.js";

const REQUIRED_FIELDS = [
  "fullName",
  "number",
  "email",
  "shopNo",
  "shopName",
  "fullAddress",
  "landmark",
  "city",
  "state",
  "pincode",
];

function normalizeAddressBody(body) {
  return {
    fullName: (body.fullName || body.name || "").trim(),
    number: String(body.number || body.phone || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    shopNo: (body.shopNo || "").trim(),
    shopName: (body.shopName || "").trim(),
    fullAddress: (body.fullAddress || body.streetArea || "").trim(),
    landmark: (body.landmark || "").trim(),
    city: (body.city || "").trim(),
    state: (body.state || "").trim(),
    pincode: String(body.pincode || "").trim(),
    isDefault: body.isDefault,
  };
}

function formatValidationError(error) {
  if (error.name === "ValidationError" && error.errors) {
    const first = Object.values(error.errors)[0];
    return first?.message || "Invalid address data";
  }
  return error.message;
}

function getMissingFields(data) {
  return REQUIRED_FIELDS.filter((field) => !data[field]);
}

async function createAddressForUser(userId, body) {
  const user = await User.findById(userId);
  if (!user) {
    return { error: { status: 404, message: "User not found" } };
  }

  const normalized = normalizeAddressBody(body);
  const { isDefault } = normalized;
  const missing = getMissingFields(normalized);

  if (missing.length > 0) {
    return { error: { status: 400, message: "All address fields are required" } };
  }

  if (isDefault) {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }

  const addressCount = await Address.countDocuments({ user: userId });
  const shouldBeDefault = isDefault || addressCount === 0;

  const address = await Address.create({
    user: userId,
    ...normalized,
    isDefault: shouldBeDefault,
  });

  await User.findByIdAndUpdate(userId, {
    $addToSet: { addresses: address._id },
  });

  return { address };
}

export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const result = await createAddressForUser(req.user._id, req.body);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: result.address,
    });
  } catch (error) {
    const message = formatValidationError(error);
    const status = error.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
};

export const getAddressesForUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const addresses = await Address.find({ user: req.params.userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAddressForUser = async (req, res) => {
  try {
    const result = await createAddressForUser(req.params.userId, req.body);
    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: result.address,
    });
  } catch (error) {
    const message = formatValidationError(error);
    const status = error.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
};

export const updateAddressForUser = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const normalized = normalizeAddressBody({ ...address.toObject(), ...req.body });
    const missing = getMissingFields(normalized);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required",
      });
    }

    const { isDefault } = req.body;
    if (isDefault) {
      await Address.updateMany(
        { user: userId, _id: { $ne: addressId } },
        { $set: { isDefault: false } }
      );
    }

    REQUIRED_FIELDS.forEach((field) => {
      address[field] = normalized[field];
    });
    if (isDefault !== undefined) address.isDefault = isDefault;

    await address.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    const message = formatValidationError(error);
    const status = error.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await Address.findOne({ _id: id, user: req.user._id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const normalized = normalizeAddressBody({ ...address.toObject(), ...req.body });
    const { isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }

    REQUIRED_FIELDS.forEach((field) => {
      address[field] = normalized[field];
    });

    if (isDefault !== undefined) address.isDefault = isDefault;

    await address.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    const message = formatValidationError(error);
    const status = error.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await Address.findOneAndDelete({ _id: id, user: req.user._id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { addresses: address._id },
    });

    if (address.isDefault) {
      const nextDefault = await Address.findOne({ user: req.user._id }).sort({
        createdAt: -1,
      });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
