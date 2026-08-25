import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FarmerToaster } from "../components/ui/FarmerToaster";
import {
  EXCEL_BTN_PRIMARY,
  EXCEL_PANEL,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
} from "../utils/excelStyles";
import "../styles/farmer.css";

function FarmerRegistrationSuccessPage() {
  const token = useSelector((s) => s.farmer.token);
  const farmer = useSelector((s) => s.farmer.farmer);

  if (!token || !farmer) {
    return <Navigate to="/farmer/register" replace />;
  }

  const farmerId = farmer.farmerId || farmer.id;

  return (
    <div className="farmer-panel flex min-h-screen items-center justify-center bg-white px-4">
      <div className={`w-full max-w-md ${EXCEL_PANEL} p-5 text-center`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">Registration Success</p>
        <h1 className={`mt-2 ${EXCEL_PAGE_TITLE}`}>Farmer account created</h1>
        <p className={`mt-1 ${EXCEL_PAGE_SUB}`}>
          Welcome, {farmer.name}. Next, complete your farmer profile, farm profile and farm location.
        </p>

        <div className="mt-4 space-y-1 border border-[#D4D4D4] bg-[#F9F9F9] px-3 py-3 text-left text-xs">
          <p>
            <span className="text-[#6B7280]">Farmer ID: </span>
            <span className="font-semibold text-[#1F2937]">{farmerId}</span>
          </p>
          <p>
            <span className="text-[#6B7280]">Farmer Code: </span>
            <span className="font-semibold text-[#1F2937]">{farmer.farmerCode || "—"}</span>
          </p>
          <p>
            <span className="text-[#6B7280]">Mobile: </span>
            <span className="font-semibold text-[#1F2937]">{farmer.mobile}</span>
          </p>
          <p>
            <span className="text-[#6B7280]">Registration: </span>
            <span className="font-semibold text-[#217346]">{farmer.registrationStatus || "REGISTERED"}</span>
          </p>
          <p>
            <span className="text-[#6B7280]">KYC Status: </span>
            <span className="font-semibold text-amber-600">{farmer.kycStatus || "PENDING"}</span>
          </p>
        </div>

        <Link to="/farmer/profile" className={`${EXCEL_BTN_PRIMARY} mt-4 inline-block w-full py-2`}>
          Continue to Farmer Profile
        </Link>
      </div>
      <FarmerToaster />
    </div>
  );
}

export default FarmerRegistrationSuccessPage;
