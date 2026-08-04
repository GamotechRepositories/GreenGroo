export const inputClass =
  "w-full min-w-0 rounded-lg border border-border-light bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30";

export const labelClass = "mb-1 block text-sm font-medium text-text-primary";

export const cardClass =
  "rounded-xl border border-border-light bg-white p-4 shadow-sm sm:p-5";

export const btnPrimary =
  "inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 sm:w-auto";

export const btnDanger =
  "inline-flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 sm:w-auto";

export const btnSecondary =
  "inline-flex w-full items-center justify-center rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-text-primary transition hover:border-primary hover:text-primary sm:w-auto";

export const pageHeaderClass =
  "mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";

export const pageHeaderActionsClass = "flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end";

export const formHeaderClass =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";

export const modalOverlayClass =
  "fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4";

export const modalPanelClass =
  "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-xl";

export const modalHeaderClass =
  "sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border-light bg-white px-4 py-4 sm:px-5";

export const modalBodyClass = "flex-1 overflow-y-auto px-4 py-4 sm:px-5";

export const modalFooterClass =
  "sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border-light bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-5";

export const adminDetailRowClass =
  "grid grid-cols-1 gap-1 border-b border-border-light py-2.5 text-sm last:border-0 sm:grid-cols-[140px_1fr] sm:gap-2 sm:py-2";

export const tableClass =
  "mt-4 overflow-x-auto rounded-xl border border-border-light bg-white hide-scrollbar";

export const compactTableClass =
  "w-full min-w-[640px] table-fixed text-left text-xs sm:text-sm";

export const thClass = "px-2 py-2.5 font-semibold sm:px-3 sm:py-3";

export const tdClass = "px-2 py-2 align-top sm:px-3 sm:py-2.5";

export const adminFilterCardClass =
  "rounded-xl border border-neutral-200 bg-white p-4 shadow-sm";

export const adminFilterLabelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-neutral-500";

export const adminFilterInputClass =
  "w-full min-w-0 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none";

export const adminTableWrapperClass =
  "mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm hide-scrollbar";

export const adminTableClass = "w-full min-w-[720px] table-fixed text-left text-sm";

export const adminTableHeaderClass = "bg-neutral-900 text-white";

export const adminThClass = "px-3 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide sm:px-4";

export const adminActionBtnClass =
  "rounded border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60";

export const adminTdClass = "px-3 py-4 align-middle sm:px-4";

export const adminCompactTableClass =
  "w-full min-w-[760px] table-fixed text-left text-[10px] sm:text-[11px]";

export const adminCompactThClass =
  "px-2 py-2 text-left text-[9px] font-semibold uppercase tracking-wide sm:px-2.5 sm:text-[10px]";

export const adminCompactTdClass = "px-2 py-2 align-middle sm:px-2.5";

export const iconBtnClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-600 transition hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900";

export const iconBtnDangerClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-600 transition hover:border-red-500 hover:bg-red-50 hover:text-red-600";

export const parseList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
