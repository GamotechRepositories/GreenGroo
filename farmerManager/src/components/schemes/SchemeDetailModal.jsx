import { Calendar, CheckCircle2, ExternalLink, FileCheck, HelpCircle, Info, Landmark, X } from "lucide-react";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";

export default function SchemeDetailModal({ scheme, isOpen, onClose }) {
  if (!isOpen || !scheme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-emerald-800 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-amber-300" />
            <div>
              <h2 className="text-sm font-black leading-tight text-white">{scheme.shortName}</h2>
              <p className="text-[10.5px] text-emerald-200">{scheme.govtLevel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-emerald-100 hover:bg-emerald-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="farmer-scrollbar flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-800">
          {/* Top Banner Card */}
          <div className="flex flex-col sm:flex-row gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <img
              src={scheme.image}
              alt={scheme.title}
              className="h-28 w-full sm:w-40 rounded-lg object-cover border border-slate-200 shrink-0"
            />
            <div className="space-y-1.5 flex-1">
              <span className="inline-block rounded bg-emerald-700 px-2 py-0.5 text-[10px] font-extrabold text-white">
                {scheme.subsidyAmount}
              </span>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">{scheme.title}</h3>
              <p className="text-xs text-slate-700">{scheme.description}</p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                <span className="font-bold text-emerald-800">Max Benefit: {scheme.maxBenefit}</span>
                <span className="font-bold text-amber-900">Deadline: {scheme.deadline}</span>
              </div>
            </div>
          </div>

          {/* 1. Eligibility Criteria (पात्रता अटी) */}
          <div className="border border-slate-200 rounded-lg bg-white p-3 space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-black text-slate-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>1. Eligibility Criteria (पात्रता व अटी)</span>
            </div>
            <ul className="space-y-1.5 pl-1 text-xs text-slate-700">
              {scheme.eligibility.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. Required Documents (आवश्यक कागदपत्रे) */}
          <div className="border border-slate-200 rounded-lg bg-white p-3 space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-black text-slate-900">
              <FileCheck className="h-4 w-4 text-amber-600" />
              <span>2. Required Documents Checklist (आवश्यक कागदपत्रे सूची)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {scheme.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2"
                >
                  <span className="font-semibold text-slate-800">{doc.name}</span>
                  {doc.required ? (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9.5px] font-bold text-red-800">
                      Mandatory (आवश्यक)
                    </span>
                  ) : (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9.5px] font-medium text-slate-600">
                      Optional
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Application Information & Steps (अर्ज प्रक्रिया) */}
          <div className="border border-slate-200 rounded-lg bg-white p-3 space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-black text-slate-900">
              <Info className="h-4 w-4 text-teal-600" />
              <span>3. How & Where to Apply (अर्ज प्रक्रिया माहिती)</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <p className="font-bold text-slate-900">Mode of Application: <span className="text-emerald-700">{scheme.applicationInfo.mode}</span></p>
              <p className="font-semibold text-slate-800">Official Portal: {scheme.applicationInfo.portalName}</p>

              <div className="rounded bg-slate-50 p-2.5 space-y-1 border border-slate-200">
                <span className="font-bold text-slate-900 block">Step-by-Step Online Steps:</span>
                {scheme.applicationInfo.steps.map((step, idx) => (
                  <p key={idx} className="text-xs text-slate-700 pl-2">{step}</p>
                ))}
              </div>

              {scheme.applicationInfo.offlineContact ? (
                <p className="text-[11.5px] text-slate-600 pt-1">
                  <strong>Offline Application Helpline:</strong> {scheme.applicationInfo.offlineContact}
                </p>
              ) : null}
            </div>
          </div>

          {/* 4. Important Dates (महत्त्वाच्या तारखा) */}
          <div className="border border-slate-200 rounded-lg bg-white p-3 space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-black text-slate-900">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span>4. Important Dates & Timeline (महत्त्वाच्या तारखा)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {scheme.importantDates.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2">
                  <span className="font-medium text-slate-700">{d.label}</span>
                  <span className="font-bold text-emerald-800">{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-[11px] font-semibold text-slate-600">
            For assistance, contact your local Gram Sevak / Taluka Agriculture Office.
          </span>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className={EXCEL_BTN}>
              Close
            </button>

            {scheme.applicationInfo?.portalUrl ? (
              <a
                href={scheme.applicationInfo.portalUrl}
                target="_blank"
                rel="noreferrer"
                className={`${EXCEL_BTN_PRIMARY} inline-flex items-center gap-1.5 font-bold`}
              >
                <span>Apply Online on Govt Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
