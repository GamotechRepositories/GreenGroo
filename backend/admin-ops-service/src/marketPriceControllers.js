import { MarketPrice } from "./models.js";

const DEFAULT_MARKET_PRICES = [
  {
    marketName: "Pune APMC",
    productName: "Tomato",
    variety: "Hybrid No.1",
    price: 2400,
    minPrice: 2000,
    maxPrice: 2800,
    unit: "Quintal",
    priceDate: new Date().toISOString().slice(0, 10),
    district: "Pune",
    state: "Maharashtra",
    trend: "up",
    arrivalQuantity: 1850,
    arrivalUnit: "Quintal",
    notes: "Good quality arrivals from Narayangaon & Junnar.",
    isActive: true,
  },
  {
    marketName: "Pune APMC",
    productName: "Onion",
    variety: "Garwa / Unhali",
    price: 1850,
    minPrice: 1500,
    maxPrice: 2200,
    unit: "Quintal",
    priceDate: new Date().toISOString().slice(0, 10),
    district: "Pune",
    state: "Maharashtra",
    trend: "stable",
    arrivalQuantity: 4200,
    arrivalUnit: "Quintal",
    notes: "Steady supply from Khed and Shirur talukas.",
    isActive: true,
  },
  {
    marketName: "Mumbai Vashi APMC",
    productName: "Tomato",
    variety: "Desi Special",
    price: 2600,
    minPrice: 2200,
    maxPrice: 3000,
    unit: "Quintal",
    priceDate: new Date().toISOString().slice(0, 10),
    district: "Mumbai",
    state: "Maharashtra",
    trend: "up",
    arrivalQuantity: 2100,
    arrivalUnit: "Quintal",
    notes: "High retail demand in MMR region.",
    isActive: true,
  },
  {
    marketName: "Nashik APMC",
    productName: "Onion",
    variety: "Lal Kaanda",
    price: 2100,
    minPrice: 1700,
    maxPrice: 2450,
    unit: "Quintal",
    priceDate: new Date().toISOString().slice(0, 10),
    district: "Nashik",
    state: "Maharashtra",
    trend: "up",
    arrivalQuantity: 8600,
    arrivalUnit: "Quintal",
    notes: "Major trading volume today.",
    isActive: true,
  },
  {
    marketName: "Kolhapur APMC",
    productName: "Green Chilli",
    variety: "G4 Green",
    price: 4500,
    minPrice: 3800,
    maxPrice: 5200,
    unit: "Quintal",
    priceDate: new Date().toISOString().slice(0, 10),
    district: "Kolhapur",
    state: "Maharashtra",
    trend: "stable",
    arrivalQuantity: 920,
    arrivalUnit: "Quintal",
    notes: "Strong demand from local processing units.",
    isActive: true,
  },
  {
    marketName: "Solapur APMC",
    productName: "Pomegranate",
    variety: "Bhagwa Super",
    price: 9500,
    minPrice: 8000,
    maxPrice: 11500,
    unit: "Quintal",
    priceDate: new Date().toISOString().slice(0, 10),
    district: "Solapur",
    state: "Maharashtra",
    trend: "down",
    arrivalQuantity: 650,
    arrivalUnit: "Quintal",
    notes: "Export grade arrivals fetch higher rates.",
    isActive: true,
  },
  {
    marketName: "Sangli APMC",
    productName: "Turmeric",
    variety: "Rajapore Salem",
    price: 13800,
    minPrice: 12500,
    maxPrice: 15200,
    unit: "Quintal",
    priceDate: new Date().toISOString().slice(0, 10),
    district: "Sangli",
    state: "Maharashtra",
    trend: "stable",
    arrivalQuantity: 1200,
    arrivalUnit: "Quintal",
    notes: "Steady auctions in spice yard.",
    isActive: true,
  },
  {
    marketName: "Pune APMC",
    productName: "Potato",
    variety: "Jyoti / Local",
    price: 1900,
    minPrice: 1600,
    maxPrice: 2200,
    unit: "Quintal",
    priceDate: new Date().toISOString().slice(0, 10),
    district: "Pune",
    state: "Maharashtra",
    trend: "stable",
    arrivalQuantity: 3100,
    arrivalUnit: "Quintal",
    notes: "Fresh arrivals from Manchar cold stores.",
    isActive: true,
  },
  {
    marketName: "GreenGroo Direct Center",
    productName: "Tomato",
    variety: "Hybrid Super Grade",
    price: 2850,
    minPrice: 2500,
    maxPrice: 3100,
    unit: "Quintal",
    priceDate: new Date().toISOString().slice(0, 10),
    district: "Pune Hub",
    state: "Maharashtra",
    trend: "up",
    arrivalQuantity: 3200,
    arrivalUnit: "Quintal",
    notes: "Direct farmgate purchase. 0% middleman commission, 24h instant payout.",
    isActive: true,
    isGreenGroo: true,
  },
  {
    marketName: "GreenGroo Direct Center",
    productName: "Onion",
    variety: "Garwa / Export",
    price: 2250,
    minPrice: 1950,
    maxPrice: 2500,
    unit: "Quintal",
    priceDate: new Date().toISOString().slice(0, 10),
    district: "Nashik Hub",
    state: "Maharashtra",
    trend: "up",
    arrivalQuantity: 5400,
    arrivalUnit: "Quintal",
    notes: "Direct farm procurement with doorstep pickup.",
    isActive: true,
    isGreenGroo: true,
  },
];

