import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { EXCEL_INPUT, EXCEL_PANEL, EXCEL_PANEL_HEAD, EXCEL_SELECT } from "../../utils/excelStyles";

export const MANDI_TABLE_DATA = [
  {
    id: "m-1",
    commodity: "Potato",
    arrivalDate: "17/08/2026",
    variety: "Other",
    state: "Maharashtra",
    district: "Pune",
    market: "Pune(Gultekdi)",
    minPrice: 1800,
    maxPrice: 2400,
    avgPrice: 2100,
    unit: "Quintal",
  },
  {
    id: "m-2",
    commodity: "Bhindi(Ladies Finger)",
    arrivalDate: "17/08/2026",
    variety: "Bhindi",
    state: "Maharashtra",
    district: "Thane",
    market: "Vashi(Mumbai APMC)",
    minPrice: 4000,
    maxPrice: 4500,
    avgPrice: 4250,
    unit: "Quintal",
  },
  {
    id: "m-3",
    commodity: "Onion",
    arrivalDate: "17/08/2026",
    variety: "Red Garwa",
    state: "Maharashtra",
    district: "Nashik",
    market: "Lasalgaon APMC",
    minPrice: 2000,
    maxPrice: 2850,
    avgPrice: 2680,
    unit: "Quintal",
  },
  {
    id: "m-4",
    commodity: "Tomato",
    arrivalDate: "17/08/2026",
    variety: "Hybrid Red",
    state: "Maharashtra",
    district: "Nashik",
    market: "Nashik APMC",
    minPrice: 2200,
    maxPrice: 2950,
    avgPrice: 2650,
    unit: "Quintal",
  },
  {
    id: "m-5",
    commodity: "Tapioca",
    arrivalDate: "17/08/2026",
    variety: "Tapioca",
    state: "Tamil Nadu",
    district: "The Nilgiris",
    market: "Coonoor(Uzhavar Sandhai)",
    minPrice: 3800,
    maxPrice: 4000,
    avgPrice: 3900,
    unit: "Quintal",
  },
  {
    id: "m-6",
    commodity: "Ginger(Green)",
    arrivalDate: "17/08/2026",
    variety: "Green Ginger",
    state: "Tamil Nadu",
    district: "The Nilgiris",
    market: "Coonoor(Uzhavar Sandhai)",
    minPrice: 12000,
    maxPrice: 18000,
    avgPrice: 15000,
    unit: "Quintal",
  },
  {
    id: "m-7",
    commodity: "Capsicum",
    arrivalDate: "17/08/2026",
    variety: "Capsicum",
    state: "Maharashtra",
    district: "Ahmednagar",
    market: "Ahmednagar APMC",
    minPrice: 7000,
    maxPrice: 8000,
    avgPrice: 7500,
    unit: "Quintal",
  },
  {
    id: "m-8",
    commodity: "Lime",
    arrivalDate: "17/08/2026",
    variety: "Lime",
    state: "Maharashtra",
    district: "Solapur",
    market: "Solapur APMC",
    minPrice: 11000,
    maxPrice: 12000,
    avgPrice: 11500,
    unit: "Quintal",
  },
  {
    id: "m-9",
    commodity: "Lemon",
    arrivalDate: "17/08/2026",
    variety: "Lemon",
    state: "Maharashtra",
    district: "Nagpur",
    market: "Nagpur(Kalamna)",
    minPrice: 10000,
    maxPrice: 12000,
    avgPrice: 11000,
    unit: "Quintal",
  },
  {
    id: "m-10",
    commodity: "Soybean",
    arrivalDate: "17/08/2026",
    variety: "Yellow Seed",
    state: "Maharashtra",
    district: "Latur",
    market: "Latur APMC",
    minPrice: 4500,
    maxPrice: 5200,
    avgPrice: 4980,
    unit: "Quintal",
  },
  {
    id: "m-11",
    commodity: "Grapes",
    arrivalDate: "17/08/2026",
    variety: "Thompson Seedless",
    state: "Maharashtra",
    district: "Sangli",
    market: "Sangli APMC",
    minPrice: 5200,
    maxPrice: 7800,
    avgPrice: 6500,
    unit: "Quintal",
  },
  {
    id: "m-12",
    commodity: "Chilli(Green)",
    arrivalDate: "17/08/2026",
    variety: "Guntur / Local",
    state: "Maharashtra",
    district: "Kolhapur",
    market: "Kolhapur(Shahu)",
    minPrice: 4800,
    maxPrice: 5600,
    avgPrice: 5200,
    unit: "Quintal",
  },
];

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
                  No Mandi price entries found for your search.
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
