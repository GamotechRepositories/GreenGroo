import { useRef, useState } from "react";

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
      {label ? <p className="mb-1.5 text-sm font-semibold text-[#1F2937]">{label}</p> : null}
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
        className={`rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragging ? "border-[#2E7D32] bg-[#E8F5E9]" : "border-[#E5E7EB] bg-[#FAFAFA]"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <p className="text-sm font-medium text-[#1F2937]">
          {currentFileName || "Drop file here or click to browse"}
        </p>
        <p className="mt-1 text-xs text-[#6B7280]">{hint}</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded-xl bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#256628] disabled:cursor-not-allowed"
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
