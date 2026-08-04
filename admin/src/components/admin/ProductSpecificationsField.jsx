import { useState } from "react";

export const SPEC_CUSTOM_NAME = "__custom__";
export const SPEC_CUSTOM_VALUE = "__other__";

function SpecIcon({ name, className = "h-5 w-5" }) {
  const key = (name || "").toLowerCase();

  if (key.includes("model")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    );
  }
  if (key.includes("material")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
      </svg>
    );
  }
  if (key.includes("compat") || key.includes("connect")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    );
  }
  if (key.includes("power") || key.includes("watt")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h-3.75M3 10.5h3.75M10.5 3v3.75M10.5 21v-3.75M18.364 5.636l-2.652 2.652M8.288 15.712l-2.652 2.652M18.364 18.364l-2.652-2.652M8.288 8.288L5.636 5.636" />
      </svg>
    );
  }
  if (key.includes("cable") || key.includes("length")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
      </svg>
    );
  }
  if (key.includes("warranty")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    );
  }
  if (key.includes("packag")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    );
  }
  if (key.includes("country") || key.includes("origin")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    );
  }
  if (key.includes("quality") || key.includes("grade")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    );
  }
  if (key.includes("carton") || key.includes("qty") || key.includes("city")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75v-.008zm0 5.25h.007v.008H3.75v-.008z" />
    </svg>
  );
}

function getSpecDisplayName(spec) {
  if (spec.name === SPEC_CUSTOM_NAME) {
    return spec.customName.trim() || "Custom specification";
  }
  return spec.name.trim() || "Specification";
}

function isSpecComplete(spec) {
  const name =
    spec.name === SPEC_CUSTOM_NAME ? spec.customName.trim() : spec.name.trim();
  const value = spec.value?.trim();
  return Boolean(name && value && value !== SPEC_CUSTOM_VALUE);
}

