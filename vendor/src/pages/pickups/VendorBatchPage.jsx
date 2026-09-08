import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import BatchDetailView from "../../components/pickup/BatchDetailView";
import { usePolling } from "../../hooks/usePolling";

export default function VendorBatchPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

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
        backTo="/vendor/collection-centre"
        backLabel="← Collection Centre"
        onOpenOrder={(p) => navigate(`/vendor/collection-centre/${p.id}`)}
      />
    </>
  );
}
