import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import BatchDetailView from "../../components/pickup/BatchDetailView";
import { usePolling } from "../../hooks/usePolling";

function backMeta(from) {
  if (from === "all") return { to: "/vendor/pickups/all", label: "← All Pickups" };
  if (from === "incoming") return { to: "/vendor/pickups/incoming", label: "← Incoming Pickups" };
  return { to: "/vendor/pickups/centre", label: "← Pickups at Centre" };
}

export default function VendorBatchPage() {
  const { batchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const back = backMeta(location.state?.from);

  usePolling(() => {
    vendorApi
      .getBatch(batchId)
      .then((r) => {
        setData(r.data);
        setError("");
      })
      .catch((err) => setError(err?.response?.data?.message || "Batch not found"));
  }, [batchId], 5000);

  if (!data && !error) return <p className="p-6 text-xs text-gray-400">Loading…</p>;
  if (!data) return <p className="p-6 text-xs text-red-500">{error}</p>;

  return (
    <>
      {error ? <div className="mx-6 mt-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div> : null}
      <BatchDetailView
        data={data}
        backTo={back.to}
        backLabel={back.label}
        onOpenOrder={(p) => navigate(`/vendor/collection-centre/${p.id}`)}
      />
    </>
  );
}
