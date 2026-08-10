function StatCard({ title, value, hint, icon }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#6B7280]">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#1F2937]">{value}</p>
          {hint ? <p className="mt-1 text-xs text-[#6B7280]">{hint}</p> : null}
        </div>
        {icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F5E9] text-[#2E7D32]">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default StatCard;
