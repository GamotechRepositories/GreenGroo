import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, RefreshCw, Search, Store, TrendingUp } from "lucide-react";
import { CROP_CATEGORIES, CROP_MARKET_PRICES } from "../data/mandiMarketData";
import MarketPriceChart from "../components/market/MarketPriceChart";
import CropGradePriceBreakdown from "../components/market/CropGradePriceBreakdown";
import NearbyMarketComparison from "../components/market/NearbyMarketComparison";
import StatCard from "../components/ui/StatCard";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_SELECT,
} from "../utils/excelStyles";

export default function MarketPricesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cropFromUrl = searchParams.get("crop") || "";

  const [selectedCropId, setSelectedCropId] = useState(() => {
    if (cropFromUrl) {
      const match = CROP_MARKET_PRICES.find(
        (c) => c.cropName.toLowerCase() === cropFromUrl.toLowerCase()
      );
      if (match) return match.id;
    }
    return CROP_MARKET_PRICES[0]?.id || "crop-1";
  });

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState("Today, 11:30 AM");

  const activeCrop = useMemo(() => {
    return CROP_MARKET_PRICES.find((c) => c.id === selectedCropId) || CROP_MARKET_PRICES[0];
  }, [selectedCropId]);

  const filteredCrops = useMemo(() => {
    return CROP_MARKET_PRICES.filter((crop) => {
      const matchesCategory =
        selectedCategory === "All" || crop.category === selectedCategory;
      const matchesSearch =
        crop.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crop.localName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleRefresh = () => {
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLastRefreshed(`Today, ${time}`);
  };

  const handleSelectCrop = (cropId) => {
    setSelectedCropId(cropId);
    const crop = CROP_MARKET_PRICES.find((c) => c.id === cropId);
    if (crop) {
      setSearchParams({ crop: crop.cropName });
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Today's Mandi / APMC Market Prices</h1>
          <p className={EXCEL_PAGE_SUB}>
            Live Market Rates, Crop & Grade-wise Pricing, Nearby APMC Comparison & Price Trend Charts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6B7280]">Updated: {lastRefreshed}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className={`${EXCEL_BTN} inline-flex items-center gap-1.5`}
            title="Refresh Mandi Prices"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#217346]" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Crop Selected"
          value={activeCrop ? `${activeCrop.cropName} (${activeCrop.unit})` : "None"}
        />
        <StatCard
          title="Current Modal Rate"
          value={activeCrop ? `₹${activeCrop.modalPrice.toLocaleString("en-IN")} / qtl` : "₹0"}
        />
        <StatCard
          title="Grade A Export Price"
          value={activeCrop ? `₹${activeCrop.grades[0]?.price.toLocaleString("en-IN")} / qtl` : "₹0"}
        />
        <StatCard
          title="Highest Mandi Price Today"
          value={
            activeCrop
              ? `₹${Math.max(...activeCrop.mandis.map((m) => m.modalPrice)).toLocaleString("en-IN")} / qtl`
              : "₹0"
          }
        />
      </div>

      {/* Crop Selector & Filter Bar */}
      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#217346]" />
            <span className="font-bold text-[#1F2937]">Select Crop for Market Analysis</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Crop */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search crop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${EXCEL_INPUT} pl-7 w-40 sm:w-52`}
              />
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={EXCEL_SELECT}
            >
              {CROP_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Crop Selection Cards */}
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
            {filteredCrops.map((crop) => {
              const isSelected = crop.id === activeCrop.id;
              const isPos = crop.priceChange >= 0;

              return (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => handleSelectCrop(crop.id)}
                  className={`group relative flex flex-col justify-between rounded-lg p-2.5 text-left transition ${
                    isSelected
                      ? "border-2 border-[#217346] bg-[#E8F5E9] shadow-xs"
                      : "border border-[#D4D4D4] bg-white hover:border-[#217346] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-bold text-[#1F2937]">
                      {crop.cropName}
                    </span>
                    <span className={`text-[10px] font-extrabold ${
                      isPos ? "text-emerald-700" : "text-red-600"
                    }`}>
                      {isPos ? "+" : ""}{crop.priceChange}%
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-[#217346]">
                        ₹{crop.modalPrice.toLocaleString("en-IN")}{" "}
                        <span className="text-[9px] font-normal text-slate-500">/qtl</span>
                      </div>
                      <div className="text-[10px] font-semibold text-slate-600">
                        ₹{(crop.modalPrice / 100).toFixed(1)}/kg
                      </div>
                    </div>
                    <img
                      src={crop.image}
                      alt={crop.cropName}
                      className="h-8 w-8 rounded-md object-cover border border-slate-200"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature 1 & 4: Interactive Price Trend & History Chart */}
      <MarketPriceChart crop={activeCrop} />

      {/* Feature 2: Crop-wise + Grade-wise Rate Breakdown */}
      <CropGradePriceBreakdown crop={activeCrop} />

      {/* Feature 3: Nearby Market & APMC Price Comparison */}
      <NearbyMarketComparison crop={activeCrop} />
    </div>
  );
}
