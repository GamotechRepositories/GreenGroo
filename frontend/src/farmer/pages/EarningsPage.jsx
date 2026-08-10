import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getEarnings } from "../api/farmerApi";
import StatCard from "../components/ui/StatCard";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function EarningsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setData(await getEarnings());
      } catch (err) {
        toast.error(err.message || "Failed to load earnings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState rows={5} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Earnings</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          View earnings and settlements. Settlement records are read-only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Earnings" value={formatCurrency(data.totalEarnings)} />
        <StatCard title="Available Balance" value={formatCurrency(data.availableBalance)} />
        <StatCard title="Pending Payments" value={formatCurrency(data.pendingPayments)} />
        <StatCard title="This Month" value={formatCurrency(data.thisMonthEarnings)} />
        <StatCard
          title="Last Payment"
          value={formatCurrency(data.lastPayment.amount)}
          hint={new Date(data.lastPayment.date).toLocaleDateString("en-IN")}
        />
      </div>

      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Settlement details</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase text-[#6B7280]">Bank account</dt>
            <dd className="mt-1 text-sm font-semibold">{data.lastPayment.bankAccount}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-[#6B7280]">Settlement date</dt>
            <dd className="mt-1 text-sm font-semibold">{data.lastPayment.settlementDate}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-[#6B7280]">Settlement amount</dt>
            <dd className="mt-1 text-sm font-semibold">
              {formatCurrency(data.lastPayment.amount)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Transaction history</h2>
        <DataTable
          columns={[
            { key: "id", header: "Transaction ID" },
            { key: "orderId", header: "Order ID" },
            {
              key: "amount",
              header: "Amount",
              render: (row) => formatCurrency(row.amount),
            },
            {
              key: "commission",
              header: "Commission",
              render: (row) => formatCurrency(row.commission),
            },
            {
              key: "netEarnings",
              header: "Net Earnings",
              render: (row) => formatCurrency(row.netEarnings),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
            {
              key: "date",
              header: "Date",
              render: (row) => new Date(row.date).toLocaleDateString("en-IN"),
            },
          ]}
          rows={data.transactions}
        />
      </section>
    </div>
  );
}

export default EarningsPage;
