function EmptyState({ title = "Nothing here yet", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F5E9] text-2xl">
        🌱
      </div>
      <h3 className="text-base font-semibold text-[#1F2937]">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-[#6B7280]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
