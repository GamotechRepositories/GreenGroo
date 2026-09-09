import { EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE } from "../../utils/excelStyles";

export default function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumb ? <p className={`mb-1 ${EXCEL_PAGE_SUB}`}>{breadcrumb}</p> : null}
        <h1 className={EXCEL_PAGE_TITLE}>{title}</h1>
        {subtitle ? <p className={`mt-1 ${EXCEL_PAGE_SUB}`}>{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
