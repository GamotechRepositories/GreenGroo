import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { vendorApi } from "../../api/vendorApi";
import CopyId from "../ui/CopyId";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_INPUT, EXCEL_PANEL } from "../../utils/excelStyles";

const STEPS = ["Create batch", "View & select orders", "Assign driver"];

function errMsg(err, fallback) {
  return err?.response?.data?.message || err?.message || fallback;
}

function qtyOf(p) {
  return Number(p.packedQuantity || p.expectedQuantity || p.orderedQuantity || 0);
}

function totals(list) {
  const byUnit = {};
  list.forEach((p) => {
    const unit = p.unit || "Kg";
    byUnit[unit] = (byUnit[unit] || 0) + qtyOf(p);
  });
  return (
    Object.entries(byUnit)
      .filter(([, n]) => n > 0)
      .map(([unit, n]) => `${n.toLocaleString("en-IN")} ${unit}`)
      .join(" + ") || "—"
  );
}

function locationOf(p) {
  const geo = p?.farmGeo || {};
  return geo.farmAddress || p?.farmerLocation || p?.pickupLocation || [geo.village, geo.taluka, geo.district].filter(Boolean).join(", ");
}

async function loadDrivers() {
  const res = await vendorApi.getDrivers();
  return (Array.isArray(res?.data) ? res.data : res?.data?.drivers || [])
    .filter((d) => ["Active", "On Duty", "Available", "On Pickup"].includes(d.status || "Active"))
    .sort((a, b) => (a.activePickups || 0) - (b.activePickups || 0) || String(a.name || "").localeCompare(String(b.name || "")));
}

function StepBar({ step }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-[11px]">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < step ? "done" : n === step ? "current" : "pending";
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                state === "done" ? "bg-[#217346] text-white" : state === "current" ? "border-2 border-[#217346] text-[#217346]" : "border border-gray-300 text-gray-400"
              }`}
            >
              {state === "done" ? "✓" : n}
            </span>
            <span className={`font-semibold ${state === "pending" ? "text-gray-400" : "text-gray-800"}`}>{label}</span>
            {n < STEPS.length ? <span className="text-gray-300">›</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

function DriverPicker({ drivers, loading, value, onChange }) {
  if (loading) return <p className="px-1 py-6 text-xs text-[#6B7280]">Loading drivers…</p>;
  if (!drivers.length) return <p className="px-1 py-6 text-xs text-[#6B7280]">No available drivers.</p>;
  return (
    <div className="max-h-72 overflow-auto border border-gray-100">
      {drivers.map((d) => (
        <label
          key={d.id}
          className={`flex cursor-pointer items-start gap-3 border-b border-[#F3F4F6] px-3 py-2.5 text-xs ${value === d.id ? "bg-[#E8F5E9]" : ""}`}
        >
          <input type="radio" name="batch-driver" checked={value === d.id} onChange={() => onChange(d.id)} />
          <div>
            <p className="font-semibold text-[#1F2937]">{d.name}</p>
            <p className="text-[#6B7280]">
              Mobile {d.mobile || "—"} · Vehicle {d.vehicleNumber || "—"} {d.vehicleType ? `· ${d.vehicleType}` : ""}
            </p>
            <p className="text-[#6B7280]">
              Status {d.status || "Active"} · Active pickups {d.activePickups || 0} · Area {d.assignedArea || "—"}
            </p>
          </div>
        </label>
      ))}
    </div>
  );
}

