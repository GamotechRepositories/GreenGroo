import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { MANDI_TABLE_DATA } from "../../data/mandiMarketData";
import { EXCEL_INPUT, EXCEL_PANEL, EXCEL_PANEL_HEAD, EXCEL_SELECT } from "../../utils/excelStyles";

export default function CommodityMandiPriceTable({ onSelectCommodity }) {
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");

  const states = useMemo(() => {
    const set = new Set(MANDI_TABLE_DATA.map((d) => d.state));
    return ["All", ...Array.from(set)];
  }, []);

  const districts = useMemo(() => {
    const list =
      selectedState === "All"
        ? MANDI_TABLE_DATA
        : MANDI_TABLE_DATA.filter((d) => d.state === selectedState);
    const set = new Set(list.map((d) => d.district));
    return ["All", ...Array.from(set)];
  }, [selectedState]);

  const filteredData = useMemo(() => {
    return MANDI_TABLE_DATA.filter((item) => {
      const matchState = selectedState === "All" || item.state === selectedState;
      const matchDistrict = selectedDistrict === "All" || item.district === selectedDistrict;
      const matchSearch =
        item.commodity.toLowerCase().includes(search.toLowerCase()) ||
        item.variety.toLowerCase().includes(search.toLowerCase()) ||
        item.market.toLowerCase().includes(search.toLowerCase());

      return matchState && matchDistrict && matchSearch;
    });
  }, [selectedState, selectedDistrict, search]);

  return (
    <div className={EXCEL_PANEL}>
      <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#217346]" />
          <span className="font-bold text-[#1F2937]">Mandi Wise Commodity Price Table</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search commodity or market..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${EXCEL_INPUT} pl-7 w-44 sm:w-56`}
            />
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict("All");
            }}
            className={EXCEL_SELECT}
          >
            {states.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All States" : s}
              </option>
            ))}
          </select>

          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className={EXCEL_SELECT}
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d === "All" ? "All Districts" : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Matching User Reference Image (Black Header, Blue Links, No Mobile App Column) */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-black text-white font-semibold">
              <th className="px-3.5 py-3 border-b border-black text-left">Commodity</th>
              <th className="px-3.5 py-3 border-b border-black text-left">Arrival Date</th>
              <th className="px-3.5 py-3 border-b border-black text-left">Variety</th>
              <th className="px-3.5 py-3 border-b border-black text-left">State</th>
              <th className="px-3.5 py-3 border-b border-black text-left">District</th>
              <th className="px-3.5 py-3 border-b border-black text-left">Market</th>
              <th className="px-3.5 py-3 border-b border-black text-left">Min Price</th>
              <th className="px-3.5 py-3 border-b border-black text-left">Max Price</th>
              <th className="px-3.5 py-3 border-b border-black text-left">Avg price</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-xs text-slate-500">
                  {MANDI_TABLE_DATA.length === 0
                    ? "No mandi price data available."
                    : "No Mandi price entries found for your search."}
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => {
                const isEven = index % 2 === 0;
                return (
                  <tr
                    key={row.id}
                    className={`transition-colors hover:bg-sky-50/70 ${
                      isEven ? "bg-[#F8FAFC]" : "bg-white"
                    }`}
                  >
                    {/* Commodity in Blue Link */}
                    <td className="px-3.5 py-2.5 border-b border-slate-100 font-semibold text-[#3B82F6]">
                      <button
                        type="button"
                        onClick={() => onSelectCommodity && onSelectCommodity(row.commodity)}
                        className="hover:underline text-left cursor-pointer text-[#3B82F6]"
                      >
                        {row.commodity}
                      </button>
                    </td>

                    {/* Arrival Date */}
                    <td className="px-3.5 py-2.5 border-b border-slate-100 text-slate-800">
                      {row.arrivalDate}
                    </td>

                    {/* Variety */}
                    <td className="px-3.5 py-2.5 border-b border-slate-100 text-slate-800">
                      {row.variety}
                    </td>

                    {/* State in Blue Link */}
                    <td className="px-3.5 py-2.5 border-b border-slate-100 font-semibold text-[#3B82F6]">
                      <span className="leading-tight">{row.state}</span>
                    </td>

                    {/* District in Blue Link */}
                    <td className="px-3.5 py-2.5 border-b border-slate-100 font-semibold text-[#3B82F6]">
                      <span className="leading-tight">{row.district}</span>
                    </td>

                    {/* Market in Blue Link */}
                    <td className="px-3.5 py-2.5 border-b border-slate-100 font-semibold text-[#3B82F6]">
                      <span className="leading-tight">{row.market}</span>
                    </td>

                    {/* Min Price */}
                    <td className="px-3.5 py-2.5 border-b border-slate-100 text-slate-900 font-medium whitespace-nowrap">
                      Rs {row.minPrice} / {row.unit}
                    </td>

                    {/* Max Price */}
                    <td className="px-3.5 py-2.5 border-b border-slate-100 text-slate-900 font-medium whitespace-nowrap">
                      Rs {row.maxPrice} / {row.unit}
                    </td>

                    {/* Avg Price */}
                    <td className="px-3.5 py-2.5 border-b border-slate-100 text-slate-900 font-bold whitespace-nowrap">
                      Rs {row.avgPrice} / {row.unit}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
