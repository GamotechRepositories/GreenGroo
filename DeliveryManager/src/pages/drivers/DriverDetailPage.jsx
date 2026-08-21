import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { managerApi } from "../../api/managerApi";
import { PageShell } from "../../components/layout/ManagerLayout";

export default function DriverDetailPage() {
  const { driverId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const loadDriverDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await managerApi.getDriverDetails(driverId);
      if (res.data?.success) {
        setData(res.data.data);
        setError("");
      } else {
        setError(res.data?.message || "Failed to load driver details");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error loading driver details");
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadDriverDetails();
  }, [loadDriverDetails]);

  const handleToggleActive = async () => {
    try {
      setActionLoading(true);
      setActionMessage("");
      const res = await managerApi.toggleRiderActive(driverId);
      if (res.data?.success) {
        setActionMessage(res.data.message || "Driver status updated");
        await loadDriverDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update driver status");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "—";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_) {
      return "—";
    }
  };

  const maskAccountNumber = (accNo) => {
    if (!accNo || typeof accNo !== "string" || accNo.trim().length === 0) {
      return "Not provided";
    }
    const clean = accNo.trim();
    if (clean.length <= 4) return clean;
    const lastFour = clean.slice(-4);
    return `XXXX XXXX ${lastFour}`;
  };

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
          <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <h3 className="text-base font-bold text-rose-800">
            {error || "Driver Not Found"}
          </h3>
          <p className="mt-1 text-xs text-rose-600">
            Could not retrieve details for driver ID: {driverId}
          </p>
          <button
            onClick={() => navigate("/drivers")}
            className="mt-4 inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            ← Back to Approved Drivers
          </button>
        </div>
      </PageShell>
    );
  }

  const {
    driver = {},
    todayPerformance = {},
    wallet = {},
    documents = {},
    selfie = {},
    bankDetails = {},
    todayShifts = [],
    recentShifts = [],
  } = data;

  const isOnline = driver.status === "online";
  const isOnDelivery = driver.status === "on_delivery";
  const isApproved = (driver.verificationStatus || "approved") === "approved";
  const isPending = driver.verificationStatus === "pending";
  const isRejected = driver.verificationStatus === "rejected";

  const docList = [
    { key: "aadhaar", label: "Aadhaar Card", meta: documents.aadhaar },
    { key: "pan", label: "PAN Card", meta: documents.pan },
    { key: "passport", label: "Passport", meta: documents.passport },
    { key: "license", label: "Driving License", meta: documents.license },
    { key: "rc", label: "Vehicle RC", meta: documents.rc },
    { key: "insurance", label: "Vehicle Insurance", meta: documents.insurance },
    { key: "selfie", label: "Selfie Capture", meta: selfie },
  ];

  const hasLocation =
    driver.currentLocation?.lat != null && driver.currentLocation?.lng != null;

  return (
    <PageShell>
      {/* TOP NOTIFICATION BANNER */}
      {actionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage("")}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/drivers")}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition mb-2"
            >
              ← Back to Approved Drivers
            </button>
            <h1 className="text-xl font-black text-slate-900">
              {driver.name || "Delivery Partner"}
            </h1>
            <p className="text-xs font-mono font-medium text-slate-500 mt-0.5">
              📱 {driver.phone || "N/A"} • ID: {driver.id || driverId}
            </p>
          </div>

          {/* STATUS BADGES & ACTIONS */}
          <div className="flex flex-wrap items-center gap-2">
            {/* ONLINE / OFFLINE BADGE */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isOnDelivery
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isOnline
                    ? "bg-emerald-500 animate-pulse"
                    : isOnDelivery
                    ? "bg-sky-500 animate-pulse"
                    : "bg-slate-400"
                }`}
              />
              {isOnDelivery
                ? "ON DELIVERY"
                : isOnline
                ? "ONLINE"
                : (driver.status || "OFFLINE").toUpperCase()}
            </span>

            {/* VERIFICATION STATUS BADGE */}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${
                isApproved
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isPending
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {isApproved ? "✓ Approved" : isPending ? "⏳ Pending" : "✕ Rejected"}
            </span>

            {/* TOGGLE ACTIVE ACTION */}
            <button
              onClick={handleToggleActive}
              disabled={actionLoading}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95 ${
                driver.isActive !== false
                  ? "bg-slate-800 hover:bg-slate-900"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {actionLoading
                ? "Updating…"
                : driver.isActive !== false
                ? "Deactivate Driver"
                : "Activate Driver"}
            </button>
          </div>
        </div>
      </div>

      {/* TODAY'S PERFORMANCE GRID CARD */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Today's Performance
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Today's Earnings
            </p>
            <p className="text-base font-black text-emerald-600 mt-1">
              ₹{todayPerformance.earnings || 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Completed Orders
            </p>
            <p className="text-base font-black text-slate-900 mt-1">
              {todayPerformance.completedOrders || 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Online Time
            </p>
            <p className="text-base font-black text-slate-900 mt-1">
              {todayPerformance.onlineTime || "0h 0m"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Shifts Booked
            </p>
            <p className="text-base font-black text-slate-900 mt-1">
              {todayPerformance.shiftsBooked || 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Completed Shifts
            </p>
            <p className="text-base font-black text-slate-900 mt-1">
              {todayPerformance.completedShifts || 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Status
            </p>
            <p className="text-sm font-bold text-slate-800 capitalize mt-1">
              {driver.status || "offline"}
            </p>
          </div>
        </div>
      </div>

      {/* 2 COLUMNS: OVERVIEW & LOCATION/STORE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* DRIVER OVERVIEW CARD */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Driver Overview</h2>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Driver ID</span>
              <span className="font-mono font-bold text-slate-800">{driver.id || driverId}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Name</span>
              <span className="font-bold text-slate-900">{driver.name || "N/A"}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Mobile Number</span>
              <span className="font-mono font-bold text-slate-800">{driver.phone || "N/A"}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Language</span>
              <span className="font-bold text-slate-800 uppercase">{driver.language || "en"}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Vehicle Type</span>
              <span className="font-bold text-slate-800 capitalize">{driver.vehicleType || "Motorcycle"}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Rating</span>
              <span className="font-bold text-emerald-700">★ {driver.rating ?? 5} ({driver.totalRatingsCount ?? 0} ratings)</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Account Status</span>
              <span className={`font-bold ${driver.isActive !== false ? "text-emerald-600" : "text-rose-600"}`}>
                {driver.isActive !== false ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Onboarding Status</span>
              <span className="font-bold text-slate-800">
                {driver.onboardingComplete ? "Complete" : "In Progress"}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Onboarding Step</span>
              <span className="font-mono font-bold text-slate-700 capitalize">{driver.onboardingStep || "home"}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Joined Date</span>
              <span className="font-medium text-slate-700">{formatDate(driver.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* LOCATION & STORE DETAILS CARD */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Location & Store Details</h2>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">City</span>
              <span className="font-bold text-slate-800">{driver.city || "Pune"}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Area</span>
              <span className="font-bold text-slate-800">{driver.area || "N/A"}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">City ID</span>
              <span className="font-mono font-bold text-slate-700">{driver.cityId || "pune"}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Store / Hub ID</span>
              <span className="font-mono font-bold text-slate-700">{driver.storeId || driver.managerId || "N/A"}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Current GPS Location</span>
              <span className="font-mono font-bold text-slate-800">
                {hasLocation
                  ? `Lat: ${driver.currentLocation.lat.toFixed(6)}, Lng: ${driver.currentLocation.lng.toFixed(6)}`
                  : "Location not available"}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Last Location Update</span>
              <span className="font-medium text-slate-700">
                {formatDate(driver.currentLocation?.updatedAt)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Last Seen</span>
              <span className="font-medium text-slate-700">{formatDate(driver.lastSeenAt)}</span>
            </div>
          </div>

          {hasLocation && (
            <a
              href={`https://www.google.com/maps?q=${driver.currentLocation.lat},${driver.currentLocation.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
            >
              📍 View Current Location on Google Maps ↗
            </a>
          )}
        </div>
      </div>

      {/* 2 COLUMNS: WALLET & BANK DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* WALLET & EARNINGS CARD */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Wallet & Earnings</h2>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-3 flex justify-between items-center">
              <span className="font-medium text-slate-600">Wallet Balance</span>
              <span className="text-base font-black text-emerald-600">
                ₹{Number(wallet.balance || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="font-medium text-slate-600">Today's Earnings</span>
              <span className="text-sm font-bold text-slate-900">
                ₹{Number(wallet.todayEarnings || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="font-medium text-slate-600">Lifetime Earnings</span>
              <span className="text-sm font-bold text-slate-900">
                ₹{Number(wallet.lifetimeEarnings || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* BANK DETAILS CARD */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Bank Details</h2>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Account Holder Name</span>
              <span className="font-bold text-slate-900">
                {bankDetails.accountHolderName || "Not provided"}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Account Number</span>
              <span className="font-mono font-bold text-slate-800">
                {maskAccountNumber(bankDetails.accountNumber)}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">Bank Name</span>
              <span className="font-bold text-slate-800">
                {bankDetails.bankName || "Not provided"}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">IFSC Code</span>
              <span className="font-mono font-bold text-slate-800">
                {bankDetails.ifscCode || "Not provided"}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="font-medium text-slate-500">UPI ID</span>
              <span className="font-mono font-bold text-slate-800">
                {bankDetails.upiId || "Not provided"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DOCUMENTS CARD */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Documents Verification</h2>
          <div className="text-xs font-semibold text-slate-600">
            Liveness Passed:{" "}
            <span className={data.livenessPassed ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
              {data.livenessPassed ? "✓ Yes" : "✕ No"}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-2.5 px-4">Document</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Uploaded / Captured At</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docList.map((doc) => {
                const st = (doc.meta?.status || "pending").toLowerCase();
                const url = doc.meta?.url;
                const isVerified = st === "verified";
                const isUploaded = st === "uploaded" || st === "captured";
                const isRejectedDoc = st === "rejected";

                return (
                  <tr key={doc.key} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{doc.label}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border capitalize ${
                          isVerified
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isUploaded
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : isRejectedDoc
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {st}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {formatDate(doc.meta?.capturedAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          View Document ↗
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SHIFT INFORMATION CARD */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Shift Information & Bookings</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-2.5 px-4">Shift Name</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Time Slot</th>
                <th className="py-2.5 px-4">Booking Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentShifts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                    No shift bookings recorded for this delivery partner.
                  </td>
                </tr>
              ) : (
                recentShifts.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.shiftName || s.shiftType}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{s.dateString}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {s.startTime} - {s.endTime}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          s.bookingStatus === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : s.bookingStatus === "ACTIVE"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : s.bookingStatus === "CANCELLED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {s.bookingStatus || "UPCOMING"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LIVE ACTIVITY CARD */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Live Activity Timeline</h2>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Current Status</span>
            <span className="font-bold text-slate-900 capitalize">{driver.status || "offline"}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Last Status Change</span>
            <span className="font-medium text-slate-700">{formatDate(driver.lastStatusAt)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Last Online At</span>
            <span className="font-medium text-slate-700">{formatDate(driver.lastOnlineAt)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Last Offline At</span>
            <span className="font-medium text-slate-700">{formatDate(driver.lastOfflineAt)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Last Seen At</span>
            <span className="font-medium text-slate-700">{formatDate(driver.lastSeenAt)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Last Order Assigned At</span>
            <span className="font-medium text-slate-700">{formatDate(driver.lastOrderAssignedAt)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Active Order ID</span>
            <span className="font-mono font-bold text-slate-800">
              {driver.activeOrderId ? `ORD_${driver.activeOrderId}` : "No active order"}
            </span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
