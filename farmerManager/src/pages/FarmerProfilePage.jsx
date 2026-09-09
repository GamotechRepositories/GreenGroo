import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { getFarmerProfile, updateFarmerProfile } from "../api/farmerApi";
import { setFarmerProfile } from "../store/farmerSlice";
import ImageUploadField from "../components/ui/ImageUploadField";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import ProfileFlowNav from "../components/profile/ProfileFlowNav";
import { PREFERRED_LANGUAGES } from "../utils/constants";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../utils/excelStyles";

function emptyForm() {
  return {
    profileImage: "",
    name: "",
    village: "",
    taluka: "",
    district: "",
    pincode: "",
    preferredLanguage: "Marathi",
  };
}

function FarmerProfilePage() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await getFarmerProfile();
      setProfile(data);
      dispatch(setFarmerProfile(data));
      setForm({
        profileImage: data.profileImage || "",
        name: data.name || "",
        village: data.address?.village || "",
        taluka: data.address?.taluka || "",
        district: data.address?.district || "",
        pincode: data.address?.pincode || "",
        preferredLanguage: data.preferredLanguage || "Marathi",
      });
    } catch (err) {
      toast.error(err.message || "Failed to load farmer profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 3) next.name = "Farmer name is required";
    if (!form.village.trim()) next.village = "Village is required";
    if (!form.taluka.trim()) next.taluka = "Taluka is required";
    if (!form.district.trim()) next.district = "District is required";
    if (!/^\d{6}$/.test(form.pincode)) next.pincode = "Enter a valid 6-digit pincode";
    if (!form.preferredLanguage) next.preferredLanguage = "Preferred language is required";
    if (!/^[6-9]\d{9}$/.test(String(profile?.mobile || ""))) next.mobile = "Mobile number is invalid";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const data = await updateFarmerProfile({
        name: form.name,
        mobile: profile.mobile,
        village: form.village,
        taluka: form.taluka,
        district: form.district,
        pincode: form.pincode,
        preferredLanguage: form.preferredLanguage,
        profileImage: form.profileImage,
      });
      setProfile(data);
      dispatch(setFarmerProfile(data));
      setEditing(false);
      toast.success("Farmer profile saved");
    } catch (err) {
      toast.error(err.message || "Failed to save farmer profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState rows={8} />;
  if (!profile) return null;

  const farmerId = profile.farmerCode || profile.farmerId || profile.id;
  const kycStatus = profile.kycStatus || "PENDING";
  const bankStatus = profile.bankVerificationStatus || "PENDING";

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Farmer Profile</h1>
          <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>Personal details from your registered farmer account.</p>
          <div className="mt-2">
            <ProfileFlowNav />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!editing ? (
            <>
              <button type="button" className={EXCEL_BTN} onClick={() => setEditing(true)}>
                Edit Profile
              </button>
              <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => setEditing(true)}>
                Update Details
              </button>
            </>
          ) : (
            <button type="button" className={EXCEL_BTN} onClick={() => setEditing(false)}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Profile Details</h2>
          <div className="grid gap-3 p-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {editing ? (
                <ImageUploadField
                  label="Profile Photo"
                  value={form.profileImage}
                  onChange={(value) => setField("profileImage", value)}
                  showPresets={false}
                />
              ) : (
                <div>
                  <p className="mb-1 text-xs font-semibold text-[#6B7280]">Profile Photo</p>
                  {form.profileImage ? (
                    <img src={form.profileImage} alt={form.name} className="h-20 w-20 rounded object-cover border border-[#D4D4D4]" />
                  ) : (
                    <p className="text-xs text-[#6B7280]">No photo uploaded</p>
                  )}
                </div>
              )}
            </div>

            <Field label="Farmer Name *" error={errors.name}>
              {editing ? (
                <input className={EXCEL_INPUT} value={form.name} onChange={(e) => setField("name", e.target.value)} />
              ) : (
                <ReadValue>{profile.name}</ReadValue>
              )}
            </Field>

            <Field label="Farmer ID">
              <ReadValue>{farmerId}</ReadValue>
            </Field>

            <Field label="Mobile Number" error={errors.mobile}>
              <ReadValue>{profile.mobile}</ReadValue>
            </Field>

            <Field label="Preferred Language *" error={errors.preferredLanguage}>
              {editing ? (
                <select
                  className={EXCEL_INPUT}
                  value={form.preferredLanguage}
                  onChange={(e) => setField("preferredLanguage", e.target.value)}
                >
                  {PREFERRED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              ) : (
                <ReadValue>{profile.preferredLanguage || "—"}</ReadValue>
              )}
            </Field>

            <Field label="Village *" error={errors.village}>
              {editing ? (
                <input className={EXCEL_INPUT} value={form.village} onChange={(e) => setField("village", e.target.value)} />
              ) : (
                <ReadValue>{profile.address?.village || "—"}</ReadValue>
              )}
            </Field>

            <Field label="Taluka *" error={errors.taluka}>
              {editing ? (
                <input className={EXCEL_INPUT} value={form.taluka} onChange={(e) => setField("taluka", e.target.value)} />
              ) : (
                <ReadValue>{profile.address?.taluka || "—"}</ReadValue>
              )}
            </Field>

            <Field label="District *" error={errors.district}>
              {editing ? (
                <input className={EXCEL_INPUT} value={form.district} onChange={(e) => setField("district", e.target.value)} />
              ) : (
                <ReadValue>{profile.address?.district || "—"}</ReadValue>
              )}
            </Field>

            <Field label="Pincode *" error={errors.pincode}>
              {editing ? (
                <input
                  className={EXCEL_INPUT}
                  value={form.pincode}
                  maxLength={6}
                  inputMode="numeric"
                  onChange={(e) => setField("pincode", e.target.value.replace(/\D/g, ""))}
                />
              ) : (
                <ReadValue>{profile.address?.pincode || "—"}</ReadValue>
              )}
            </Field>

            <Field label="KYC Status">
              <StatusBadge status={kycStatus} />
            </Field>

            <Field label="Bank Verification Status">
              <StatusBadge status={bankStatus} />
            </Field>
          </div>
        </section>

        {editing ? (
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className={`${EXCEL_BTN_PRIMARY} px-5`}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <Link to="/farmer/farm-profile" className={`${EXCEL_BTN_PRIMARY} inline-block px-4 py-2`}>
            Continue to Farm Profile
          </Link>
        )}
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[#6B7280]">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-[#DC2626]">{error}</p> : null}
    </div>
  );
}

function ReadValue({ children }) {
  return <p className="text-xs font-semibold text-[#1F2937]">{children || "—"}</p>;
}

export default FarmerProfilePage;
