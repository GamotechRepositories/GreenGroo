import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Landmark, Search } from "lucide-react";
import { getLiveGovtSchemes } from "../api/farmerApi";
import { SCHEME_CATEGORIES, SCHEME_STATUS } from "../data/governmentSchemesData";
import SchemeCard from "../components/schemes/SchemeCard";
import SchemeDetailModal from "../components/schemes/SchemeDetailModal";
import StatCard from "../components/ui/StatCard";
import { mapApiGovtSchemes } from "../utils/govtSchemeMapper";
import {
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_SELECT,
} from "../utils/excelStyles";

export default function GovernmentSchemesPage() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Schemes");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeScheme, setActiveScheme] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadSchemes = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getLiveGovtSchemes();
      setSchemes(mapApiGovtSchemes(rows));
      setError("");
    } catch (err) {
      setSchemes([]);
      setError(err?.message || "Failed to load government schemes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  const filteredSchemes = useMemo(() => {
    return schemes.filter((scheme) => {
      const matchesCategory =
        selectedCategory === "All Schemes" || scheme.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "All Status" || scheme.status === selectedStatus;
      const matchesSearch =
        scheme.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [schemes, selectedCategory, selectedStatus, searchQuery]);

  const handleOpenDetails = (scheme) => {
    setActiveScheme(scheme);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Government Agricultural Schemes (शासकीय शेतकरी योजना)</h1>
          <p className={EXCEL_PAGE_SUB}>
            Scheme Eligibility, Required Documents Checklist, Online Application Steps & Deadlines
          </p>
        </div>

        <a
          href="https://mahadbt.maharashtra.gov.in"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
        >
          <Landmark className="h-4 w-4 text-amber-300" />
          <span>MahaDBT Official Portal (महाडीबीटी) →</span>
        </a>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Schemes Available" value={schemes.length} />
        <StatCard
          title="Active for Application"
          value={schemes.filter((s) => s.statusBadge === "active").length}
        />
        <StatCard
          title="Closing Soon"
          value={schemes.filter((s) => s.statusBadge === "closing_soon").length}
        />
        <StatCard
          title="Upcoming"
          value={schemes.filter((s) => s.statusBadge === "upcoming").length}
        />
      </div>

      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#217346]" />
            <span className="font-bold text-[#1F2937]">Filter Government Schemes</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search scheme..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${EXCEL_INPUT} pl-7 w-44 sm:w-56`}
              />
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={EXCEL_SELECT}
            >
              {SCHEME_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={EXCEL_SELECT}
            >
              {SCHEME_STATUS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-3.5">
          {error ? (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading government schemes…</div>
          ) : filteredSchemes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              {schemes.length === 0
                ? "No government schemes available yet."
                : "No government schemes match your search filter."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSchemes.map((scheme) => (
                <SchemeCard
                  key={scheme.id}
                  scheme={scheme}
                  onViewDetails={handleOpenDetails}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <SchemeDetailModal
        scheme={activeScheme}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
