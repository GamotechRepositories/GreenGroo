import ApplyLeaveSection from "../../components/ApplyLeaveSection";
import { vendorApi } from "../../api/vendorApi";
import { useVendorAuth } from "../../context/VendorAuthContext";

export default function ApplyLeavePage() {
  const { vendor } = useVendorAuth();
  return (
    <ApplyLeaveSection
      title="Apply for leave"
      subtitle="Vendors can request leave with one or more dates."
      applicantName={vendor?.name || vendor?.email || ""}
      applyLeave={(payload) => vendorApi.applyLeave(payload)}
      listMyLeaves={() => vendorApi.myLeaves()}
    />
  );
}
