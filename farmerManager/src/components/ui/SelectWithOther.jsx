import { EXCEL_INPUT } from "../../utils/excelStyles";

export const OTHER_OPTION = "Other";

export function splitPreset(options = [], value = "") {
  const list = options.filter((o) => o !== OTHER_OPTION);
  const raw = String(value || "").trim();
  if (!raw) return { select: "", custom: "" };
  if (list.includes(raw)) return { select: raw, custom: "" };
  return { select: OTHER_OPTION, custom: raw === OTHER_OPTION ? "" : raw };
}

export function resolvePreset(selectValue, customValue) {
  if (selectValue === OTHER_OPTION) return String(customValue || "").trim();
  return String(selectValue || "").trim();
}

function optionList(options = []) {
  return options.filter((o) => o !== OTHER_OPTION);
}

export default function SelectWithOther({
  label,
  required = false,
  options,
  selectValue,
  customValue,
  onSelect,
  onCustom,
  error,
  customLabel,
  placeholder = "Enter value",
  inputClass = EXCEL_INPUT,
  className = "",
}) {
  const list = optionList(options);
  return (
    <div className={className}>
      <label className="mb-0.5 block text-[11px] font-semibold text-slate-600 sm:mb-1 sm:text-xs">
        {label}
        {required ? " *" : ""}
      </label>
      <select className={inputClass} value={selectValue} onChange={(e) => onSelect(e.target.value)}>
        <option value="">Select</option>
        {list.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
      </select>
      {selectValue === OTHER_OPTION ? (
        <input
          className={`${inputClass} mt-1.5`}
          value={customValue}
          placeholder={customLabel || placeholder}
          onChange={(e) => onCustom(e.target.value)}
        />
      ) : null}
      {error ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{error}</p> : null}
    </div>
  );
}

export function InlineSelectWithOther({
  options,
  selectValue,
  customValue,
  onSelect,
  onCustom,
  error,
  placeholder = "Specify",
  inputClass = EXCEL_INPUT,
}) {
  const list = optionList(options);
  return (
    <div className="w-full min-w-0 space-y-1">
      <select className={inputClass} value={selectValue} onChange={(e) => onSelect(e.target.value)}>
        {list.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
      </select>
      {selectValue === OTHER_OPTION ? (
        <input
          className={inputClass}
          value={customValue}
          placeholder={placeholder}
          onChange={(e) => onCustom(e.target.value)}
        />
      ) : null}
      {error ? <p className="text-[10px] text-[#DC2626]">{error}</p> : null}
    </div>
  );
}
