import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { logoutFarmer } from "../store/farmerSlice";
import toast from "react-hot-toast";
import { getFarmerProfile } from "../api/farmerApi";
import {
  EXCEL_BTN_DANGER,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../utils/excelStyles";
import LoadingState from "../components/ui/LoadingState";

function ProfilePage() {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getFarmerProfile();
        setProfile(data);
      } catch (err) {
        toast.error(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState rows={6} />;
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Farmer Profile</h1>
          <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>Personal, Farm, and Settlement Account Information.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#217346]">
            Read-Only (Managed by Vendor Manager)
          </span>
          <button type="button" onClick={() => dispatch(logoutFarmer())} className={EXCEL_BTN_DANGER}>
            Logout
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Personal Information</h2>
        <div className="grid gap-3 p-3 sm:grid-cols-2 text-xs">
          <InfoItem label="Farmer Name" value={profile.name} />
          <InfoItem label="Mobile Number" value={profile.mobile} />
          <InfoItem label="Email Address" value={profile.email || "—"} />
          <InfoItem label="Status" value={profile.status || "Active"} badge />
          <InfoItem label="Assigned Manager" value={profile.managerName || "Unassigned"} />
          <InfoItem label="Vendor ID" value={profile.vendorId || "vendor-1"} />
        </div>
      </section>

      {/* Farm Information */}
      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Farm Information</h2>
        <div className="grid gap-3 p-3 sm:grid-cols-2 text-xs">
          <InfoItem label="Farm Name" value={profile.farmName || "—"} />
          <InfoItem label="Farm Location" value={profile.farmLocation || "—"} />
          <InfoItem label="Farm Address" value={profile.farmAddress || "—"} colSpan={2} />
          <InfoItem label="Farm Type" value={profile.farmType || "Organic"} />
          <InfoItem label="Total Farm Area" value={profile.totalFarmArea || profile.farmArea || "—"} />
        </div>
      </section>

      {/* Bank & Settlement Details */}
      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Bank & Settlement Details</h2>
        <div className="grid gap-3 p-3 sm:grid-cols-2 text-xs">
          <InfoItem label="Account Holder" value={profile.bank?.accountHolder || profile.bank?.accountHolderName || profile.name} />
          <InfoItem label="Bank Name" value={profile.bank?.bankName || "—"} />
          <InfoItem label="Account Number" value={profile.bank?.accountNumber || "—"} />
          <InfoItem label="IFSC Code" value={profile.bank?.ifsc || "—"} />
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value, colSpan = 1, badge = false }) {
  return (
    <div className={colSpan === 2 ? "sm:col-span-2" : "sm:col-span-1"}>
      <span className="block font-semibold text-[#6B7280]">{label}</span>
      {badge ? (
        <span className="mt-0.5 inline-block rounded bg-[#E8F5E9] px-2 py-0.5 text-xs font-bold text-[#217346]">
          {value}
        </span>
      ) : (
        <span className="mt-0.5 block font-semibold text-[#1F2937]">{value}</span>
      )}
    </div>
  );
}

export default ProfilePage;
