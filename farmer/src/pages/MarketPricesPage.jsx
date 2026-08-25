import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { CROP_MARKET_PRICES } from "../data/mandiMarketData";
import CommodityMandiPriceTable from "../components/market/CommodityMandiPriceTable";
import NearbyMarketComparison from "../components/market/NearbyMarketComparison";
import {
  EXCEL_BTN,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
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
    return CROP_MARKET_PRICES[0]?.id || "";
  });

  const [lastRefreshed, setLastRefreshed] = useState("");

  const activeCrop = useMemo(() => {
    return CROP_MARKET_PRICES.find((c) => c.id === selectedCropId) || CROP_MARKET_PRICES[0] || null;
  }, [selectedCropId]);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Today's Mandi / APMC Market Prices</h1>
          <p className={EXCEL_PAGE_SUB}>
            Live Market Rates, Crop & Grade-wise Pricing, Nearby APMC Comparison & Price Trend Charts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastRefreshed ? <span className="text-xs text-[#6B7280]">Updated: {lastRefreshed}</span> : null}
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

      <CommodityMandiPriceTable
        onSelectCommodity={(name) => {
          const match = CROP_MARKET_PRICES.find(
            (c) => c.cropName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.cropName.toLowerCase())
          );
          if (match) {
            handleSelectCrop(match.id);
          }
        }}
      />

      <NearbyMarketComparison crop={activeCrop} />
    </div>
  );
}
