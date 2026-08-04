import { useCallback, useEffect, useRef, useState } from "react";
import {
  addOfferBanner,
  deleteOfferBanner,
  getAllOfferBanners,
  updateOfferBanner,
} from "../../../api/api";
import AdminAlert from "../AdminAlert";
import AdminPagination, { ADMIN_PAGE_SIZE } from "../AdminPagination";
import ImagePicker from "../ImagePicker";
import { IconEdit, IconTrash } from "../AdminIcons";
import { UPLOAD_FOLDERS } from "../../../utils/uploadFolders";
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  iconBtnClass,
  iconBtnDangerClass,
  inputClass,
  labelClass,
} from "../adminStyles";

const DEVICE_LABELS = {
  desktop: "Desktop",
  mobile: "Phone",
};

const DEFAULT_FORM = {
  imageUrl: "",
  title: "Bulk Mobile Accessories at",
  titleHighlight: "Wholesale Prices",
  subtitle:
    "MOQ 10 pieces · Pan-India delivery · Best deals for retailers & distributors",
  linkUrl: "",
  alt: "",
  order: 0,
};

function getBannerDevice(banner) {
  return banner.device === "mobile" ? "mobile" : "desktop";
}

function OfferBannerCard({ banner, onDelete, onDeviceChange, onEdit }) {
  return (
    <div className="w-56 overflow-hidden rounded-xl border border-border-light bg-white shadow-sm sm:w-64">
      <img
        src={banner.imageUrl}
        alt={banner.alt}
        className="block h-28 w-full object-cover"
      />
      <div className="space-y-1 border-t border-border-light p-2">
        <p className="line-clamp-2 text-[10px] font-semibold text-text-primary">
          {banner.title} <span className="text-primary">{banner.titleHighlight}</span>
        </p>
        <p className="line-clamp-2 text-[9px] text-text-secondary">{banner.subtitle}</p>
        <p className="text-[9px] text-text-secondary">
          {DEVICE_LABELS[getBannerDevice(banner)]} · order {banner.order}
        </p>
        <div className="flex items-center gap-1">
          <select
            value={getBannerDevice(banner)}
            onChange={(e) => onDeviceChange(banner._id, e.target.value)}
            className={`${inputClass} min-w-0 flex-1 py-0.5 text-[10px]`}
          >
            <option value="desktop">Desktop</option>
            <option value="mobile">Phone</option>
          </select>
          <button
            type="button"
            onClick={() => onEdit(banner)}
            className={`${iconBtnClass} h-5 w-5 shrink-0`}
            title="Edit offer banner"
            aria-label="Edit offer banner"
          >
            <IconEdit className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(banner._id)}
            className={`${iconBtnDangerClass} h-5 w-5 shrink-0`}
            title="Delete offer banner"
            aria-label="Delete offer banner"
          >
            <IconTrash className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddOfferBannerForm({ deviceType, editingBanner, onCancelEdit, onAdded }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  const isEditing = Boolean(editingBanner);

  useEffect(() => {
    if (editingBanner) {
      setForm({
        imageUrl: editingBanner.imageUrl || "",
        title: editingBanner.title || "",
        titleHighlight: editingBanner.titleHighlight || "",
        subtitle: editingBanner.subtitle || "",
        linkUrl: editingBanner.linkUrl || "",
        alt: editingBanner.alt || "",
        order: editingBanner.order ?? 0,
      });
      setError("");
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [editingBanner]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!form.imageUrl?.trim()) {
      setError("Please upload an offer banner image");
      setSubmitting(false);
      return;
    }

    try {
      if (isEditing) {
        await updateOfferBanner(editingBanner._id, {
          ...form,
          imageUrl: form.imageUrl.trim(),
        });
        setForm(DEFAULT_FORM);
        onAdded(`${DEVICE_LABELS[deviceType]} offer banner updated successfully`);
      } else {
        const { data } = await addOfferBanner({
          ...form,
          imageUrl: form.imageUrl.trim(),
          bannerFor: deviceType,
          device: deviceType,
        });

        const savedDevice = getBannerDevice(data.data);
        if (savedDevice !== deviceType) {
          throw new Error(
            `Banner was saved as ${DEVICE_LABELS[savedDevice]} instead of ${DEVICE_LABELS[deviceType]}.`
          );
        }

        setForm(DEFAULT_FORM);
        onAdded(`${DEVICE_LABELS[deviceType]} offer banner added successfully`);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          `Failed to ${isEditing ? "update" : "add"} offer banner`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`${cardClass} space-y-4`}>
      <h3 className="font-semibold">
        {isEditing ? "Edit" : "Add"} {DEVICE_LABELS[deviceType]} Offer Banner
      </h3>
      <p className="text-xs text-text-secondary">
        Shown below &quot;Why Choose BulkMobileMart?&quot; on the home page.
      </p>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <ImagePicker
        label="Offer banner image"
        folder={UPLOAD_FOLDERS.OFFER_BANNERS}
        required
        value={form.imageUrl}
        onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Highlighted text</label>
          <input
            type="text"
            value={form.titleHighlight}
            onChange={(e) => setForm((prev) => ({ ...prev, titleHighlight: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Subtitle</label>
        <input
          type="text"
          value={form.subtitle}
          onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Link URL (optional)</label>
          <input
            type="url"
            placeholder="https://..."
            value={form.linkUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Display order</label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => setForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={submitting} className={btnPrimary}>
          {submitting
            ? isEditing
              ? "Saving..."
              : "Adding..."
            : isEditing
              ? "Save Changes"
              : `Add ${DEVICE_LABELS[deviceType]} Offer Banner`}
        </button>
        {isEditing ? (
          <button type="button" onClick={onCancelEdit} className={btnSecondary}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function OfferBannerSection() {
  const [desktopBanners, setDesktopBanners] = useState([]);
  const [mobileBanners, setMobileBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingBanner, setEditingBanner] = useState(null);
  const [desktopPage, setDesktopPage] = useState(1);
  const [mobilePage, setMobilePage] = useState(1);
  const [desktopPagination, setDesktopPagination] = useState({
    page: 1,
    limit: ADMIN_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [mobilePagination, setMobilePagination] = useState({
    page: 1,
    limit: ADMIN_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [desktopRes, mobileRes] = await Promise.all([
        getAllOfferBanners({ device: "desktop", page: desktopPage, limit: ADMIN_PAGE_SIZE }),
        getAllOfferBanners({ device: "mobile", page: mobilePage, limit: ADMIN_PAGE_SIZE }),
      ]);

      setDesktopBanners(desktopRes.data.data || []);
      setMobileBanners(mobileRes.data.data || []);
      setDesktopPagination(
        desktopRes.data.pagination || {
          page: desktopPage,
          limit: ADMIN_PAGE_SIZE,
          total: desktopRes.data.data?.length || 0,
          totalPages: 1,
        }
      );
      setMobilePagination(
        mobileRes.data.pagination || {
          page: mobilePage,
          limit: ADMIN_PAGE_SIZE,
          total: mobileRes.data.data?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load offer banners");
    } finally {
      setLoading(false);
    }
  }, [desktopPage, mobilePage]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleDeviceChange = async (id, device) => {
    try {
      setError("");
      setSuccess("");
      await updateOfferBanner(id, { bannerFor: device, device });
      setSuccess(`Offer banner moved to ${DEVICE_LABELS[device]}`);
      fetchBanners();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update offer banner");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this offer banner?")) return;
    try {
      setError("");
      setSuccess("");
      await deleteOfferBanner(id);
      setSuccess("Offer banner deleted");
      fetchBanners();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete offer banner");
    }
  };

  const renderBannerGrid = (items, emptyMessage, pagination, onPageChange) => {
    if (loading) return <p className="text-text-secondary">Loading...</p>;
    if (items.length === 0) {
      return <p className="text-text-secondary">{emptyMessage}</p>;
    }
    return (
      <>
        <div className="flex flex-wrap gap-3">
          {items.map((banner) => (
            <OfferBannerCard
              key={banner._id}
              banner={banner}
              onDelete={handleDelete}
              onDeviceChange={handleDeviceChange}
              onEdit={setEditingBanner}
            />
          ))}
        </div>
        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          loading={loading}
          onPageChange={onPageChange}
        />
      </>
    );
  };

  return (
    <div className="min-w-0">
      <AdminAlert error={error} success={success} onClear={() => setError("")} />

      <div className={`${cardClass} mb-6`}>
        <h2 className="text-lg font-bold text-neutral-900">Offer Banners</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Manage the wholesale offer banner shown after &quot;Why Choose BulkMobileMart?&quot; on
          the website and app home page.
        </p>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <AddOfferBannerForm
          deviceType="desktop"
          editingBanner={
            editingBanner && getBannerDevice(editingBanner) === "desktop" ? editingBanner : null
          }
          onCancelEdit={() => setEditingBanner(null)}
          onAdded={(message) => {
            setEditingBanner(null);
            setSuccess(message);
            fetchBanners();
          }}
        />
        <AddOfferBannerForm
          deviceType="mobile"
          editingBanner={
            editingBanner && getBannerDevice(editingBanner) === "mobile" ? editingBanner : null
          }
          onCancelEdit={() => setEditingBanner(null)}
          onAdded={(message) => {
            setEditingBanner(null);
            setSuccess(message);
            fetchBanners();
          }}
        />
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="mb-3 font-semibold">
            Desktop Offer Banners ({desktopPagination.total})
          </h3>
          {renderBannerGrid(
            desktopBanners,
            "No desktop offer banners yet.",
            desktopPagination,
            setDesktopPage
          )}
        </section>

        <section>
          <h3 className="mb-3 font-semibold">Phone Offer Banners ({mobilePagination.total})</h3>
          {renderBannerGrid(
            mobileBanners,
            "No phone offer banners yet.",
            mobilePagination,
            setMobilePage
          )}
        </section>
      </div>
    </div>
  );
}

export default OfferBannerSection;
