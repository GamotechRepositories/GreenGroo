import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import FarmerSidebar from "./FarmerSidebar";
import FarmerHeader from "./FarmerHeader";
import ManagerBottomNav from "./ManagerBottomNav";
import { FarmerToaster } from "../ui/FarmerToaster";
import { fetchFarmerProfile, selectIsManager } from "../../store/farmerSlice";
import { getLiveAnnouncements, getLiveCalendar } from "../../api/farmerApi";
import RoleAnnouncements from "../RoleAnnouncements";
import "../../styles/farmer.css";

function FarmerLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const token = useSelector((s) => s.farmer.token);
  const isManager = useSelector(selectIsManager);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (token && isManager) dispatch(fetchFarmerProfile());
  }, [dispatch, token, isManager]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!token) {
    return <Navigate to="/manager/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (!isManager) {
    return <Navigate to="/manager/login" replace />;
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
        <main className="farmer-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6 max-lg:pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
          <RoleAnnouncements
            roleKey="farmer_manager"
            load={() => getLiveAnnouncements("farmer_manager")}
            loadCalendar={() => getLiveCalendar("farmer_manager")}
          />
          <Outlet context={{ search, setSearch }} />
        </main>
      </div>
      <ManagerBottomNav />
      <FarmerToaster />
    </div>
  );
}

export default FarmerLayout;
