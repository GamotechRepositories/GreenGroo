import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import FarmerSidebar from "./FarmerSidebar";
import FarmerHeader from "./FarmerHeader";
import { FarmerToaster } from "../ui/FarmerToaster";
import {
  fetchDocuments,
  fetchFarmerProfile,
  selectIsManager,
} from "../../store/farmerSlice";
import "../../styles/farmer.css";

function FarmerLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useSelector((s) => s.farmer.token);
  const role = useSelector((s) => s.farmer.role);
  const isManager = useSelector(selectIsManager);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    if (!isManager) {
      dispatch(fetchFarmerProfile());
      dispatch(fetchDocuments());
    }
  }, [dispatch, token, isManager]);

  useEffect(() => {
    if (!token) return;
    const path = location.pathname;
    const isManagerRoute = path.startsWith("/farmer/manager");

    if (isManager && !isManagerRoute && path !== "/farmer/manager/dashboard") {
      navigate("/farmer/manager/dashboard", { replace: true });
    } else if (!isManager && isManagerRoute && path !== "/farmer/dashboard") {
      navigate("/farmer/dashboard", { replace: true });
    }
  }, [token, role, isManager, location.pathname, navigate]);

  if (!token) {
    return <Navigate to="/farmer/login" replace />;
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
