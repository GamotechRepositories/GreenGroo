import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import FarmerSidebar from "./FarmerSidebar";
import FarmerHeader from "./FarmerHeader";
import ManagerBottomNav from "./ManagerBottomNav";
import { FarmerToaster } from "../ui/FarmerToaster";
import {
  fetchDocuments,
  fetchFarmerProfile,
  selectIsManager,
} from "../../store/farmerSlice";
import { getLiveAnnouncements } from "../../api/farmerApi";
import RoleAnnouncements from "../RoleAnnouncements";
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
    const isSharedScan = path.startsWith("/farmer/scan");

    if (isManager && !isManagerRoute && !isSharedScan && path !== "/farmer/manager/dashboard") {
      navigate("/farmer/manager/dashboard", { replace: true });
    } else if (!isManager && isManagerRoute && path !== "/farmer/dashboard") {
      navigate("/farmer/dashboard", { replace: true });
    }
  }, [token, role, isManager, location.pathname, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!token) {
    return <Navigate to="/farmer/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return (
    <div className="farmer-panel flex h-dvh overflow-hidden bg-[#f3f6f4] text-slate-900">
      <FarmerSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <FarmerHeader
          onOpenSidebar={() => setMobileOpen(true)}
          searchValue={search}
          onSearchChange={setSearch}
        />
        <main
          className={`farmer-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6 ${
            isManager ? "max-lg:pb-[calc(4.5rem+env(safe-area-inset-bottom))]" : ""
          }`}
        >
          <RoleAnnouncements
            roleKey={isManager ? "farmer_manager" : "farmer"}
            load={() => getLiveAnnouncements(isManager ? "farmer_manager" : "farmer")}
          />
          <Outlet context={{ search, setSearch }} />
        </main>
      </div>
      {isManager ? <ManagerBottomNav /> : null}
      <FarmerToaster />
    </div>
  );
}

export default FarmerLayout;
