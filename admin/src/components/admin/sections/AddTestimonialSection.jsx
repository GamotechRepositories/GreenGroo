import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addTestimonial, updateTestimonial } from "../../../api/api";
import AdminAlert from "../AdminAlert";
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  formHeaderClass,
  inputClass,
  labelClass,
} from "../adminStyles";

const EMPTY_FORM = {
  text: "",
  name: "",
  role: "",
  order: 0,
  isActive: true,
};

function AddTestimonialSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const editTestimonial = location.state?.editTestimonial;

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (editTestimonial) {
      setEditingId(editTestimonial._id);
      setForm({
        text: editTestimonial.text,
        name: editTestimonial.name,
        role: editTestimonial.role || "",
        order: editTestimonial.order ?? 0,
        isActive: editTestimonial.isActive,
      });
    }
  }, [editTestimonial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");
      const payload = {
        text: form.text,
        name: form.name,
        role: form.role,
        order: Number(form.order) || 0,
        isActive: form.isActive,
      };

      if (editingId) {
        await updateTestimonial(editingId, payload);
        setSuccess("Testimonial updated");
      } else {
        await addTestimonial(payload);
        setSuccess("Testimonial added");
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      navigate("/testimonials/show", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save testimonial");
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    navigate("/testimonials/show");
  };

  return (
    <div className="min-w-0">
      <AdminAlert error={error} success={success} onClear={() => setError("")} />

      <form onSubmit={handleSubmit} className={`${cardClass} space-y-4`}>
        <div className={formHeaderClass}>
          <h3 className="font-semibold">
            {editingId ? "Edit Testimonial" : "Add Testimonial"}
          </h3>
          {editingId && (
            <button type="button" onClick={handleCancel} className={btnSecondary}>
              Cancel
            </button>
          )}
        </div>

        <div>
          <label className={labelClass}>Testimonial text *</label>
          <textarea
            required
            rows={4}
            placeholder="What the client said about BulkMobileMart..."
            value={form.text}
            onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Client name *</label>
            <input
              type="text"
              required
              placeholder="Rajesh Kumar"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Role / location</label>
            <input
              type="text"
              placeholder="Mobile Retailer, Delhi"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Display order</label>
          <input
            type="number"
            min={0}
            value={form.order}
            onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))}
            className={inputClass}
          />
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
          Active (visible on home page)
        </label>

        <button type="submit" className={btnPrimary}>
          {editingId ? "Update Testimonial" : "Add Testimonial"}
        </button>
      </form>
    </div>
  );
}

export default AddTestimonialSection;
