import { useRef, useState } from 'react'
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_BTN_OUTLINE, EXCEL_BTN_PRIMARY, EXCEL_INPUT, EXCEL_PANEL } from './excelStyles'

const PRESET_IMAGES = [
  { name: 'Vegetables', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop' },
  { name: 'Fruits', url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&auto=format&fit=crop' },
  { name: 'Grains', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop' },
  { name: 'Dairy', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop' },
]

export default function FarmerImageUploadField({
  value = '',
  onChange,
  label = 'Product Photo (Camera or Upload)',
  error,
  className = '',
  disabled = false,
}) {
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const [showUrlInput, setShowUrlInput] = useState(false)
  const [customUrl, setCustomUrl] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange?.(reader.result)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleApplyUrl = () => {
    if (customUrl.trim()) {
      onChange?.(customUrl.trim())
      setCustomUrl('')
      setShowUrlInput(false)
    }
  }

  return (
    <div className={className}>
      {label ? (
        <label className="mb-0.5 block text-xs font-semibold text-[#6B7280]">
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
                  e.currentTarget.src = PRESET_IMAGES[0].url
                }}
              />
            </div>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#1F2937] truncate">
                Photo selected
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  className={`${EXCEL_BTN} py-0.5 px-2 text-xs`}
                >
                  📁 Replace
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => cameraInputRef.current?.click()}
                  className={`${EXCEL_BTN} py-0.5 px-2 text-xs`}
                >
                  📷 Camera
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange?.('')}
                  className={`${EXCEL_BTN_DANGER} py-0.5 px-2 text-xs`}
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
                onClick={() => cameraInputRef.current?.click()}
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
                {showUrlInput ? 'Cancel URL' : 'Paste URL'}
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
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#6B7280]">Quick Presets:</span>
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img.name}
                    type="button"
                    onClick={() => onChange?.(img.url)}
                    className="rounded border border-[#D4D4D4] bg-white px-1.5 py-0.5 text-[10px] text-[#374151] hover:bg-[#E5E7EB]"
                  >
                    {img.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
      </div>

      {error ? <p className="mt-0.5 text-xs text-[#DC2626]">{error}</p> : null}
    </div>
  )
}
