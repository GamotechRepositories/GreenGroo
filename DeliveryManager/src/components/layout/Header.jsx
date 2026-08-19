import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Icon } from "../ui/Icon";

export default function Header({ onMobileMenuToggle }) {
  const { manager } = useAuth();
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 md:px-8 py-3.5 shadow-xs">
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            title="Toggle Menu"
          >
            <Icon name="menu" size="md" />
          </button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {manager?.city || "Dark Store"}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-extrabold text-emerald-700">
              {manager?.area || " Hub"}
            </span>
          </div>
          <p className="text-base font-extrabold text-slate-900 leading-tight">
            {manager?.storeName || "GreenRow Dark Store Operations"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200/60">
          <span>{time}</span>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200/70 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Store Live (Fulfillment Active)
        </span>
      </div>
    </header>
  );
}
