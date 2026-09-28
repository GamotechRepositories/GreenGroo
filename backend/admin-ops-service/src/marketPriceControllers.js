import { MarketPrice } from "./models.js";
import { getIO } from "../../shared/socket.js";

function getIsoDateOffset(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

function safeEmit(fn) {
  try {
    const io = getIO();
    if (io) fn(io);
  } catch (_) {}
}

export async function listMarketPrices(req, res, next) {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") {
      filter.isActive = req.query.status === "active";
    }
    if (req.query.marketName && req.query.marketName !== "all") {
      filter.marketName = String(req.query.marketName);
    }
    if (req.query.productName && req.query.productName !== "all") {
      filter.productName = String(req.query.productName);
    }
    
    // Date Filters
    const queryDate = req.query.priceDate || req.query.date;
    if (queryDate && queryDate !== "all") {
      filter.priceDate = String(queryDate).slice(0, 10);
    } else if (req.query.startDate && req.query.endDate) {
      filter.priceDate = {
        $gte: String(req.query.startDate).slice(0, 10),
        $lte: String(req.query.endDate).slice(0, 10),
      };
    }

    const rows = await MarketPrice.find(filter).sort({ priceDate: -1, updatedAt: -1 }).lean();

    const allRecords = await MarketPrice.find().lean();
    const uniqueMarkets = new Set(allRecords.map((r) => r.marketName).filter(Boolean));
    const uniqueProducts = new Set(allRecords.map((r) => r.productName).filter(Boolean));
    const uniqueDates = new Set(allRecords.map((r) => r.priceDate).filter(Boolean));
    const todayStr = getIsoDateOffset(0);
    const todayCount = allRecords.filter((r) => r.priceDate === todayStr).length;

    res.json({
      success: true,
      data: rows,
      stats: {
        total: allRecords.length,
        active: allRecords.filter((r) => r.isActive).length,
        totalMarkets: uniqueMarkets.size,
        totalProducts: uniqueProducts.size,
        totalDates: uniqueDates.size,
        todayUpdates: todayCount,
      },
      filters: {
        markets: Array.from(uniqueMarkets).sort(),
        products: Array.from(uniqueProducts).sort(),
        dates: Array.from(uniqueDates).sort().reverse(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listLiveMarketPrices(req, res, next) {
  try {
    const filter = { isActive: true };
    if (req.query.marketName && req.query.marketName !== "all") {
      filter.marketName = String(req.query.marketName);
    }
    if (req.query.productName && req.query.productName !== "all") {
      filter.productName = String(req.query.productName);
    }

    // Date filters for live prices
    const queryDate = req.query.priceDate || req.query.date;
    if (queryDate && queryDate !== "all") {
      filter.priceDate = String(queryDate).slice(0, 10);
    } else if (req.query.startDate && req.query.endDate) {
      filter.priceDate = {
        $gte: String(req.query.startDate).slice(0, 10),
        $lte: String(req.query.endDate).slice(0, 10),
      };
    }

    const rows = await MarketPrice.find(filter)
      .sort({ priceDate: -1, updatedAt: -1 })
      .limit(500)
      .lean();
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getMarketPrice(req, res, next) {
  try {
    const row = await MarketPrice.findById(req.params.id).lean();
    if (!row) return res.status(404).json({ success: false, message: "Market price not found" });
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function createMarketPrice(req, res, next) {
  try {
    const {
      marketName,
      productName,
      variety,
      price,
      minPrice,
      maxPrice,
      unit,
      priceDate,
      district,
      state,
      trend,
      arrivalQuantity,
      arrivalUnit,
      notes,
      isActive,
      isGreenGroo,
    } = req.body;

    if (!marketName || !String(marketName).trim()) {
      return res.status(400).json({ success: false, message: "Market Name is required" });
    }
    if (!productName || !String(productName).trim()) {
      return res.status(400).json({ success: false, message: "Product is required" });
    }
    if (!variety || !String(variety).trim()) {
      return res.status(400).json({ success: false, message: "Variety is required" });
    }
    if (price === undefined || price === null || price === "" || isNaN(Number(price))) {
      return res.status(400).json({ success: false, message: "Valid Price is required" });
    }

    const numPrice = Number(price);
    const numMin = minPrice !== undefined && minPrice !== "" ? Number(minPrice) : numPrice;
    const numMax = maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : numPrice;
    const isGg =
      Boolean(isGreenGroo) ||
      String(marketName).toLowerCase().includes("greengroo") ||
      String(marketName).includes("ग्रीनग्रू");

    const row = await MarketPrice.create({
      marketName: String(marketName).trim(),
      productName: String(productName).trim(),
      variety: String(variety).trim(),
      price: numPrice,
      minPrice: numMin,
      maxPrice: numMax,
      unit: unit ? String(unit).trim() : "Quintal",
      priceDate: priceDate ? String(priceDate).slice(0, 10) : getIsoDateOffset(0),
      district: district ? String(district).trim() : "Pune",
      state: state ? String(state).trim() : "Maharashtra",
      trend: trend || "stable",
      arrivalQuantity: arrivalQuantity ? Number(arrivalQuantity) : 0,
      arrivalUnit: arrivalUnit ? String(arrivalUnit).trim() : "Quintal",
      notes: notes ? String(notes).trim() : "",
      isActive: isActive !== false,
      isGreenGroo: isGg,
    });

    safeEmit((io) => {
      io.emit("market_price_updated", row);
      io.emit("market_prices_changed", { action: "create", id: row._id });
    });

    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function updateMarketPrice(req, res, next) {
  try {
    const row = await MarketPrice.findById(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Market price not found" });

    const {
      marketName,
      productName,
      variety,
      price,
      minPrice,
      maxPrice,
      unit,
      priceDate,
      district,
      state,
      trend,
      arrivalQuantity,
      arrivalUnit,
      notes,
      isActive,
      isGreenGroo,
    } = req.body;

    if (marketName !== undefined) {
      row.marketName = String(marketName).trim();
      if (
        String(marketName).toLowerCase().includes("greengroo") ||
        String(marketName).includes("ग्रीनग्रू")
      ) {
        row.isGreenGroo = true;
      }
    }
    if (isGreenGroo !== undefined) row.isGreenGroo = Boolean(isGreenGroo);
    if (productName !== undefined) row.productName = String(productName).trim();
    if (variety !== undefined) row.variety = String(variety).trim();
    if (price !== undefined && price !== "" && !isNaN(Number(price))) row.price = Number(price);
    if (minPrice !== undefined && minPrice !== "" && !isNaN(Number(minPrice))) row.minPrice = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== "" && !isNaN(Number(maxPrice))) row.maxPrice = Number(maxPrice);
    if (unit !== undefined) row.unit = String(unit).trim();
    if (priceDate !== undefined) row.priceDate = String(priceDate).slice(0, 10);
    if (district !== undefined) row.district = String(district).trim();
    if (state !== undefined) row.state = String(state).trim();
    if (trend !== undefined) row.trend = trend;
    if (arrivalQuantity !== undefined) row.arrivalQuantity = Number(arrivalQuantity) || 0;
    if (arrivalUnit !== undefined) row.arrivalUnit = String(arrivalUnit).trim();
    if (notes !== undefined) row.notes = String(notes).trim();
    if (isActive !== undefined) row.isActive = Boolean(isActive);

    await row.save();

    safeEmit((io) => {
      io.emit("market_price_updated", row);
      io.emit("market_prices_changed", { action: "update", id: row._id });
    });

    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function deleteMarketPrice(req, res, next) {
  try {
    const row = await MarketPrice.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Market price not found" });

    safeEmit((io) => {
      io.emit("market_price_deleted", { id: req.params.id });
      io.emit("market_prices_changed", { action: "delete", id: req.params.id });
    });

    res.json({ success: true, message: "Market price removed successfully" });
  } catch (err) {
    next(err);
  }
}
