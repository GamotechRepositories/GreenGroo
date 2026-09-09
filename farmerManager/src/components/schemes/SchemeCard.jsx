import { Calendar, Clock, ExternalLink, FileText, Landmark } from "lucide-react";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_PANEL } from "../../utils/excelStyles";

export default function SchemeCard({ scheme, onViewDetails }) {
  const isClosingSoon = scheme.statusBadge === "closing_soon" || scheme.daysLeft <= 10;
  const isUpcoming = scheme.statusBadge === "upcoming";

  return (
    <div className={`${EXCEL_PANEL} flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md transition-all border border-[#D4D4D4]`}>
      {/* Top Banner & Status Badge */}
      <div className="relative">
        <img
          src={scheme.image}
          alt={scheme.title}
          className="h-36 w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 z-10">
          <span className="inline-flex items-center gap-1 rounded bg-slate-900/80 px-2 py-0.5 text-[10px] font-extrabold text-white backdrop-blur-xs">
            <Landmark className="h-3 w-3 text-amber-300" />
            {scheme.govtLevel}
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-extrabold text-white uppercase ${
              isUpcoming
                ? "bg-purple-700"
                : isClosingSoon
                ? "bg-amber-600 animate-pulse"
                : "bg-emerald-700"
            }`}
          >
            <Clock className="h-3 w-3" />
            {scheme.status}
          </span>
        </div>

        <div className="absolute bottom-2 left-2 right-2 z-10">
          <span className="inline-block rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-black text-white shadow-xs">
            {scheme.subsidyAmount}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
            {scheme.title}
          </h3>
          <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {scheme.description}
          </p>
        </div>

        {/* Info Grid */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between text-slate-700 font-semibold">
            <span>Max Benefit:</span>
            <span className="font-extrabold text-emerald-800">{scheme.maxBenefit}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-amber-600" />
              Deadline:
            </span>
            <span className="font-bold text-amber-900">{scheme.deadline}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(scheme)}
            className={`${EXCEL_BTN} flex-1 inline-flex items-center justify-center gap-1 font-bold text-slate-800`}
          >
            <FileText className="h-3.5 w-3.5 text-slate-600" />
            <span>Eligibility & Docs</span>
          </button>

          <button
            type="button"
            onClick={() => onViewDetails(scheme)}
            className={`${EXCEL_BTN_PRIMARY} flex-1 inline-flex items-center justify-center gap-1 font-bold`}
          >
            <span>Apply Now</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
