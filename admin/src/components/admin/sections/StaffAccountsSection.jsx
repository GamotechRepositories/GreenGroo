import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createStaffAccount,
  getStaffAccounts,
  getStaffHierarchy,
} from "../../../api/api";
import AdminAlert from "../AdminAlert";

const EMPTY_FORM = {
  role: "vendor",
  name: "",
  email: "",
  phone: "",
  password: "",
};

const ROLE_OPTIONS = [
  { value: "vendor", label: "Vendor" },
  { value: "segregation_manager", label: "Segregation Manager" },
  { value: "product_manager", label: "Product Manager" },
  { value: "farmer_manager", label: "Farmer Manager" },
];

export default function StaffAccountsSection() {
  const [accounts, setAccounts] = useState([]);
  const [labels, setLabels] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterRole, setFilterRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [hierarchyRes, listRes] = await Promise.all([
        getStaffHierarchy(),
        getStaffAccounts(filterRole ? { role: filterRole } : undefined),
      ]);
      setLabels(hierarchyRes.data?.data?.roleLabels || {});
      setAccounts(listRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load staff accounts");
    } finally {
      setLoading(false);
    }
  }, [filterRole]);

  useEffect(() => {
    load();
  }, [load]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const res = await createStaffAccount(form);
      setMessage(res.data?.message || "Account created");
      setForm({ ...EMPTY_FORM, role: form.role });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCount = useMemo(() => accounts.length, [accounts]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Staff Accounts</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Create logins for Vendor, Segregation Manager, Product Manager, and Farmer Manager.
        </p>
      </div>

      <AdminAlert error={error} success={message} onClear={() => { setError(""); setMessage(""); }} />

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-4 rounded-2xl border border-neutral-200 bg-white p-5 md:grid-cols-2"
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">Role</span>
          <select
            name="role"
            value={form.role}
            onChange={onChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            required
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">Name</span>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">Email</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">Phone</span>
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            placeholder="10-digit mobile"
            required
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="mb-1 block font-medium text-neutral-700">Temporary password</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            minLength={6}
            required
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create login"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <h3 className="font-semibold text-neutral-900">
            Accounts ({filteredCount})
          </h3>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="px-5 py-8 text-sm text-neutral-500">Loading…</p>
        ) : accounts.length === 0 ? (
          <p className="px-5 py-8 text-sm text-neutral-500">No staff accounts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-5 py-3 font-medium text-neutral-900">
                      {account.name}
                    </td>
                    <td className="px-5 py-3">
                      {labels[account.role] || account.role}
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{account.email}</td>
                    <td className="px-5 py-3 text-neutral-600">{account.phone}</td>
                    <td className="px-5 py-3">
                      {account.isActive ? "Active" : "Inactive"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
