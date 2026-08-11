import { useCallback, useEffect, useState } from "react";
import { staffApi } from "../../api/staffApi";
import { PageShell } from "../../components/layout/SegregationManagerLayout";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

export default function ProductManagersPage() {
  const [form, setForm] = useState(EMPTY);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await staffApi.list({ role: "product_manager" });
      setAccounts(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load product managers");
    }
  }, []);

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
    setError("");
    setMessage("");
    try {
      const res = await staffApi.create({
        role: "product_manager",
        ...form,
      });
      setMessage(res.data?.message || "Product manager created");
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create product manager");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Product Managers"
      subtitle="Create product manager logins for this segregation center"
    >
      {message ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2"
      >
        {[
          ["name", "Name"],
          ["email", "Email"],
          ["phone", "Phone"],
          ["password", "Password"],
        ].map(([name, label]) => (
          <label key={name} className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">{label}</span>
            <input
              type={name === "password" ? "password" : name === "email" ? "email" : "text"}
              name={name}
              value={form[name]}
              onChange={onChange}
              required
              minLength={name === "password" ? 6 : undefined}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
            />
          </label>
        ))}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-green-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-active disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create product manager"}
          </button>
        </div>
      </form>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900">
          Product managers you created ({accounts.length})
        </h3>
        {accounts.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">None yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {accounts.map((a) => (
              <li key={a.id} className="flex justify-between py-3 text-sm">
                <span className="font-medium text-gray-900">{a.name}</span>
                <span className="text-gray-500">{a.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
