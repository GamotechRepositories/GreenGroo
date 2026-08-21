import { useCallback, useEffect, useState } from "react";
import { staffApi } from "../../api/staffApi";
import { PageShell } from "../../components/layout/ProductManagerLayout";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  password: "",
  state: "",
  city: "",
  area: "",
  storeName: "",
};

export default function DeliveryManagersPage() {
  const [form, setForm] = useState(EMPTY);
  const [managers, setManagers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      // Delivery managers live in a separate collection; list via create history isn't available.
      // Keep local success message only after create for now.
      setManagers((prev) => prev);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load");
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
        role: "delivery_manager",
        ...form,
      });
      setMessage(res.data?.message || "Delivery manager created");
      setManagers((prev) => [
        {
          id: res.data.manager?.id,
          name: res.data.manager?.name,
          email: res.data.manager?.email,
          phone: res.data.manager?.phone,
          area: res.data.manager?.area,
        },
        ...prev,
      ]);
      setForm(EMPTY);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create delivery manager");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Delivery Managers"
      subtitle="Create delivery manager logins for store areas"
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
          ["state", "State"],
          ["city", "City"],
          ["area", "Area"],
          ["storeName", "Store name"],
        ].map(([name, label]) => (
          <label key={name} className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">{label}</span>
            <input
              type={name === "password" ? "password" : name === "email" ? "email" : "text"}
              name={name}
              value={form[name]}
              onChange={onChange}
              required={name !== "storeName"}
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
            {submitting ? "Creating…" : "Create delivery manager"}
          </button>
        </div>
      </form>

      {managers.length > 0 ? (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900">Created this session</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {managers.map((m) => (
              <li key={m.id || m.email}>
                {m.name} · {m.email} · {m.area}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </PageShell>
  );
}