function OrdersTable({ rows, selected, onToggle, onToggleAll }) {
  const allOn = rows.length > 0 && rows.every((p) => selected?.has(p.id));
  return (
    <div className="max-h-[50vh] overflow-auto border border-gray-100">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#E8F0EA]">
          <tr className="text-left">
            {onToggle ? (
              <th className="w-8 px-2 py-2">
                <input type="checkbox" className="h-3.5 w-3.5 accent-[#217346]" checked={allOn} onChange={onToggleAll} aria-label="Select all" />
              </th>
            ) : null}
            {["Order ID", "Farmer", "Location", "Product", "Qty", "Pickup"].map((h) => (
              <th key={h} className="px-2 py-2 font-semibold text-[#374151]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const on = selected?.has(p.id);
            return (
              <tr
                key={p.id}
                onClick={onToggle ? () => onToggle(p.id) : undefined}
                className={`border-t border-gray-100 ${onToggle ? "cursor-pointer" : ""} ${on ? "bg-[#E8F5E9]" : "hover:bg-[#F9FBF9]"}`}
              >
                {onToggle ? (
                  <td className="px-2 py-1.5">
                    <input type="checkbox" className="h-3.5 w-3.5 accent-[#217346]" checked={Boolean(on)} onChange={() => onToggle(p.id)} onClick={(e) => e.stopPropagation()} />
                  </td>
                ) : null}
                <td className="px-2 py-1.5 font-mono text-[11px] font-semibold text-[#217346]">{p.orderDisplayId || p.orderId}</td>
                <td className="px-2 py-1.5 font-semibold">{p.farmerName || "—"}</td>
                <td className="max-w-[12rem] truncate px-2 py-1.5 text-[#6B7280]" title={locationOf(p)}>{locationOf(p) || "—"}</td>
                <td className="px-2 py-1.5">{[p.productName, p.variety].filter(Boolean).join(" · ") || "—"}</td>
                <td className="px-2 py-1.5">{qtyOf(p) ? `${qtyOf(p).toLocaleString("en-IN")} ${p.unit || "Kg"}` : "—"}</td>
                <td className="px-2 py-1.5">{[p.pickupDate, p.pickupTime].filter(Boolean).join(" · ") || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ReadyBatchFlow({ pickups, selectedIds = [], onClearSelection, onChanged }) {
  const navigate = useNavigate();
  const [wizard, setWizard] = useState(null);
  const [assignFor, setAssignFor] = useState(null);
  const [expanded, setExpanded] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driverId, setDriverId] = useState("");
  const [busy, setBusy] = useState(false);

  const unbatched = useMemo(() => pickups.filter((p) => !p.collectionBatchId), [pickups]);
  const batches = useMemo(() => {
    const map = new Map();
    pickups.forEach((p) => {
      const bid = String(p.collectionBatchId || "").trim();
      if (!bid) return;
      if (!map.has(bid)) map.set(bid, []);
      map.get(bid).push(p);
    });
    return Array.from(map, ([batchId, list]) => ({
      batchId,
      pickups: list,
      farmers: [...new Set(list.map((p) => p.farmerName).filter(Boolean))],
      products: [...new Set(list.map((p) => p.productName).filter(Boolean))],
    }));
  }, [pickups]);

  const wizardRows = useMemo(() => {
    if (!wizard) return [];
    const q = wizard.q.trim().toLowerCase();
    if (!q) return unbatched;
    return unbatched.filter((p) =>
      [p.orderDisplayId, p.orderId, p.farmerName, p.productName, p.variety, locationOf(p)].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [wizard, unbatched]);
  const chosen = wizard ? unbatched.filter((p) => wizard.selected.has(p.id)) : [];

  const fetchDrivers = async () => {
    setDriversLoading(true);
    setDriverId("");
    try {
      const list = await loadDrivers();
      setDrivers(list);
      setDriverId(list[0]?.id || "");
    } catch (err) {
      setDrivers([]);
      toast.error(errMsg(err, "Could not load drivers"));
    } finally {
      setDriversLoading(false);
    }
  };

  const startWizard = async (preselect = []) => {
    setBusy(true);
    try {
      const res = await vendorApi.reservePickupBatchId();
      setWizard({ step: 1, batchId: res?.data?.batchId || "", selected: new Set(preselect), q: "" });
    } catch (err) {
      toast.error(errMsg(err, "Could not create batch"));
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id) =>
    setWizard((w) => {
      const next = new Set(w.selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...w, selected: next };
    });
  const toggleAll = () =>
    setWizard((w) => {
      const allOn = wizardRows.length > 0 && wizardRows.every((p) => w.selected.has(p.id));
      const next = new Set(w.selected);
      wizardRows.forEach((p) => (allOn ? next.delete(p.id) : next.add(p.id)));
      return { ...w, selected: next };
    });

  const driverName = () => drivers.find((d) => d.id === driverId)?.name || "driver";

  const saveBatch = async (withDriver) => {
    if (!chosen.length) return;
    setBusy(true);
    try {
      const res = await vendorApi.createPickupBatch({
        batchId: wizard.batchId,
        pickupIds: chosen.map((p) => p.id),
        driverId: withDriver ? driverId : "",
      });
      const bid = res?.data?.batchId || wizard.batchId;
      toast.success(
        withDriver
          ? `Batch ${bid} created · ${chosen.length} order${chosen.length === 1 ? "" : "s"} assigned to ${driverName()}`
          : `Batch ${bid} created with ${chosen.length} order${chosen.length === 1 ? "" : "s"}`
      );
      setWizard(null);
      onClearSelection?.();
      onChanged?.();
    } catch (err) {
      toast.error(errMsg(err, "Could not create batch"));
    } finally {
      setBusy(false);
    }
  };

  const assignExisting = async () => {
    if (!assignFor || !driverId) return;
    setBusy(true);
    try {
      const res = await vendorApi.assignPickupBatchDriver(assignFor.batchId, driverId);
      const n = res?.data?.assigned || assignFor.pickups.length;
      toast.success(`Batch ${assignFor.batchId} · ${n} order${n === 1 ? "" : "s"} assigned to ${driverName()}`);
      setAssignFor(null);
      onChanged?.();
    } catch (err) {
      toast.error(errMsg(err, "Could not assign driver"));
    } finally {
      setBusy(false);
    }
  };

  const ungroup = async (b) => {
    if (!window.confirm(`Ungroup batch ${b.batchId}? Its ${b.pickups.length} order(s) go back to the ready list.`)) return;
    try {
      await vendorApi.ungroupPickupBatch(b.batchId);
      toast.success(`Batch ${b.batchId} ungrouped`);
      onChanged?.();
    } catch (err) {
      toast.error(errMsg(err, "Could not ungroup batch"));
    }
  };

  return (
    <div className="space-y-3">
      <div className={`${EXCEL_PANEL} flex flex-wrap items-center gap-3 px-3 py-2.5`}>
        <StepBar step={0} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {selectedIds.length ? (
            <>
              <span className="text-xs text-[#6B7280]">{selectedIds.length} selected</span>
              <button type="button" className={`${EXCEL_BTN} !min-h-8 !py-1 !text-xs`} onClick={onClearSelection}>
                Clear
              </button>
              <button type="button" disabled={busy} className={`${EXCEL_BTN_PRIMARY} !min-h-8 !py-1 !text-xs`} onClick={() => startWizard(selectedIds)}>
                Create batch with selected ({selectedIds.length})
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy || !unbatched.length}
              className={`${EXCEL_BTN_PRIMARY} !min-h-8 !py-1 !text-xs disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => startWizard()}
            >
              + Create Batch
            </button>
          )}
        </div>
      </div>

      {batches.length ? (
        <div className={EXCEL_PANEL}>
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-bold text-[#1F2937]">Batches waiting for driver ({batches.length})</p>
          </div>
          <div className="divide-y divide-slate-100">
            {batches.map((b) => (
              <div key={b.batchId} className="px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <CopyId value={b.batchId} textClassName="font-mono text-[13px] font-bold text-[#217346]" />
                  <span className="text-xs font-semibold text-[#1F2937]">
                    {b.pickups.length} order{b.pickups.length === 1 ? "" : "s"} · {totals(b.pickups)}
                  </span>
                  <span className="min-w-0 truncate text-[11px] text-[#6B7280]">
                    {b.farmers.join(", ") || "—"} · {b.products.join(", ") || "—"}
                  </span>
                  <div className="ml-auto flex flex-wrap gap-1.5">
                    <button type="button" className={`${EXCEL_BTN} !min-h-8 !py-1 !text-xs`} onClick={() => setExpanded(expanded === b.batchId ? "" : b.batchId)}>
                      {expanded === b.batchId ? "Hide orders" : "View orders"}
                    </button>
                    <button type="button" className={`${EXCEL_BTN} !min-h-8 !py-1 !text-xs text-rose-700`} onClick={() => ungroup(b)}>
                      Ungroup
                    </button>
                    <button
                      type="button"
                      className={`${EXCEL_BTN_PRIMARY} !min-h-8 !py-1 !text-xs`}
                      onClick={() => {
                        setAssignFor(b);
                        fetchDrivers();
                      }}
                    >
                      Assign Driver
                    </button>
                  </div>
                </div>
                {expanded === b.batchId ? (
                  <div className="mt-2">
                    <OrdersTable rows={b.pickups} />
                    <button
                      type="button"
                      className="mt-1.5 text-[11px] font-semibold text-[#217346]"
                      onClick={() => navigate(`/vendor/pickups/batches/${encodeURIComponent(b.batchId)}`, { state: { batchId: b.batchId, pickups: b.pickups, from: "all" } })}
                    >
                      Open batch page ›
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {wizard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col border border-[#D4D4D4] bg-white">
            <div className="space-y-2 border-b border-[#D4D4D4] px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold">Create Batch</p>
                <CopyId value={wizard.batchId} textClassName="font-mono text-xs font-bold text-[#217346]" />
              </div>
              <StepBar step={wizard.step} />
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
              {wizard.step === 1 ? (
                <div className="space-y-2 py-4 text-center">
                  <p className="text-xs text-[#6B7280]">New batch created</p>
                  <div className="flex justify-center">
                    <CopyId value={wizard.batchId} textClassName="font-mono text-xl font-bold text-[#217346]" />
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Next, view all ready orders and select the ones to put in this batch. {unbatched.length} order{unbatched.length === 1 ? " is" : "s are"} ready.
                  </p>
                </div>
              ) : null}

              {wizard.step === 2 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="search"
                      value={wizard.q}
                      onChange={(e) => setWizard((w) => ({ ...w, q: e.target.value }))}
                      placeholder="Search farmer, order, product, location…"
                      className={`${EXCEL_INPUT} !min-h-9 !py-1.5 !text-xs sm:max-w-xs`}
                    />
                    <span className="ml-auto text-xs font-semibold text-[#1F2937]">
                      {chosen.length} selected · {totals(chosen)}
                    </span>
                  </div>
                  {unbatched.length ? (
                    <OrdersTable rows={wizardRows} selected={wizard.selected} onToggle={toggle} onToggleAll={toggleAll} />
                  ) : (
                    <p className="py-6 text-center text-xs text-[#6B7280]">No ready orders outside a batch.</p>
                  )}
                </div>
              ) : null}

              {wizard.step === 3 ? (
                <div className="space-y-3">
                  <div className="grid gap-2 rounded bg-[#F3F8F4] px-3 py-2 text-xs sm:grid-cols-3">
                    <p>
                      Orders <span className="font-bold">{chosen.length}</span>
                    </p>
                    <p>
                      Total <span className="font-bold">{totals(chosen)}</span>
                    </p>
                    <p className="truncate">
                      Farmers <span className="font-bold">{[...new Set(chosen.map((p) => p.farmerName).filter(Boolean))].join(", ") || "—"}</span>
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-[#374151]">Select driver for this batch</p>
                  <DriverPicker drivers={drivers} loading={driversLoading} value={driverId} onChange={setDriverId} />
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[#E5E7EB] px-4 py-3">
              <button type="button" className={EXCEL_BTN} disabled={busy} onClick={() => setWizard(null)}>
                Cancel
              </button>
              {wizard.step > 1 ? (
                <button type="button" className={EXCEL_BTN} disabled={busy} onClick={() => setWizard((w) => ({ ...w, step: w.step - 1 }))}>
                  Back
                </button>
              ) : null}
              {wizard.step === 1 ? (
                <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => setWizard((w) => ({ ...w, step: 2 }))}>
                  Next: View orders
                </button>
              ) : null}
              {wizard.step === 2 ? (
                <button
                  type="button"
                  disabled={!chosen.length}
                  className={`${EXCEL_BTN_PRIMARY} disabled:cursor-not-allowed disabled:opacity-50`}
                  onClick={() => {
                    setWizard((w) => ({ ...w, step: 3 }));
                    fetchDrivers();
                  }}
                >
                  Next: Assign driver ({chosen.length})
                </button>
              ) : null}
              {wizard.step === 3 ? (
                <>
                  <button type="button" className={EXCEL_BTN} disabled={busy} onClick={() => saveBatch(false)}>
                    Save batch without driver
                  </button>
                  <button type="button" disabled={busy || !driverId} className={EXCEL_BTN_PRIMARY} onClick={() => saveBatch(true)}>
                    {busy ? "Saving…" : "Assign driver & save batch"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {assignFor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-[#D4D4D4] bg-white">
            <div className="border-b border-[#D4D4D4] px-4 py-3">
              <p className="text-sm font-bold">Assign Driver to Batch</p>
              <p className="mt-0.5 text-xs text-[#6B7280]">
                <span className="font-mono font-semibold text-[#217346]">{assignFor.batchId}</span> · {assignFor.pickups.length} order
                {assignFor.pickups.length === 1 ? "" : "s"} · {totals(assignFor.pickups)}
              </p>
            </div>
            <div className="px-4 py-3">
              <DriverPicker drivers={drivers} loading={driversLoading} value={driverId} onChange={setDriverId} />
            </div>
            <div className="flex justify-end gap-2 px-4 py-3">
              <button type="button" className={EXCEL_BTN} disabled={busy} onClick={() => setAssignFor(null)}>
                Cancel
              </button>
              <button type="button" disabled={busy || !driverId} className={EXCEL_BTN_PRIMARY} onClick={assignExisting}>
                {busy ? "Assigning…" : `Assign ${assignFor.pickups.length} order${assignFor.pickups.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
