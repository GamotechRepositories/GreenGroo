import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { confirmFarmLocation, getFarmerProfile, updateFarmLocation } from "../api/farmerApi";
import { setFarmerProfile } from "../store/farmerSlice";
import LoadingState from "../components/ui/LoadingState";
import ProfileFlowNav from "../components/profile/ProfileFlowNav";
import FarmLocationMap from "../components/profile/FarmLocationMap";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../utils/excelStyles";

function FarmLocationPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    village: "",
    taluka: "",
    district: "",
    pincode: "",
    farmAddress: "",
    latitude: null,
    longitude: null,
    confirmed: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const data = await getFarmerProfile();
        dispatch(setFarmerProfile(data));
        const loc = data.farmLocation || {};
        setForm({
          village: loc.village || data.address?.village || "",
          taluka: loc.taluka || data.address?.taluka || "",
          district: loc.district || data.address?.district || "",
          pincode: loc.pincode || data.address?.pincode || "",
          farmAddress: loc.farmAddress || data.farmAddress || "",
          latitude: loc.latitude ?? null,
          longitude: loc.longitude ?? null,
          confirmed: Boolean(loc.confirmed),
        });
      } catch (err) {
        toast.error(err.message || "Failed to load farm location");
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value, confirmed: false }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = (requirePin) => {
    const next = {};
    if (!form.village.trim()) next.village = "Village is required";
    if (!form.taluka.trim()) next.taluka = "Taluka is required";
    if (!form.district.trim()) next.district = "District is required";
    if (!/^\d{6}$/.test(form.pincode)) next.pincode = "Enter a valid 6-digit pincode";
    if (!form.farmAddress.trim()) next.farmAddress = "Farm address is required";
    if (requirePin && (!Number.isFinite(Number(form.latitude)) || !Number.isFinite(Number(form.longitude)))) {
      next.map = "Select the farm pin on the map before confirming";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const locationPayload = () => ({
    village: form.village,
    taluka: form.taluka,
    district: form.district,
    pincode: form.pincode,
    farmAddress: form.farmAddress,
    latitude: form.latitude,
    longitude: form.longitude,
  });

  const onSave = async () => {
    if (!validate(false)) return;
    setSaving(true);
    try {
      const data = await updateFarmLocation(locationPayload());
      dispatch(setFarmerProfile(data));
      setForm((prev) => ({
        ...prev,
        confirmed: Boolean(data.farmLocation?.confirmed),
        latitude: data.farmLocation?.latitude ?? prev.latitude,
        longitude: data.farmLocation?.longitude ?? prev.longitude,
      }));
      toast.success("Farm location saved");
    } catch (err) {
      toast.error(err.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const onConfirm = async () => {
    if (!validate(true)) return;
    setConfirming(true);
    try {
      const data = await confirmFarmLocation(locationPayload());
      dispatch(setFarmerProfile(data));
      toast.success("Farm location confirmed");
      navigate("/farmer/crops");
    } catch (err) {
      toast.error(err.message || "Failed to confirm location");
    } finally {
      setConfirming(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          confirmed: false,
        }));
        setErrors((prev) => ({ ...prev, map: "" }));
        toast.success("Current location placed on the map");
        setLocating(false);
      },
      () => {
        toast.error("Could not read current location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  if (loading) return <LoadingState rows={8} />;

  const pinReady = Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude));

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Farm Location</h1>
        <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>Set and confirm the farm pin linked to your farm profile.</p>
        <div className="mt-2">
          <ProfileFlowNav />
        </div>
      </div>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Address</h2>
        <div className="grid gap-3 p-3 sm:grid-cols-2">
          <TextField label="Village *" value={form.village} error={errors.village} onChange={(v) => setField("village", v)} />
          <TextField label="Taluka *" value={form.taluka} error={errors.taluka} onChange={(v) => setField("taluka", v)} />
          <TextField label="District *" value={form.district} error={errors.district} onChange={(v) => setField("district", v)} />
          <TextField
            label="Pincode *"
            value={form.pincode}
            error={errors.pincode}
            maxLength={6}
            onChange={(v) => setField("pincode", v.replace(/\D/g, ""))}
          />
          <div className="sm:col-span-2">
            <TextField
              label="Farm Address *"
              value={form.farmAddress}
              error={errors.farmAddress}
              onChange={(v) => setField("farmAddress", v)}
            />
          </div>
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
          <span>Farm Location on Map</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
            {form.confirmed ? "Location confirmed" : pinReady ? "Pin placed" : "Pin not set"}
          </span>
        </div>
        <div className="space-y-3 p-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={EXCEL_BTN} onClick={useCurrentLocation} disabled={locating}>
              {locating ? "Locating…" : "Use Current Location"}
            </button>
            <button
              type="button"
              className={EXCEL_BTN}
              onClick={() => toast.success("Tap the map or drag the pin to select the farm location")}
            >
              Select on Map
            </button>
          </div>
          <FarmLocationMap
            latitude={form.latitude}
            longitude={form.longitude}
            onPinChange={({ latitude, longitude }) => {
              setForm((prev) => ({ ...prev, latitude, longitude, confirmed: false }));
              setErrors((prev) => ({ ...prev, map: "" }));
            }}
          />
          {errors.map ? <p className="text-xs text-[#DC2626]">{errors.map}</p> : null}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={EXCEL_BTN} disabled={saving} onClick={onSave}>
          {saving ? "Saving…" : "Save Location"}
        </button>
        <button type="button" className={EXCEL_BTN_PRIMARY} disabled={confirming} onClick={onConfirm}>
          {confirming ? "Confirming…" : "Confirm Farm Location"}
        </button>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, error, maxLength }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold">{label}</label>
      <input className={EXCEL_INPUT} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
      {error ? <p className="mt-1 text-xs text-[#DC2626]">{error}</p> : null}
    </div>
  );
}

export default FarmLocationPage;
