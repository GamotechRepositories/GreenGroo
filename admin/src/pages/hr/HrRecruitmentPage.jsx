import { useEffect, useState } from 'react';
import { Download, Loader2, Plus, RefreshCw, Star, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';
import { Pill, pretty, HrBackButtons } from './hrShared';

const STAGES = ['applied', 'screening', 'interview', 'shortlisted', 'selected', 'rejected'];

export default function HrRecruitmentPage() {
  const [tab, setTab] = useState('pipeline');
  const [vacancies, setVacancies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stage, setStage] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openVacancy, setOpenVacancy] = useState(false);
  const [openCandidate, setOpenCandidate] = useState(false);
  const [vacancyForm, setVacancyForm] = useState({ title: '', roleKey: 'product_manager', openings: 1, location: '', description: '' });
  const [candForm, setCandForm] = useState({ name: '', email: '', phone: '', roleKey: 'product_manager', vacancyId: '', notes: '', resumeUrl: '', resumeName: '', resumeData: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [jobs, people] = await Promise.all([
        opsApi.list('hr/vacancies'),
        opsApi.list('hr/candidates', { stage }),
      ]);
      setVacancies(jobs.data || []);
      setRoles(jobs.roles || []);
      setCandidates(people.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recruitment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [stage]);

  const createVacancy = async (event) => {
    event.preventDefault();
    await opsApi.create('hr/vacancies', vacancyForm);
    setOpenVacancy(false);
    await load();
  };

  const createCandidate = async (event) => {
    event.preventDefault();
    await opsApi.create('hr/candidates', candForm);
    setOpenCandidate(false);
    await load();
  };

  const move = async (row, next) => {
    await opsApi.update('hr/candidates', row._id, { stage: next });
    await load();
  };

  const rate = async (row, rating) => {
    await opsApi.update('hr/candidates', row._id, { rating });
    await load();
  };

  const downloadCv = async (row) => {
    try {
      const res = await opsApi.get(`hr/candidates/${row._id}/cv`);
      const payload = res.data || {};
      if (payload.url) {
        window.open(payload.url, '_blank');
        return;
      }
      if (payload.data) {
        const link = document.createElement('a');
        link.href = payload.data;
        link.download = payload.name || `${row.name}-cv`;
        link.click();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No CV available');
    }
  };

  const onFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCandForm((p) => ({ ...p, resumeName: file.name, resumeData: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <HrBackButtons />
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>Recruitment</h1>
          <p className={PAGE_SUB}>Post vacancies by role, screen, interview, shortlist, rate, and download CVs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} className={BTN}><RefreshCw className="mr-1.5 h-4 w-4" />Refresh</button>
          <button type="button" onClick={() => setOpenVacancy(true)} className={BTN}>Post vacancy</button>
          <button type="button" onClick={() => setOpenCandidate(true)} className={BTN_PRIMARY}><Plus className="mr-1.5 h-4 w-4" />Add candidate</button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

      <div className="flex rounded-xl border border-slate-200 bg-white p-1">
        {[{ id: 'pipeline', label: 'Pipeline' }, { id: 'vacancies', label: 'Vacancies' }].map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === item.id ? 'bg-emerald-700 text-white' : 'text-slate-600'}`}>{item.label}</button>
        ))}
      </div>

      {tab === 'vacancies' ? (
        <div className="grid gap-3 md:grid-cols-2">
          {vacancies.map((job) => (
            <div key={job._id} className={`${PANEL} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-xs text-slate-500">{pretty(job.roleKey)} · {job.openings} opening(s) · {job.location || '—'}</p>
                </div>
                <Pill tone={job.status === 'open' ? 'green' : 'slate'}>{job.status}</Pill>
              </div>
              <p className="mt-2 text-sm text-slate-600">{job.description || 'No description'}</p>
              <button
                type="button"
                className={`${BTN} mt-3 text-xs`}
                onClick={async () => {
                  await opsApi.update('hr/vacancies', job._id, { status: job.status === 'open' ? 'closed' : 'open' });
                  await load();
                }}
              >
                {job.status === 'open' ? 'Close' : 'Reopen'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <>
          <select className={`${INPUT} max-w-[180px]`} value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="all">All stages</option>
            {STAGES.map((item) => <option key={item} value={item}>{pretty(item)}</option>)}
          </select>
          <div className={PANEL}>
            {loading ? (
              <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#F2F2F2]">
                    <tr>{['Candidate', 'Role', 'Stage', 'Rating', ''].map((h) => <th key={h || 'a'} className={TH}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {candidates.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-400">No candidates</td></tr>
                    ) : candidates.map((row) => (
                      <tr key={row._id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2.5">
                          <p className="font-semibold">{row.name}</p>
                          <p className="text-[11px] text-slate-400">{row.phone} {row.email}</p>
                        </td>
                        <td className="px-3 py-2.5 text-xs">{pretty(row.roleKey)}</td>
                        <td className="px-3 py-2.5">
                          <select className={`${INPUT} max-w-[150px]`} value={row.stage} onChange={(e) => move(row, e.target.value)}>
                            {STAGES.map((item) => <option key={item} value={item}>{pretty(item)}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button key={n} type="button" onClick={() => rate(row, n)} className={n <= Number(row.rating || 0) ? 'text-amber-500' : 'text-slate-300'}>
                                <Star className="h-3.5 w-3.5" fill={n <= Number(row.rating || 0) ? 'currentColor' : 'none'} />
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button type="button" className={`${BTN} h-8 min-h-0 px-2.5 text-xs`} onClick={() => downloadCv(row)}>
                            <Download className="mr-1 h-3.5 w-3.5" /> CV
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {openVacancy ? (
        <Modal title="Post vacancy" onClose={() => setOpenVacancy(false)} onSubmit={createVacancy}>
          <label className="block text-xs font-semibold text-slate-600">Title<input required className={`${INPUT} mt-1.5`} value={vacancyForm.title} onChange={(e) => setVacancyForm((p) => ({ ...p, title: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">Role
            <select className={`${INPUT} mt-1.5`} value={vacancyForm.roleKey} onChange={(e) => setVacancyForm((p) => ({ ...p, roleKey: e.target.value }))}>
              {(roles.length ? roles : [{ value: 'product_manager', label: 'Product Manager' }]).map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Openings<input type="number" min="1" className={`${INPUT} mt-1.5`} value={vacancyForm.openings} onChange={(e) => setVacancyForm((p) => ({ ...p, openings: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">Location<input className={`${INPUT} mt-1.5`} value={vacancyForm.location} onChange={(e) => setVacancyForm((p) => ({ ...p, location: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">Description<textarea rows={3} className={`${INPUT} mt-1.5`} value={vacancyForm.description} onChange={(e) => setVacancyForm((p) => ({ ...p, description: e.target.value }))} /></label>
        </Modal>
      ) : null}

      {openCandidate ? (
        <Modal title="Add candidate" onClose={() => setOpenCandidate(false)} onSubmit={createCandidate}>
          <label className="block text-xs font-semibold text-slate-600">Name<input required className={`${INPUT} mt-1.5`} value={candForm.name} onChange={(e) => setCandForm((p) => ({ ...p, name: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">Phone<input className={`${INPUT} mt-1.5`} value={candForm.phone} onChange={(e) => setCandForm((p) => ({ ...p, phone: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">Email<input className={`${INPUT} mt-1.5`} value={candForm.email} onChange={(e) => setCandForm((p) => ({ ...p, email: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">Role
            <select className={`${INPUT} mt-1.5`} value={candForm.roleKey} onChange={(e) => setCandForm((p) => ({ ...p, roleKey: e.target.value }))}>
              {(roles.length ? roles : [{ value: 'product_manager', label: 'Product Manager' }]).map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Vacancy
            <select className={`${INPUT} mt-1.5`} value={candForm.vacancyId} onChange={(e) => setCandForm((p) => ({ ...p, vacancyId: e.target.value }))}>
              <option value="">None</option>
              {vacancies.filter((v) => v.status === 'open').map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Resume URL<input className={`${INPUT} mt-1.5`} value={candForm.resumeUrl} onChange={(e) => setCandForm((p) => ({ ...p, resumeUrl: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">Upload CV<input type="file" accept=".pdf,.doc,.docx,.png,.jpg" className={`${INPUT} mt-1.5`} onChange={(e) => onFile(e.target.files?.[0])} /></label>
          <label className="block text-xs font-semibold text-slate-600">Notes<textarea rows={2} className={`${INPUT} mt-1.5`} value={candForm.notes} onChange={(e) => setCandForm((p) => ({ ...p, notes: e.target.value }))} /></label>
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({ title, onClose, onSubmit, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={onSubmit} className={`max-h-[90vh] w-full max-w-lg overflow-y-auto ${PANEL} p-5`}>
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={BTN} onClick={onClose}>Cancel</button>
          <button type="submit" className={BTN_PRIMARY}>Save</button>
        </div>
      </form>
    </div>
  );
}
