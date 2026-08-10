export default function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {breadcrumb ? <p className="mb-1 text-xs text-[#6B7280]">{breadcrumb}</p> : null}
        <h1 className="text-xl font-semibold text-[#1F2937] sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
