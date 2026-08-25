import { useRef, useState } from "react";
import Modal from "./Modal";
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_OUTLINE,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PANEL,
} from "../../utils/excelStyles";

const PRESET_IMAGES = [
  { name: "Vegetables", url: "/categories/vegetables.webp" },
  { name: "Fruits", url: "/categories/fruits.webp" },
  { name: "Grains", url: "/categories/grocery.webp" },
  { name: "Dairy", url: "/categories/dairy.webp" },
];

function ImageUploadField({
  value = "",
  onChange,
  label = "Product Photo",
  error,
  className = "",
  disabled = false,
  showPresets = true,
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange?.(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const startCamera = async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to native mobile camera file input if WebRTC is not supported
        cameraInputRef.current?.click();
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      setStream(mediaStream);
      setCameraActive(true);

      // Attach stream to video after DOM renders
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((err) => console.log("Video play error:", err));
        }
      }, 100);
    } catch (err) {
      console.warn("WebRTC camera stream error, falling back to file capture:", err);
      setCameraError("Could not access live camera. Triggering camera file upload...");
      // Trigger native camera file picker
      cameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      onChange?.(dataUrl);
    }
    stopCamera();
  };

  const handleApplyUrl = () => {
    if (customUrl.trim()) {
      onChange?.(customUrl.trim());
      setCustomUrl("");
      setShowUrlInput(false);
    }
  };

  return (
    <div className={className}>
      {label ? (
        <label className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">
          {label}
        </label>
      ) : null}

      <div className={`${EXCEL_PANEL} p-2 bg-[#FAFAFA]`}>
        {value ? (
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-[#D4D4D4] bg-white">
              <img
                src={value}
                alt="Product preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/categories/grocery.webp";
                }}
              />
            </div>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-[#1F2937] truncate">
                Photo selected
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  className={`${EXCEL_BTN} py-0.5 px-2 text-[10px]`}
                >
                  📁 Replace
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={startCamera}
                  className={`${EXCEL_BTN} py-0.5 px-2 text-[10px]`}
                >
                  📷 Camera
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange?.("")}
                  className={`${EXCEL_BTN_DANGER} py-0.5 px-2 text-[10px]`}
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                className={`${EXCEL_BTN_PRIMARY} py-1 px-2.5 text-xs flex items-center gap-1`}
              >
                <span>📁</span> Upload Photo
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={startCamera}
                className={`${EXCEL_BTN} py-1 px-2.5 text-xs flex items-center gap-1 bg-white hover:bg-[#F3F4F6]`}
              >
                <span>📷</span> Take Photo
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setShowUrlInput(!showUrlInput)}
                className={`${EXCEL_BTN_OUTLINE} py-1 px-2 text-xs`}
              >
                {showUrlInput ? "Cancel URL" : "Paste URL"}
              </button>
            </div>

            {showUrlInput ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className={`${EXCEL_INPUT} py-0.5 text-xs flex-1`}
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className={`${EXCEL_BTN_PRIMARY} py-0.5 px-2 text-xs`}
                >
                  Set
                </button>
              </div>
            ) : showPresets ? (
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-[#6B7280]">Quick Presets:</span>
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img.name}
                    type="button"
                    onClick={() => onChange?.(img.url)}
                    className="rounded border border-[#D4D4D4] bg-white px-1.5 py-0.5 text-[9px] text-[#374151] hover:bg-[#E5E7EB]"
                  >
                    {img.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-[#6B7280]">JPG or PNG. You can upload or capture from camera.</p>
            )}
          </div>
        )}

        {/* Hidden inputs for file gallery and mobile camera fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Canvas element for capturing webcam frame */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {error ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{error}</p> : null}

      {/* WebRTC Live Camera Capture Modal */}
      <Modal
        open={cameraActive}
        title="📷 Take Product Photo"
        onClose={stopCamera}
        size="md"
        footer={
          <>
            <button
              type="button"
              className={EXCEL_BTN_OUTLINE}
              onClick={stopCamera}
            >
              Cancel
            </button>
            <button
              type="button"
              className={EXCEL_BTN_PRIMARY}
              onClick={capturePhoto}
            >
              📸 Capture & Use
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center space-y-2">
          {cameraError ? (
            <p className="text-xs text-[#DC2626]">{cameraError}</p>
          ) : null}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          </div>
          <p className="text-[11px] text-[#6B7280]">
            Center product in the camera frame and click "Capture & Use"
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default ImageUploadField;