function SpecificationValueField({ spec, index, valueOptions, allowCustomValue, onUpdate }) {
  const inputClass =
    "min-w-0 w-full rounded-lg border border-border-light bg-white px-1.5 py-1 text-[10px] leading-tight focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 sm:px-2.5 sm:py-2 sm:text-sm";
  const selectClass = `${inputClass} text-text-primary`;

  if (valueOptions.length > 0) {
    const isPreset = valueOptions.includes(spec.value);
    const showCustomInput =
      allowCustomValue &&
      (spec.value === SPEC_CUSTOM_VALUE || (spec.value && !isPreset));

    return (
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={showCustomInput && spec.value !== SPEC_CUSTOM_VALUE ? SPEC_CUSTOM_VALUE : spec.value}
          onChange={(e) => onUpdate(index, "value", e.target.value)}
          className={selectClass}
        >
          <option value="">Select value</option>
          {valueOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          {allowCustomValue ? (
            <option value={SPEC_CUSTOM_VALUE}>Other (type custom)</option>
          ) : null}
        </select>
        {showCustomInput ? (
          <input
            type="text"
            placeholder="Type custom value"
            value={spec.value === SPEC_CUSTOM_VALUE ? "" : spec.value}
            onChange={(e) =>
              onUpdate(index, "value", e.target.value.trim() || SPEC_CUSTOM_VALUE)
            }
            className={inputClass}
          />
        ) : null}
      </div>
    );
  }

  return (
    <input
      type="text"
      placeholder="Enter value"
      value={spec.value}
      onChange={(e) => onUpdate(index, "value", e.target.value)}
      className={inputClass}
    />
  );
}

function ProductSpecificationsField({
  specifications,
  specificationLibrary,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
}) {
  const [showTips, setShowTips] = useState(false);
  const [editOrder, setEditOrder] = useState(false);

  const completedCount = specifications.filter(isSpecComplete).length;

  const moveRow = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= specifications.length) return;
    onReorder(index, nextIndex);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border-light bg-white shadow-sm">
      <div className="border-b border-border-light px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-text-primary sm:text-lg">
              Product Specifications
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowTips((prev) => !prev)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-primary transition hover:bg-orange-100 sm:px-2.5 sm:py-1 sm:text-xs"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            Tips
          </button>
        </div>

        {showTips ? (
          <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/80 px-3 py-2.5 text-[10px] leading-relaxed text-text-secondary sm:text-xs">
            Every specification row is already added. Enter values for the ones you need,
            remove rows you do not need, and use Connectivity&apos;s &quot;Other&quot; option
            to type a custom value. Use &quot;+ Custom specification&quot; for extra fields.
          </div>
        ) : null}
      </div>

      <div className="divide-y divide-border-light">
        {specifications.map((spec, index) => {
          const isCustom = spec.name === SPEC_CUSTOM_NAME;
          const hasName = isCustom || Boolean(spec.name?.trim());
          const displayName = getSpecDisplayName(spec);
          const selectedConfig = specificationLibrary.find(
            (item) => item.name === (isCustom ? spec.customName.trim() : spec.name)
          );
          const valueOptions = isCustom ? [] : selectedConfig?.options || [];
          const allowCustomValue = Boolean(selectedConfig?.allowCustomValue);

          return (
            <div
              key={`spec-row-${index}`}
              className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4"
            >
              {editOrder ? (
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveRow(index, -1)}
                    className="rounded p-0.5 text-text-muted transition hover:bg-mobile-surface hover:text-primary disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={index === specifications.length - 1}
                    onClick={() => moveRow(index, 1)}
                    className="rounded p-0.5 text-text-muted transition hover:bg-mobile-surface hover:text-primary disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>
              ) : null}

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-primary sm:h-10 sm:w-10">
                <SpecIcon name={hasName ? displayName : ""} className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(140px,220px)_minmax(0,1fr)] sm:gap-3">
                {!hasName ? (
                  <select
                    value={spec.name}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      onUpdate(index, {
                        name: nextName,
                        customName: nextName !== SPEC_CUSTOM_NAME ? "" : spec.customName,
                        value: "",
                      });
                    }}
                    className="min-w-0 w-full rounded-lg border border-border-light bg-white px-1.5 py-1 text-[10px] leading-tight text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 sm:col-span-2 sm:px-2.5 sm:py-2 sm:text-sm"
                  >
                    <option value="">Select specification</option>
                    {specificationLibrary.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                    <option value={SPEC_CUSTOM_NAME}>+ Custom specification</option>
                  </select>
                ) : isCustom ? (
                  <>
                    <input
                      type="text"
                      placeholder="Specification name"
                      value={spec.customName}
                      onChange={(e) => onUpdate(index, "customName", e.target.value)}
                      className="min-w-0 w-full rounded-lg border border-border-light bg-white px-1.5 py-1 text-[10px] leading-tight focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 sm:px-2.5 sm:py-2 sm:text-sm"
                    />
                    <SpecificationValueField
                      spec={spec}
                      index={index}
                      valueOptions={valueOptions}
                      allowCustomValue={allowCustomValue}
                      onUpdate={onUpdate}
                    />
                  </>
                ) : (
                  <>
                    <div className="flex min-w-0 items-center gap-1">
                      <span className="truncate text-[10px] font-semibold leading-tight text-text-primary sm:text-sm">
                        {displayName}
                      </span>
                      <span className="shrink-0 text-[10px] text-text-muted sm:text-sm">:</span>
                    </div>
                    <SpecificationValueField
                      spec={spec}
                      index={index}
                      valueOptions={valueOptions}
                      allowCustomValue={allowCustomValue}
                      onUpdate={onUpdate}
                    />
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 sm:h-9 sm:w-9"
                aria-label="Remove specification"
              >
                <svg className="h-3.5 w-3.5 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mx-3 mb-3 mt-3 flex flex-col gap-3 rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-3 sm:mx-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-text-primary sm:text-sm">
              {completedCount} Specification{completedCount === 1 ? "" : "s"} Added
            </p>
            <p className="text-[10px] text-text-muted sm:text-xs">Only filled rows are saved on the product.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditOrder((prev) => !prev)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition sm:px-3 sm:py-2 sm:text-sm ${
            editOrder
              ? "border-primary bg-primary text-white"
              : "border-primary/40 bg-white text-primary hover:bg-orange-50"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          {editOrder ? "Done" : "Edit Order"}
        </button>
      </div>

      <div className="border-t border-border-light px-3 py-4 sm:px-4">
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-orange-50/40 px-3 py-2.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-orange-50 sm:px-4 sm:py-3 sm:text-sm"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-sm leading-none text-white sm:h-6 sm:w-6 sm:text-lg">
            +
          </span>
          Add New Specification
        </button>
      </div>
    </div>
  );
}

export default ProductSpecificationsField;