export async function seedDefaultMarketPricesIfEmpty() {
  try {
    const count = await MarketPrice.countDocuments();
    if (count === 0) {
      await MarketPrice.insertMany(DEFAULT_MARKET_PRICES);
      console.log(`[MarketPrice] Seeded ${DEFAULT_MARKET_PRICES.length} initial APMC market prices.`);
    } else {
      const ggCount = await MarketPrice.countDocuments({
        $or: [
          { isGreenGroo: true },
          { marketName: { $regex: /greengroo|ग्रीनग्रू/i } },
        ],
      });
      if (ggCount === 0) {
        const ggSeeds = DEFAULT_MARKET_PRICES.filter((p) => p.isGreenGroo);
        if (ggSeeds.length > 0) {
          await MarketPrice.insertMany(ggSeeds);
          console.log(`[MarketPrice] Seeded ${ggSeeds.length} initial GreenGroo market prices.`);
        }
      }
    }
  } catch (err) {
    console.warn("[MarketPrice] Seed check failed:", err.message);
  }
}

export async function listMarketPrices(req, res, next) {
  try {
    await seedDefaultMarketPricesIfEmpty();

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
    if (req.query.priceDate) {
      filter.priceDate = String(req.query.priceDate);
    }

    const rows = await MarketPrice.find(filter).sort({ priceDate: -1, updatedAt: -1 }).lean();

    const allRecords = await MarketPrice.find().lean();
    const uniqueMarkets = new Set(allRecords.map((r) => r.marketName).filter(Boolean));
    const uniqueProducts = new Set(allRecords.map((r) => r.productName).filter(Boolean));
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = allRecords.filter((r) => r.priceDate === todayStr).length;

    res.json({
      success: true,
      data: rows,
      stats: {
        total: allRecords.length,
        active: allRecords.filter((r) => r.isActive).length,
        totalMarkets: uniqueMarkets.size,
        totalProducts: uniqueProducts.size,
        todayUpdates: todayCount,
      },
      filters: {
        markets: Array.from(uniqueMarkets).sort(),
        products: Array.from(uniqueProducts).sort(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listLiveMarketPrices(req, res, next) {
  try {
    await seedDefaultMarketPricesIfEmpty();
    const filter = { isActive: true };
    if (req.query.marketName) filter.marketName = String(req.query.marketName);
    if (req.query.productName) filter.productName = String(req.query.productName);

    const rows = await MarketPrice.find(filter)
      .sort({ priceDate: -1, updatedAt: -1 })
      .limit(100)
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
      priceDate: priceDate ? String(priceDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      district: district ? String(district).trim() : "Pune",
      state: state ? String(state).trim() : "Maharashtra",
      trend: trend || "stable",
      arrivalQuantity: arrivalQuantity ? Number(arrivalQuantity) : 0,
      arrivalUnit: arrivalUnit ? String(arrivalUnit).trim() : "Quintal",
      notes: notes ? String(notes).trim() : "",
      isActive: isActive !== false,
      isGreenGroo: isGg,
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
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function deleteMarketPrice(req, res, next) {
  try {
    const row = await MarketPrice.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Market price not found" });
    res.json({ success: true, message: "Market price removed successfully" });
  } catch (err) {
    next(err);
  }
}
