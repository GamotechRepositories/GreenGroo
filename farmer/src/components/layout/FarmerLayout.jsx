import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import FarmerSidebar from "./FarmerSidebar";
import FarmerHeader from "./FarmerHeader";
import { FarmerToaster } from "../ui/FarmerToaster";
import { fetchDocuments, fetchFarmerProfile, selectIsVerified } from "../../store/farmerSlice";
import { SELLING_ROUTE_PREFIXES } from "../../utils/constants";
import "../../styles/farmer.css";

function FarmerLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useSelector((s) => s.farmer.token);
  const farmer = useSelector((s) => s.farmer.farmer);
  const isVerified = useSelector(selectIsVerified);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    dispatch(fetchFarmerProfile());
    dispatch(fetchDocuments());
  }, [dispatch, token]);

  useEffect(() => {
    // Documents verification gate disabled
  }, [token, farmer, isVerified, location.pathname, navigate]);

  if (!token) {
    return <Navigate to="/farmer/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="farmer-panel flex min-h-screen bg-white text-[#1F2937]">
      <FarmerSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <FarmerHeader
          onOpenSidebar={() => setMobileOpen(true)}
          searchValue={search}
          onSearchChange={setSearch}
        />
        <main className="farmer-scrollbar flex-1 bg-white p-3 lg:p-4">
          <Outlet context={{ search, setSearch }} />
        </main>
      </div>
      <FarmerToaster />
    </div>
  );
}

export default FarmerLayout;
