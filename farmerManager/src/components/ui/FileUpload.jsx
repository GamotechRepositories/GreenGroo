import { useRef, useState } from "react";
import { EXCEL_BTN_PRIMARY, EXCEL_INPUT, EXCEL_PANEL } from "../../utils/excelStyles";

function FileUpload({
  label = "Upload file",
  accept = ".pdf,.jpg,.jpeg,.png",
  onSelect,
  currentFileName = "",
  disabled = false,
  hint = "PDF, JPG or PNG up to 5MB",
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (!file || disabled) return;
    onSelect?.(file);
  };

  return (
    <div>
      {label ? <p className="mb-1 text-xs font-semibold text-[#1F2937]">{label}</p> : null}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`${EXCEL_PANEL} border-dashed px-3 py-5 text-center ${
          dragging ? "border-[#217346] bg-[#F9F9F9]" : ""
        } ${disabled ? "opacity-60" : ""}`}
      >
        <p className="text-xs font-medium text-[#1F2937]">
          {currentFileName || "Drop file here or click to browse"}
        </p>
        <p className="mt-1 text-xs text-[#6B7280]">{hint}</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={`mt-2 ${EXCEL_BTN_PRIMARY} disabled:cursor-not-allowed`}
        >
          {currentFileName ? "Replace file" : "Choose file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}

export default FileUpload;
