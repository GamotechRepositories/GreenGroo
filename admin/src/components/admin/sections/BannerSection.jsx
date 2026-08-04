import { useCallback, useEffect, useState } from "react";
import {
  addHeroBanner,
  deleteHeroBanner,
  getAllHeroBanners,
  updateHeroBanner,
} from "../../../api/api";
import AdminAlert from "../AdminAlert";
import AdminPagination, { ADMIN_PAGE_SIZE } from "../AdminPagination";
import ImagePicker from "../ImagePicker";
import { IconTrash } from "../AdminIcons";
import { UPLOAD_FOLDERS } from "../../../utils/uploadFolders";
import { btnPrimary, cardClass, iconBtnDangerClass, inputClass, labelClass } from "../adminStyles";

const DEVICE_LABELS = {
  desktop: "Desktop",
  mobile: "Phone",
};

function getBannerDevice(banner) {
  return banner.device === "mobile" ? "mobile" : "desktop";
}

function BannerCard({ banner, onDelete, onDeviceChange }) {
  return (
    <div className="w-44 overflow-hidden rounded-xl border border-border-light bg-white shadow-sm sm:w-52">
      <img
        src={banner.imageUrl}
        alt={banner.alt}
        className="block w-full object-contain"
      />
      <div className="space-y-0.5 border-t border-border-light p-1">
        <p className="truncate text-[10px] font-medium text-text-primary" title={banner.alt}>
          {banner.alt || "Banner"}
        </p>
        <p className="text-[9px] text-text-secondary">
          {DEVICE_LABELS[getBannerDevice(banner)]} · {banner.order}
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
            onClick={() => onDelete(banner._id)}
            className={`${iconBtnDangerClass} h-5 w-5 shrink-0`}
            title="Delete banner"
            aria-label="Delete banner"
          >
            <IconTrash className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddBannerForm({ deviceType, onAdded }) {
  const [form, setForm] = useState({ imageUrl: "", alt: "", order: 0 });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!form.imageUrl?.trim()) {
      setError("Please upload a banner image");
      setSubmitting(false);
      return;
    }

    try {
      const { data } = await addHeroBanner({
        imageUrl: form.imageUrl.trim(),
        alt: form.alt,
        order: form.order,
        bannerFor: deviceType,
        device: deviceType,
      });

      const savedDevice = getBannerDevice(data.data);
      if (savedDevice !== deviceType) {
        throw new Error(
          `Banner was saved as ${DEVICE_LABELS[savedDevice]} instead of ${DEVICE_LABELS[deviceType]}. Restart the backend server and try again.`
        );
      }

      setForm({ imageUrl: "", alt: "", order: 0 });
      onAdded(`${DEVICE_LABELS[deviceType]} banner added successfully`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add banner");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} space-y-4`}>
      <h3 className="font-semibold">Add {DEVICE_LABELS[deviceType]} Banner</h3>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <ImagePicker
        label="Banner image"
        folder={UPLOAD_FOLDERS.HERO_BANNERS}
        required
        value={form.imageUrl}
        onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Alt text</label>
          <input
            type="text"
            placeholder="Banner description"
            value={form.alt}
            onChange={(e) => setForm((p) => ({ ...p, alt: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Display order</label>
          <input
            type="number"
            value={form.order}
            onChange={(e) =>
              setForm((p) => ({ ...p, order: Number(e.target.value) }))
            }
            className={inputClass}
          />
        </div>
      </div>
      <button type="submit" disabled={submitting} className={btnPrimary}>
        {submitting ? "Adding..." : `Add ${DEVICE_LABELS[deviceType]} Banner`}
      </button>
    </form>
  );
}

function BannerSection() {
  const [desktopBanners, setDesktopBanners] = useState([]);
  const [mobileBanners, setMobileBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
        getAllHeroBanners({ device: "desktop", page: desktopPage, limit: ADMIN_PAGE_SIZE }),
        getAllHeroBanners({ device: "mobile", page: mobilePage, limit: ADMIN_PAGE_SIZE }),
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
      setError(err.response?.data?.message || "Failed to load banners");
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
      await updateHeroBanner(id, { bannerFor: device, device });
      setSuccess(`Banner moved to ${DEVICE_LABELS[device]}`);
      fetchBanners();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update banner");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this hero banner?")) return;
    try {
      setError("");
      setSuccess("");
      await deleteHeroBanner(id);
      setSuccess("Banner deleted");
      fetchBanners();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete banner");
    }
  };

  const desktopBannersList = desktopBanners;
  const mobileBannersList = mobileBanners;

  const renderBannerGrid = (items, emptyMessage, pagination, onPageChange) => {
    if (loading) return <p className="text-text-secondary">Loading...</p>;
    if (items.length === 0) {
      return <p className="text-text-secondary">{emptyMessage}</p>;
    }
    return (
      <>
        <div className="flex flex-wrap gap-3">
          {items.map((banner) => (
            <BannerCard
              key={banner._id}
              banner={banner}
              onDelete={handleDelete}
              onDeviceChange={handleDeviceChange}
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

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <AddBannerForm
          deviceType="desktop"
          onAdded={(message) => {
            setSuccess(message);
            fetchBanners();
          }}
        />
        <AddBannerForm
          deviceType="mobile"
          onAdded={(message) => {
            setSuccess(message);
            fetchBanners();
          }}
        />
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="mb-3 font-semibold">Desktop Banners ({desktopPagination.total})</h3>
          {renderBannerGrid(
            desktopBannersList,
            "No desktop banners yet.",
            desktopPagination,
            setDesktopPage
          )}
        </section>

        <section>
          <h3 className="mb-3 font-semibold">Phone Banners ({mobilePagination.total})</h3>
          {renderBannerGrid(
            mobileBannersList,
            "No phone banners yet.",
            mobilePagination,
            setMobilePage
          )}
        </section>
      </div>
    </div>
  );
}

export default BannerSection;
