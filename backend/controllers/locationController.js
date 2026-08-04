import {
  lookupPincode,
  searchCities,
  searchPincodes,
  searchStates,
} from "../services/indiaLocationService.js";

export const getStates = async (req, res) => {
  try {
    const q = req.query.q || "";
    const data = searchStates(q);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCities = async (req, res) => {
  try {
    const state = req.query.state || "";
    const q = req.query.q || "";

    if (!state.trim()) {
      return res.status(400).json({
        success: false,
        message: "State is required",
      });
    }

    const data = searchCities(state, q);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPincodes = async (req, res) => {
  try {
    const state = req.query.state || "";
    const city = req.query.city || "";
    const q = req.query.q || "";
    const limit = req.query.limit;

    if (!state.trim() || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: "State and city are required",
      });
    }

    const data = searchPincodes(state, city, q, limit);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPincodeDetails = async (req, res) => {
  try {
    const result = lookupPincode(req.params.pincode);
    if (result.error) {
      return res.status(404).json({ success: false, message: result.error });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
