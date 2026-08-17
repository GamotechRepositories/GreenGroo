import { useState } from "react";
import { Image, HelpCircle, MessageSquarePlus, X, Upload } from "lucide-react";
import { COMMUNITY_CATEGORIES, COMMUNITY_LANGUAGES } from "../../data/farmerCommunityData";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_INPUT, EXCEL_SELECT } from "../../utils/excelStyles";

export default function CreatePostModal({ isOpen, onClose, onSubmitPost }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Ask Expert");
  const [cropTag, setCropTag] = useState("Tomato (टोमॅटो)");
  const [language, setLanguage] = useState("mr");
  const [isQuestion, setIsQuestion] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  if (!isOpen) return null;

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newPost = {
      id: `post-${Date.now()}`,
      author: "You (शेतकरी)",
      authorRole: "Farmer / Member",
      location: "Maharashtra, India",
      authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
      timeAgo: "Just now",
      language,
      category,
      cropTag,
      isQuestion,
      title: title.trim(),
      content: content.trim(),
      image: imageUrl || (imagePreview ? imagePreview : undefined),
      likes: 0,
      commentsCount: 0,
      userLiked: false,
      comments: [],
    };

    onSubmitPost(newPost);
    // Reset form
    setTitle("");
    setContent("");
    setImageUrl("");
    setImagePreview("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-emerald-700 px-4 py-3 text-white">
          <div className="flex items-center gap-2 font-bold text-sm">
            <MessageSquarePlus className="h-5 w-5 text-emerald-200" />
            <span>Create Farmer Post / Ask Question (शेती प्रश्न विचारा)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-emerald-100 hover:bg-emerald-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs text-slate-800">
          {/* Post Type Selector Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsQuestion(true);
                setCategory("Ask Expert");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition ${
                isQuestion
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500/30"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <HelpCircle className="h-4 w-4 text-emerald-700" />
              <span>Ask Agriculture Question (प्रश्न विचारा)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsQuestion(false);
                setCategory("Organic Farming");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition ${
                !isQuestion
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500/30"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Image className="h-4 w-4 text-emerald-700" />
              <span>Share Knowledge & Photos (अनुभव / फोटो)</span>
            </button>
          </div>

          {/* Category & Language Selectors */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Category (प्रवर्ग)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={EXCEL_SELECT}
              >
                {COMMUNITY_CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Crop Tag (पीक)
              </label>
              <input
                type="text"
                value={cropTag}
                onChange={(e) => setCropTag(e.target.value)}
                placeholder="e.g. Tomato, Cotton..."
                className={EXCEL_INPUT}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Language (भाषा)
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={EXCEL_SELECT}
              >
                {COMMUNITY_LANGUAGES.filter((l) => l.code !== "all").map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Title / Summary (शीर्षक / मुख्य प्रश्न) *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isQuestion
                  ? "उदा. टोमॅटो पिकावर करपा आला आहे, काय फवारावे?"
                  : "e.g. Best organic fertilizer results for sugarcane..."
              }
              className={EXCEL_INPUT}
            />
          </div>

          {/* Detailed Content */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Description / Details (सविस्तर माहिती / प्रश्न) *
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="आपल्या पिकाची परिस्थिती, रोग/किडीची लक्षणे किंवा शेती अनुभव येथे लिहा..."
              className={`${EXCEL_INPUT} min-h-[90px] resize-y p-2`}
            />
          </div>

          {/* Image Upload or URL */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Attach Crop Photo (पिकाचा फोटो जोडा)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded border border-dashed border-emerald-600 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">
                <Upload className="h-4 w-4" />
                <span>Upload Crop Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>

              <span className="text-[11px] text-slate-500 text-center">or Image URL:</span>

              <input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePreview(e.target.value);
                }}
                className={`${EXCEL_INPUT} flex-1`}
              />
            </div>

            {imagePreview ? (
              <div className="mt-2 relative h-28 w-full max-w-xs overflow-hidden rounded-lg border border-slate-300 bg-slate-100">
                <img
                  src={imagePreview}
                  alt="Crop preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview("");
                    setImageUrl("");
                  }}
                  className="absolute right-1 top-1 rounded-full bg-slate-900/80 p-1 text-white hover:bg-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className={EXCEL_BTN}>
              Cancel
            </button>
            <button type="submit" className={EXCEL_BTN_PRIMARY}>
              Post to Farmer Community (पोस्ट करा)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
