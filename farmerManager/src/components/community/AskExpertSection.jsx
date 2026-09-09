import { Award, HelpCircle, MessageSquarePlus, ShieldCheck, Users } from "lucide-react";
import { EXCEL_BTN_PRIMARY, EXCEL_PANEL } from "../../utils/excelStyles";

export default function AskExpertSection({ onOpenAskModal }) {
  return (
    <div className={`${EXCEL_PANEL} overflow-hidden bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-amber-400 px-2 py-0.5 text-[10.5px] font-extrabold text-slate-950 uppercase tracking-wider">
              <Award className="h-3.5 w-3.5" /> Verified Agriculture Experts Active
            </span>
            <span className="text-xs text-emerald-200 font-semibold">• 24/7 Crop Advice</span>
          </div>

          <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
            Ask Agriculture Experts & Krishi Scientists (कृषी तज्ज्ञांना प्रश्न विचारा)
          </h2>

          <p className="text-xs text-emerald-100 leading-relaxed">
            Get expert advice on pest control, crop diseases, fertilizer dosage, weather protection, and high-yield farming methods in Marathi, Hindi, & English.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAskModal}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md transition hover:bg-amber-300 hover:scale-105"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Ask Agriculture Question Now</span>
        </button>
      </div>

      {/* Expert Badges Ticker */}
      <div className="mt-3.5 flex flex-wrap items-center gap-4 pt-3 border-t border-emerald-700/60 text-[11px] text-emerald-100">
        <div className="flex items-center gap-1.5 font-semibold">
          <ShieldCheck className="h-4 w-4 text-amber-400" />
          <span>Verified KVK Scientists</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold">
          <Users className="h-4 w-4 text-emerald-300" />
          <span>Farmer Community</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold">
          <MessageSquarePlus className="h-4 w-4 text-amber-300" />
          <span>Local Language Support (मराठी/हिंदी/EN)</span>
        </div>
      </div>
    </div>
  );
}
