import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addBrand, updateBrand } from "../../../api/api";
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
  brandName: "",
  brandImage: "",
  order: 0,
  isActive: true,
  priceRequiresLogin: false,
};

function AddBrandSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const editBrand = location.state?.editBrand;

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (editBrand) {
      setEditingId(editBrand._id);
      setForm({
        brandName: editBrand.brandName,
        brandImage: editBrand.brandImage,
        order: editBrand.order ?? 0,
        isActive: editBrand.isActive,
        priceRequiresLogin: Boolean(editBrand.priceRequiresLogin),
      });
    }
  }, [editBrand]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");
      const payload = {
        brandName: form.brandName,
        brandImage: form.brandImage,
        order: Number(form.order) || 0,
        isActive: form.isActive,
        priceRequiresLogin: form.priceRequiresLogin,
      };

      if (editingId) {
        await updateBrand(editingId, payload);
        setSuccess("Brand updated");
      } else {
        await addBrand(payload);
        setSuccess("Brand added");
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      navigate("/brands/show", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save brand");
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    navigate("/brands/show");
  };

  return (
    <div className="min-w-0">
      <AdminAlert error={error} success={success} onClear={() => setError("")} />

      <form onSubmit={handleSubmit} className={`${cardClass} space-y-4`}>
        <div className={formHeaderClass}>
          <h3 className="font-semibold">
            {editingId ? "Edit Brand" : "Add Brand"}
          </h3>
          {editingId && (
            <button type="button" onClick={handleCancel} className={btnSecondary}>
              Cancel
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Brand name *</label>
            <input
              type="text"
              required
              placeholder="boAt"
              value={form.brandName}
              onChange={(e) =>
                setForm((p) => ({ ...p, brandName: e.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Display order</label>
            <input
              type="number"
              min={0}
              value={form.order}
              onChange={(e) =>
                setForm((p) => ({ ...p, order: e.target.value }))
              }
              className={inputClass}
            />
          </div>
        </div>

        <ImagePicker
          label="Brand logo / image"
          folder={UPLOAD_FOLDERS.BRANDS}
          required
          value={form.brandImage}
          onChange={(url) => setForm((p) => ({ ...p, brandImage: url }))}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm((p) => ({ ...p, isActive: e.target.checked }))
            }
            className="h-4 w-4 accent-primary"
          />
          Active (visible on home page)
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.priceRequiresLogin}
            onChange={(e) =>
              setForm((p) => ({ ...p, priceRequiresLogin: e.target.checked }))
            }
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            <span className="font-medium text-neutral-900">Price login only</span>
            <span className="mt-0.5 block text-xs text-neutral-500">
              Hide this brand&apos;s product prices until the customer logs in
            </span>
          </span>
        </label>

        <button type="submit" className={btnPrimary}>
          {editingId ? "Update Brand" : "Add Brand"}
        </button>
      </form>
    </div>
  );
}

export default AddBrandSection;
