import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Loader2,
  MapPin,
  Upload,
  Users,
} from "lucide-react";
import api from "../api/api";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  experience: "",
  education: "",
  currentCompany: "",
  expectedCtc: "",
  noticePeriod: "",
  linkedin: "",
  coverLetter: "",
  resumeUrl: "",
  resumeName: "",
  resumeData: "",
};

function prettyRole(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function Careers() {
  const [params, setParams] = useSearchParams();
  const jobId = params.get("job") || "";
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [fileLabel, setFileLabel] = useState("");

  const selected = useMemo(
    () => vacancies.find((job) => String(job._id) === String(jobId)) || null,
    [vacancies, jobId]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/admin-ops/hr/vacancies/open");
        if (!alive) return;
        setVacancies(res.data?.data || []);
        setError("");
      } catch (err) {
        if (!alive) return;
        setError(err.response?.data?.message || "Could not load open roles");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const openJob = (id) => {
    setSuccess("");
    setError("");
    setForm(emptyForm);
    setFileLabel("");
    setParams(id ? { job: id } : {});
  };

  const onFile = (file) => {
    if (!file) return;
    if (file.size > 1_500_000) {
      setError("Resume file must be under 1.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        resumeName: file.name,
        resumeData: String(reader.result || ""),
      }));
      setFileLabel(file.name);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!selected) return;
    if (!form.email.trim() && !form.phone.trim()) {
      setError("Provide at least one of email or phone.");
      return;
    }
    if (!form.resumeData && !form.resumeUrl.trim()) {
      setError("Upload a resume or provide a resume URL.");
      return;
    }
    setSubmitting(true);
    setSuccess("");
    setError("");
    try {
      await api.post("/api/admin-ops/hr/candidates/apply", {
        ...form,
        vacancyId: selected._id,
        roleKey: selected.roleKey,
      });
      setSuccess("Application submitted. Our HR team will review it shortly.");
      setForm(emptyForm);
      setFileLabel("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="info-page legal-page">
      <section className="page-hero-section px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          {selected ? (
            <button
              type="button"
              onClick={() => openJob("")}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              All open roles
            </button>
          ) : null}
          <h1 className="page-title">{selected ? selected.title : "Careers at GreenGrocc"}</h1>
          <p className="text-text-secondary text-lg max-w-3xl leading-relaxed">
            {selected
              ? "Review the role details and submit your application with your resume."
              : "Browse open roles posted by our HR team and apply with your profile and resume."}
          </p>
        </div>
      </section>

      <section className="px-3 sm:px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {error && !selected ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-20 text-text-muted">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !selected ? (
            jobId && !loading ? (
              <div className="rounded-2xl border border-border-light bg-white px-6 py-16 text-center shadow-sm">
                <p className="text-lg font-semibold text-text-primary">This role is no longer open</p>
                <button
                  type="button"
                  onClick={() => openJob("")}
                  className="mt-4 text-sm font-semibold text-primary hover:underline"
                >
                  Browse other roles
                </button>
              </div>
            ) : vacancies.length === 0 ? (
              <div className="rounded-2xl border border-border-light bg-white px-6 py-16 text-center shadow-sm">
                <Briefcase className="mx-auto h-10 w-10 text-primary/40" />
                <p className="mt-4 text-lg font-semibold text-text-primary">No open roles right now</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Check back soon — new vacancies appear here when HR posts them.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {vacancies.map((job) => (
                  <article
                    key={job._id}
                    className="rounded-2xl border border-border-light bg-white p-5 shadow-sm transition hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-text-primary">{job.title}</h2>
                        <p className="mt-1 text-sm text-text-secondary">
                          {job.roleLabel || prettyRole(job.roleKey)}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-semibold text-primary">
                        Open
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-muted">
                      {job.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {job.openings} opening{job.openings === 1 ? "" : "s"}
                      </span>
                      {job.createdAt ? <span>Posted {formatDate(job.createdAt)}</span> : null}
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text-secondary">
                      {job.description || "No description provided."}
                    </p>
                    <button
                      type="button"
                      onClick={() => openJob(job._id)}
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                    >
                      View & apply
                    </button>
                  </article>
                ))}
              </div>
            )
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <aside className="rounded-2xl border border-border-light bg-white p-5 shadow-sm h-fit">
                <h2 className="text-xl font-bold text-text-primary">{selected.title}</h2>
                <p className="mt-1 text-sm font-medium text-primary">
                  {selected.roleLabel || prettyRole(selected.roleKey)}
                </p>
                <div className="mt-4 space-y-2 text-sm text-text-secondary">
                  {selected.location ? (
                    <p className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {selected.location}
                    </p>
                  ) : null}
                  <p className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    {selected.openings} opening{selected.openings === 1 ? "" : "s"}
                  </p>
                  {selected.createdAt ? <p>Posted {formatDate(selected.createdAt)}</p> : null}
                </div>
                <div className="mt-5 border-t border-border-light pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-text-primary">
                    Role details
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                    {selected.description || "No description provided for this role."}
                  </p>
                </div>
              </aside>

              <form
                onSubmit={submit}
                className="rounded-2xl border border-border-light bg-white p-5 shadow-sm space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Apply for this role</h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Fill in your details and upload your resume. Fields marked * are required.
                  </p>
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    {success}
                  </div>
                ) : null}

                <label className="block text-sm font-semibold text-text-primary">
                  Full name *
                  <input
                    required
                    className="mt-1.5 w-full rounded-xl border border-border-light px-3 py-2.5 text-sm outline-none focus:border-primary"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    Email
                    <input
                      type="email"
                      className="mt-1.5 w-full rounded-xl border border-border-light px-3 py-2.5 text-sm outline-none focus:border-primary"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-text-primary">
                    Phone
                    <input
                      className="mt-1.5 w-full rounded-xl border border-border-light px-3 py-2.5 text-sm outline-none focus:border-primary"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </label>
                </div>
                <p className="text-xs text-text-muted">Provide at least one of email or phone.</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    City
                    <input
                      className="mt-1.5 w-full rounded-xl border border-border-light px-3 py-2.5 text-sm outline-none focus:border-primary"
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-text-primary">
                    Experience
                    <input
                      placeholder="e.g. 2 years"
                      className="mt-1.5 w-full rounded-xl border border-border-light px-3 py-2.5 text-sm outline-none focus:border-primary"
                      value={form.experience}
                      onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
                    />
                  </label>
                </div>

                <label className="block text-sm font-semibold text-text-primary">
                  Address
                  <input
                    className="mt-1.5 w-full rounded-xl border border-border-light px-3 py-2.5 text-sm outline-none focus:border-primary"
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    Education
                    <input
                      className="mt-1.5 w-full rounded-xl border border-border-light px-3 py-2.5 text-sm outline-none focus:border-primary"
                      value={form.education}
                      onChange={(e) => setForm((p) => ({ ...p, education: e.target.value }))}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-text-primary">
                    Current company
                    <input
                      className="mt-1.5 w-full rounded-xl border border-border-light px-3 py-2.5 text-sm outline-none focus:border-primary"
                      value={form.currentCompany}
                      onChange={(e) => setForm((p) => ({ ...p, currentCompany: e.target.value }))}
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    Expected CTC
                    <input
                      className="mt-1.5 w-full rounded-xl border border-border-light px-3 py-2.5 text-sm outline-none focus:border-primary"
                      value={form.expectedCtc}
                      onChange={(e) => setForm((p) => ({ ...p, expectedCtc: e.target.value }))}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-text-primary">
                    Notice period
                    <input
                      className="mt-1.5 w-full rounded-xl border border-border-light px-3 py-2.5 text-sm outline-none focus:border-primary"
                      value={form.noticePeriod}
                      onChange={(e) => setForm((p) => ({ ...p, noticePeriod: e.target.value }))}
                    />
                  </label>
                </div>

                <label className="block text-sm font-semibold text-text-primary">
                  LinkedIn / portfolio URL
                  <input
                    className="mt-1.5 w-full rounded-xl border border-border-light px-3 py-2.5 text-sm outline-none focus:border-primary"
                    value={form.linkedin}
                    onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))}
                  />
                </label>

                <label className="block text-sm font-semibold text-text-primary">
                  Cover letter / why you&apos;re a fit
                  <textarea
                    rows={4}
                    className="mt-1.5 w-full rounded-xl border border-border-light px-3 py-2.5 text-sm outline-none focus:border-primary"
                    value={form.coverLetter}
                    onChange={(e) => setForm((p) => ({ ...p, coverLetter: e.target.value }))}
                  />
                </label>

                <div className="rounded-xl border border-dashed border-primary/40 bg-primary-light/40 p-4">
                  <p className="text-sm font-semibold text-text-primary">Resume *</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Upload PDF/DOC/DOCX/JPG/PNG (max 1.5 MB), or paste a public resume URL.
                  </p>
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border-light bg-white px-3 py-2 text-sm font-semibold text-text-primary hover:border-primary">
                    <Upload className="h-4 w-4 text-primary" />
                    {fileLabel || "Choose file"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => onFile(e.target.files?.[0])}
                    />
                  </label>
                  <label className="mt-3 block text-sm font-semibold text-text-primary">
                    Or resume URL
                    <input
                      className="mt-1.5 w-full rounded-xl border border-border-light bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                      placeholder="https://..."
                      value={form.resumeUrl}
                      onChange={(e) => setForm((p) => ({ ...p, resumeUrl: e.target.value }))}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? "Submitting…" : "Submit application"}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
