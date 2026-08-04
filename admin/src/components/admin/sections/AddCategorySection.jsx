import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addCategory, updateCategory } from "../../../api/api";
import AdminAlert from "../AdminAlert";
import ImagePicker from "../ImagePicker";
import { UPLOAD_FOLDERS } from "../../../utils/uploadFolders";
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  formHeaderClass,
  inputClass,
  labelClass,
} from "../adminStyles";

const EMPTY_FORM = {
  categoryName: "",
  categoryImage: "",
  isActive: true,
};

function AddCategorySection() {
  const navigate = useNavigate();
  const location = useLocation();
  const editCategory = location.state?.editCategory;

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [subcategories, setSubcategories] = useState([""]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (editCategory) {
      setEditingId(editCategory._id);
      setForm({
        categoryName: editCategory.categoryName,
        categoryImage: editCategory.categoryImage,
        isActive: editCategory.isActive,
      });
      const subs = editCategory.subcategories || [];
      setSubcategories(subs.length > 0 ? subs : [""]);
    }
  }, [editCategory]);

  const updateSubcategory = (index, value) => {
    setSubcategories((prev) =>
      prev.map((item, i) => (i === index ? value : item))
    );
  };

  const addSubcategoryField = () => {
    setSubcategories((prev) => [...prev, ""]);
  };

  const removeSubcategoryField = (index) => {
    setSubcategories((prev) =>
      prev.length === 1 ? [""] : prev.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");
      const payload = {
        categoryName: form.categoryName,
        categoryImage: form.categoryImage,
        subcategories: subcategories.map((s) => s.trim()).filter(Boolean),
        isActive: form.isActive,
      };

      if (editingId) {
        await updateCategory(editingId, payload);
        setSuccess("Category updated");
      } else {
        await addCategory(payload);
        setSuccess("Category added");
      }

      setForm(EMPTY_FORM);
      setSubcategories([""]);
      setEditingId(null);
      navigate("/categories/show", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save category");
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setSubcategories([""]);
    setEditingId(null);
    navigate("/categories/show");
  };

  return (
    <div className="min-w-0">
      <AdminAlert error={error} success={success} onClear={() => setError("")} />

      <form onSubmit={handleSubmit} className={`${cardClass} space-y-4`}>
        <div className={formHeaderClass}>
          <h3 className="font-semibold">
            {editingId ? "Edit Category" : "Add Category"}
          </h3>
          {editingId && (
            <button type="button" onClick={handleCancel} className={btnSecondary}>
              Cancel
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Category name *</label>
            <input
              type="text"
              required
              placeholder="Chargers"
              value={form.categoryName}
              onChange={(e) =>
                setForm((p) => ({ ...p, categoryName: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <ImagePicker
            label="Category image"
            folder={UPLOAD_FOLDERS.CATEGORIES}
            required
            value={form.categoryImage}
            onChange={(url) => setForm((p) => ({ ...p, categoryImage: url }))}
          />
        </div>

        <div>
          <label className={labelClass}>Subcategories</label>
          <div className="space-y-2">
            {subcategories.map((sub, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Subcategory ${index + 1}`}
                  value={sub}
                  onChange={(e) => updateSubcategory(index, e.target.value)}
                  className={inputClass}
                />
                {subcategories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubcategoryField(index)}
                    className="shrink-0 rounded-lg border border-border-light px-3 py-2.5 text-sm text-red-600 transition hover:border-red-300 hover:bg-red-50"
                    aria-label="Remove subcategory"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSubcategoryField}
            className="mt-2 text-sm font-semibold text-accent hover:underline"
          >
            + Add more
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm((p) => ({ ...p, isActive: e.target.checked }))
            }
            className="h-4 w-4 accent-primary"
          />
          Active (visible on website)
        </label>

        <button type="submit" className={btnPrimary}>
          {editingId ? "Update Category" : "Add Category"}
        </button>
      </form>
    </div>
  );
}

export default AddCategorySection;
