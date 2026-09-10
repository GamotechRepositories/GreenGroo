import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../../utils/ui';
import { Pill, pretty, HrBackButtons } from './hrShared';

const SECTIONS = [
  {
    id: 'vacancies',
    label: 'Post vacancies',
    text: 'Create and manage open roles',
    icon: Briefcase,
    tone: 'emerald',
  },
  {
    id: 'applied',
    label: 'Applied for role',
    text: 'Review new applications',
    icon: Users,
    tone: 'sky',
  },
  {
    id: 'selected',
    label: 'Selected candidates',
    text: 'Accepted applicants ready to advance',
    icon: UserCheck,
    tone: 'violet',
  },
  {
    id: 'finalize',
    label: 'Finalize candidates',
    text: 'Interview, training, offer decisions',
    icon: ClipboardCheck,
    tone: 'amber',
  },
  {
    id: 'recruited',
    label: 'Recruited candidates',
    text: 'Hired people by vacancy',
    icon: CheckCircle2,
    tone: 'rose',
  },
];

const APP_STATUSES = [
  { value: 'pending', label: 'Pending', tone: 'amber' },
  { value: 'in_review', label: 'In review', tone: 'blue' },
  { value: 'accepted', label: 'Accept', tone: 'green' },
  { value: 'rejected', label: 'Reject', tone: 'rose' },
];

const FINALIZE_STATUSES = [
  { value: 'selected_for_interview', label: 'Selected for interview' },
  { value: 'selected_for_training', label: 'Selected for training' },
  { value: 'selected_for_offer', label: 'Selected for offer' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'cleared', label: 'Cleared to recruit' },
];

function statusTone(status) {
  if (status === 'accepted' || status === 'cleared' || status === 'recruited' || status === 'open') return 'green';
  if (status === 'rejected') return 'rose';
  if (status === 'in_review' || status === 'selected_for_interview') return 'blue';
  if (status === 'on_hold' || status === 'pending') return 'amber';
  if (status === 'selected_for_training' || status === 'selected_for_offer') return 'violet';
  return 'slate';
}

function formatWhen(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

const emptyVacancy = {
  title: '',
  roleKey: 'product_manager',
  openings: 1,
  location: '',
  description: '',
};

const emptyCandidate = {
  name: '',
  email: '',
  phone: '',
  roleKey: 'product_manager',
  vacancyId: '',
  address: '',
  city: '',
  experience: '',
  education: '',
  currentCompany: '',
  expectedCtc: '',
  noticePeriod: '',
  coverLetter: '',
  linkedin: '',
  notes: '',
  resumeUrl: '',
  resumeName: '',
  resumeData: '',
};

export default function HrRecruitmentPage() {
  const [params, setParams] = useSearchParams();
  const section = params.get('section') || '';
  const vacancyId = params.get('vacancy') || '';
  const [vacancies, setVacancies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({ bySection: {}, recruitedByVacancy: {} });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openVacancy, setOpenVacancy] = useState(false);
  const [openCandidate, setOpenCandidate] = useState(false);
  const [vacancyForm, setVacancyForm] = useState(emptyVacancy);
  const [candForm, setCandForm] = useState(emptyCandidate);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [finalizeDraft, setFinalizeDraft] = useState('selected_for_interview');
  const [savingId, setSavingId] = useState('');

  const openSection = (id) => setParams(id ? { section: id } : {});
  const openRecruitedVacancy = (id) => setParams({ section: 'recruited', vacancy: id });

  const load = async () => {
    setLoading(true);
    try {
      const query =
        section && section !== 'vacancies' && section !== 'recruited'
          ? { section }
          : section === 'recruited'
            ? { section: 'recruited', ...(vacancyId ? { vacancyId } : {}) }
            : {};
      const [jobs, people] = await Promise.all([
        opsApi.list('hr/vacancies'),
        opsApi.list('hr/candidates', query),
      ]);
      setVacancies(jobs.data || []);
      setRoles(jobs.roles || []);
      setCandidates(people.data || []);
      setStats(people.stats || { bySection: {}, recruitedByVacancy: {} });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recruitment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [section, vacancyId]);

  const vacancyMap = useMemo(() => {
    const map = new Map();
    vacancies.forEach((job) => map.set(String(job._id), job));
    return map;
  }, [vacancies]);

  const counts = useMemo(() => {
    const by = stats.bySection || {};
    return {
      vacancies: vacancies.filter((v) => v.status === 'open').length,
      applied: by.applied || 0,
      selected: by.selected || 0,
      finalize: by.finalize || 0,
      recruited: by.recruited || 0,
    };
  }, [stats, vacancies]);

  const createVacancy = async (event) => {
    event.preventDefault();
    await opsApi.create('hr/vacancies', vacancyForm);
    setOpenVacancy(false);
    setVacancyForm(emptyVacancy);
    await load();
  };

  const createCandidate = async (event) => {
    event.preventDefault();
    await opsApi.create('hr/candidates', candForm);
    setOpenCandidate(false);
    setCandForm(emptyCandidate);
    await load();
  };

  const openDetail = async (row) => {
    setDetailLoading(true);
    setSelected(row);
    setNoteDraft(row.adminNotes || '');
    setFinalizeDraft(row.finalizeStatus || 'selected_for_interview');
    try {
      const res = await opsApi.get(`hr/candidates/${row._id}`);
      setSelected(res.data || row);
      setNoteDraft((res.data || row).adminNotes || '');
      setFinalizeDraft((res.data || row).finalizeStatus || 'selected_for_interview');
    } catch {
      /* keep list row */
    } finally {
      setDetailLoading(false);
    }
  };

  const saveCandidate = async (id, body) => {
    setSavingId(id);
    try {
      await opsApi.update('hr/candidates', id, body);
      await load();
      if (selected?._id === id) {
        const res = await opsApi.get(`hr/candidates/${id}`);
        setSelected(res.data);
        setNoteDraft(res.data?.adminNotes || '');
        setFinalizeDraft(res.data?.finalizeStatus || 'selected_for_interview');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update candidate');
    } finally {
      setSavingId('');
    }
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
    reader.onload = () =>
      setCandForm((p) => ({ ...p, resumeName: file.name, resumeData: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const sectionMeta = SECTIONS.find((s) => s.id === section);
  const recruitedByVacancy = stats.recruitedByVacancy || {};

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <HrBackButtons>
            {section ? (
              <button
                type="button"
                className={BTN}
                onClick={() => (section === 'recruited' && vacancyId ? openSection('recruited') : openSection(''))}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                {section === 'recruited' && vacancyId ? 'All vacancies' : 'Recruitment home'}
              </button>
            ) : null}
          </HrBackButtons>
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>
            {sectionMeta
              ? section === 'recruited' && vacancyId
                ? vacancyMap.get(vacancyId)?.title || 'Recruited candidates'
                : sectionMeta.label
              : 'Recruitment'}
          </h1>
          <p className={PAGE_SUB}>
            {sectionMeta
              ? sectionMeta.text
              : 'Post vacancies, review applications, select, finalize, and track recruited talent.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} className={BTN}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {(section === 'vacancies' || !section) && (
            <button type="button" onClick={() => setOpenVacancy(true)} className={BTN_PRIMARY}>
              <Plus className="mr-1.5 h-4 w-4" />
              Post vacancy
            </button>
          )}
          {(section === 'applied' || !section) && (
            <button
              type="button"
              onClick={() => setOpenCandidate(true)}
              className={section ? BTN_PRIMARY : BTN}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add candidate
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>
      ) : null}

      {!section ? (
        loading ? (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SECTIONS.map((item) => {
              const Icon = item.icon;
              const count = counts[item.id] ?? 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openSection(item.id)}
                  className={`${PANEL} group p-5 text-left transition hover:border-emerald-300 hover:shadow-md`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <ChevronRight className="mt-1 h-4 w-4 text-slate-300 transition group-hover:text-emerald-600" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{count}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.text}</p>
                </button>
              );
            })}
          </div>
        )
      ) : null}

      {section === 'vacancies' ? (
        <VacanciesView
          loading={loading}
          vacancies={vacancies}
          onToggle={async (job) => {
            await opsApi.update('hr/vacancies', job._id, {
              status: job.status === 'open' ? 'closed' : 'open',
            });
            await load();
          }}
        />
      ) : null}

      {section === 'applied' ? (
        <CandidateList
          loading={loading}
          rows={candidates}
          vacancyMap={vacancyMap}
          empty="No applications yet"
          statusKey="applicationStatus"
          onOpen={openDetail}
          actions={(row) => (
            <div className="flex flex-wrap gap-1">
              {APP_STATUSES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={savingId === row._id}
                  onClick={() =>
                    saveCandidate(row._id, {
                      applicationStatus: opt.value,
                      historyNotes: noteDraft || undefined,
                    })
                  }
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    (row.applicationStatus || 'pending') === opt.value
                      ? opt.value === 'accepted'
                        ? 'bg-emerald-700 text-white'
                        : opt.value === 'rejected'
                          ? 'bg-rose-600 text-white'
                          : opt.value === 'in_review'
                            ? 'bg-sky-600 text-white'
                            : 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        />
      ) : null}

      {section === 'selected' ? (
        <CandidateList
          loading={loading}
          rows={candidates}
          vacancyMap={vacancyMap}
          empty="No selected candidates yet. Accept applications first."
          statusKey="section"
          onOpen={openDetail}
          actions={(row) => (
            <button
              type="button"
              disabled={savingId === row._id}
              className={`${BTN_PRIMARY} h-8 min-h-0 px-3 text-xs`}
              onClick={() =>
                saveCandidate(row._id, {
                  moveTo: 'finalize',
                  historyNotes: 'Moved from selected to finalize',
                })
              }
            >
              Move to finalize
            </button>
          )}
        />
      ) : null}

      {section === 'finalize' ? (
        <CandidateList
          loading={loading}
          rows={candidates}
          vacancyMap={vacancyMap}
          empty="No candidates in finalize yet."
          statusKey="finalizeStatus"
          onOpen={openDetail}
          actions={(row) => (
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={`${INPUT} h-8 min-h-0 max-w-[200px] py-1 text-xs`}
                value={row.finalizeStatus || 'selected_for_interview'}
                onChange={(e) =>
                  saveCandidate(row._id, {
                    finalizeStatus: e.target.value,
                    historyNotes: `Status set to ${pretty(e.target.value)}`,
                  })
                }
              >
                {FINALIZE_STATUSES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={savingId === row._id}
                className={`${BTN_PRIMARY} h-8 min-h-0 px-3 text-xs`}
                onClick={() =>
                  saveCandidate(row._id, {
                    moveTo: 'recruited',
                    historyNotes: 'Marked as recruited',
                  })
                }
              >
                Mark recruited
              </button>
            </div>
          )}
        />
      ) : null}

      {section === 'recruited' && !vacancyId ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex justify-center py-16 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : vacancies.length === 0 ? (
            <div className={`${PANEL} col-span-full px-6 py-12 text-center text-sm text-slate-400`}>
              No vacancies posted yet.
            </div>
          ) : (
            vacancies.map((job) => (
              <RecruitedVacancyCard
                key={job._id}
                job={job}
                hiredCount={recruitedByVacancy[String(job._id)] || 0}
                onOpen={() => openRecruitedVacancy(job._id)}
              />
            ))
          )}
        </div>
      ) : null}

      {section === 'recruited' && vacancyId ? (
        <CandidateList
          loading={loading}
          rows={candidates}
          vacancyMap={vacancyMap}
          empty="No candidates recruited for this vacancy yet."
          statusKey="stage"
          onOpen={openDetail}
          showHistoryPreview
        />
      ) : null}

      {selected ? (
        <CandidateDetailDrawer
          candidate={selected}
          vacancy={selected.vacancy || vacancyMap.get(String(selected.vacancyId))}
          loading={detailLoading}
          noteDraft={noteDraft}
          setNoteDraft={setNoteDraft}
          finalizeDraft={finalizeDraft}
          setFinalizeDraft={setFinalizeDraft}
          saving={savingId === selected._id}
          onClose={() => setSelected(null)}
          onDownloadCv={() => downloadCv(selected)}
          onSaveNotes={() =>
            saveCandidate(selected._id, {
              adminNotes: noteDraft,
              historyNotes: noteDraft,
            })
          }
          onSetApplicationStatus={(status) =>
            saveCandidate(selected._id, {
              applicationStatus: status,
              historyNotes: noteDraft || undefined,
            })
          }
          onMoveFinalize={() =>
            saveCandidate(selected._id, {
              moveTo: 'finalize',
              historyNotes: noteDraft || 'Moved to finalize',
            })
          }
          onSetFinalizeStatus={() =>
            saveCandidate(selected._id, {
              finalizeStatus: finalizeDraft,
              adminNotes: noteDraft,
              historyNotes: noteDraft || `Status: ${pretty(finalizeDraft)}`,
            })
          }
          onRecruit={() =>
            saveCandidate(selected._id, {
              moveTo: 'recruited',
              adminNotes: noteDraft,
              historyNotes: noteDraft || 'Recruited',
            })
          }
        />
      ) : null}

      {openVacancy ? (
        <Modal title="Post vacancy" onClose={() => setOpenVacancy(false)} onSubmit={createVacancy}>
          <label className="block text-xs font-semibold text-slate-600">
            Title
            <input
              required
              className={`${INPUT} mt-1.5`}
              value={vacancyForm.title}
              onChange={(e) => setVacancyForm((p) => ({ ...p, title: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Role
            <select
              className={`${INPUT} mt-1.5`}
              value={vacancyForm.roleKey}
              onChange={(e) => setVacancyForm((p) => ({ ...p, roleKey: e.target.value }))}
            >
              {(roles.length ? roles : [{ value: 'product_manager', label: 'Product Manager' }]).map(
                (role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                )
              )}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Openings
            <input
              type="number"
              min="1"
              className={`${INPUT} mt-1.5`}
              value={vacancyForm.openings}
              onChange={(e) => setVacancyForm((p) => ({ ...p, openings: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Location
            <input
              className={`${INPUT} mt-1.5`}
              value={vacancyForm.location}
              onChange={(e) => setVacancyForm((p) => ({ ...p, location: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Description
            <textarea
              rows={3}
              className={`${INPUT} mt-1.5`}
              value={vacancyForm.description}
              onChange={(e) => setVacancyForm((p) => ({ ...p, description: e.target.value }))}
            />
          </label>
        </Modal>
      ) : null}

      {openCandidate ? (
        <Modal title="Add candidate application" onClose={() => setOpenCandidate(false)} onSubmit={createCandidate}>
          <label className="block text-xs font-semibold text-slate-600">
            Name
            <input
              required
              className={`${INPUT} mt-1.5`}
              value={candForm.name}
              onChange={(e) => setCandForm((p) => ({ ...p, name: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-600">
              Phone
              <input
                className={`${INPUT} mt-1.5`}
                value={candForm.phone}
                onChange={(e) => setCandForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Email
              <input
                className={`${INPUT} mt-1.5`}
                value={candForm.email}
                onChange={(e) => setCandForm((p) => ({ ...p, email: e.target.value }))}
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            Role
            <select
              className={`${INPUT} mt-1.5`}
              value={candForm.roleKey}
              onChange={(e) => setCandForm((p) => ({ ...p, roleKey: e.target.value }))}
            >
              {(roles.length ? roles : [{ value: 'product_manager', label: 'Product Manager' }]).map(
                (role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                )
              )}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Vacancy
            <select
              className={`${INPUT} mt-1.5`}
              value={candForm.vacancyId}
              onChange={(e) => setCandForm((p) => ({ ...p, vacancyId: e.target.value }))}
            >
              <option value="">None</option>
              {vacancies
                .filter((v) => v.status === 'open')
                .map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title}
                  </option>
                ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-600">
              City
              <input
                className={`${INPUT} mt-1.5`}
                value={candForm.city}
                onChange={(e) => setCandForm((p) => ({ ...p, city: e.target.value }))}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Experience
              <input
                className={`${INPUT} mt-1.5`}
                value={candForm.experience}
                onChange={(e) => setCandForm((p) => ({ ...p, experience: e.target.value }))}
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            Address
            <input
              className={`${INPUT} mt-1.5`}
              value={candForm.address}
              onChange={(e) => setCandForm((p) => ({ ...p, address: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-600">
              Education
              <input
                className={`${INPUT} mt-1.5`}
                value={candForm.education}
                onChange={(e) => setCandForm((p) => ({ ...p, education: e.target.value }))}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Current company
              <input
                className={`${INPUT} mt-1.5`}
                value={candForm.currentCompany}
                onChange={(e) => setCandForm((p) => ({ ...p, currentCompany: e.target.value }))}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-slate-600">
              Expected CTC
              <input
                className={`${INPUT} mt-1.5`}
                value={candForm.expectedCtc}
                onChange={(e) => setCandForm((p) => ({ ...p, expectedCtc: e.target.value }))}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Notice period
              <input
                className={`${INPUT} mt-1.5`}
                value={candForm.noticePeriod}
                onChange={(e) => setCandForm((p) => ({ ...p, noticePeriod: e.target.value }))}
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            LinkedIn
            <input
              className={`${INPUT} mt-1.5`}
              value={candForm.linkedin}
              onChange={(e) => setCandForm((p) => ({ ...p, linkedin: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Cover letter / application notes
            <textarea
              rows={3}
              className={`${INPUT} mt-1.5`}
              value={candForm.coverLetter}
              onChange={(e) => setCandForm((p) => ({ ...p, coverLetter: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Resume URL
            <input
              className={`${INPUT} mt-1.5`}
              value={candForm.resumeUrl}
              onChange={(e) => setCandForm((p) => ({ ...p, resumeUrl: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Upload CV
            <input
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg"
              className={`${INPUT} mt-1.5`}
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Internal notes
            <textarea
              rows={2}
              className={`${INPUT} mt-1.5`}
              value={candForm.notes}
              onChange={(e) => setCandForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </label>
        </Modal>
      ) : null}
    </div>
  );
}

function VacanciesView({ loading, vacancies, onToggle }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!vacancies.length) {
    return (
      <div className={`${PANEL} px-6 py-12 text-center text-sm text-slate-400`}>
        No vacancies yet. Post one to get started.
      </div>
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {vacancies.map((job) => (
        <div key={job._id} className={`${PANEL} p-4`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">{job.title}</p>
              <p className="text-xs text-slate-500">
                {pretty(job.roleKey)} · {job.openings} opening(s) · {job.location || '—'}
              </p>
            </div>
            <Pill tone={job.status === 'open' ? 'green' : 'slate'}>{job.status}</Pill>
          </div>
          <p className="mt-2 text-sm text-slate-600">{job.description || 'No description'}</p>
          <button type="button" className={`${BTN} mt-3 text-xs`} onClick={() => onToggle(job)}>
            {job.status === 'open' ? 'Close vacancy' : 'Reopen vacancy'}
          </button>
        </div>
      ))}
    </div>
  );
}

function RecruitedVacancyCard({ job, hiredCount, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${PANEL} group p-5 text-left transition hover:border-emerald-300 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{job.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {pretty(job.roleKey)} · {job.location || 'No location'}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600" />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{hiredCount}</p>
      <p className="text-xs text-slate-400">
        {hiredCount === 1 ? 'recruited candidate' : 'recruited candidates'}
      </p>
    </button>
  );
}

function CandidateList({
  loading,
  rows,
  vacancyMap,
  empty,
  statusKey,
  onOpen,
  actions,
  showHistoryPreview,
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (!rows.length) {
    return <div className={`${PANEL} px-6 py-12 text-center text-sm text-slate-400`}>{empty}</div>;
  }
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const job = vacancyMap.get(String(row.vacancyId));
        const status = row[statusKey] || row.applicationStatus || row.stage || '—';
        return (
          <article key={row._id} className={`${PANEL} p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen(row)}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-slate-900">{row.name}</p>
                  <Pill tone={statusTone(status)}>{pretty(status)}</Pill>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {pretty(row.roleKey)}
                  {job ? ` · ${job.title}` : ''}
                  {row.phone ? ` · ${row.phone}` : ''}
                  {row.email ? ` · ${row.email}` : ''}
                </p>
                {row.experience || row.education ? (
                  <p className="mt-1 text-xs text-slate-400">
                    {[row.experience, row.education].filter(Boolean).join(' · ')}
                  </p>
                ) : null}
                {showHistoryPreview && row.stageHistory?.length ? (
                  <p className="mt-2 text-[11px] text-slate-400">
                    {row.stageHistory.length} stage update{row.stageHistory.length === 1 ? '' : 's'} · last{' '}
                    {formatWhen(row.stageHistory[row.stageHistory.length - 1]?.at)}
                  </p>
                ) : null}
              </button>
              {actions ? <div className="shrink-0">{actions(row)}</div> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CandidateDetailDrawer({
  candidate,
  vacancy,
  loading,
  noteDraft,
  setNoteDraft,
  finalizeDraft,
  setFinalizeDraft,
  saving,
  onClose,
  onDownloadCv,
  onSaveNotes,
  onSetApplicationStatus,
  onMoveFinalize,
  onSetFinalizeStatus,
  onRecruit,
}) {
  const section = candidate.section || 'applied';
  const fields = [
    ['Phone', candidate.phone],
    ['Email', candidate.email],
    ['Role', pretty(candidate.roleKey)],
    ['Vacancy', vacancy?.title || '—'],
    ['City', candidate.city],
    ['Address', candidate.address],
    ['Experience', candidate.experience],
    ['Education', candidate.education],
    ['Current company', candidate.currentCompany],
    ['Expected CTC', candidate.expectedCtc],
    ['Notice period', candidate.noticePeriod],
    ['LinkedIn', candidate.linkedin],
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Candidate profile
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{candidate.name}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Pill tone={statusTone(candidate.applicationStatus || candidate.stage)}>
                {pretty(candidate.applicationStatus || candidate.stage)}
              </Pill>
              <Pill tone="slate">{pretty(section)}</Pill>
              {candidate.finalizeStatus ? (
                <Pill tone={statusTone(candidate.finalizeStatus)}>
                  {pretty(candidate.finalizeStatus)}
                </Pill>
              ) : null}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <section>
                <h3 className="text-sm font-semibold text-slate-900">Application details</h3>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {fields.map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 px-3 py-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {label}
                      </dt>
                      <dd className="mt-0.5 break-words text-sm text-slate-800">{value || '—'}</dd>
                    </div>
                  ))}
                </dl>
                {candidate.coverLetter ? (
                  <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Cover letter
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{candidate.coverLetter}</p>
                  </div>
                ) : null}
                {candidate.notes ? (
                  <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Applicant notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{candidate.notes}</p>
                  </div>
                ) : null}
                <button type="button" className={`${BTN} mt-3 text-xs`} onClick={onDownloadCv}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download CV
                </button>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-900">Admin notes</h3>
                <textarea
                  rows={3}
                  className={`${INPUT} mt-2`}
                  placeholder="Add a note for this candidate…"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                />
                <button
                  type="button"
                  disabled={saving}
                  className={`${BTN} mt-2 text-xs`}
                  onClick={onSaveNotes}
                >
                  Save note
                </button>
              </section>

              {section === 'applied' ? (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900">Application status</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {APP_STATUSES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={saving}
                        onClick={() => onSetApplicationStatus(opt.value)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          (candidate.applicationStatus || 'pending') === opt.value
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              {section === 'selected' ? (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900">Next step</h3>
                  <button
                    type="button"
                    disabled={saving}
                    className={`${BTN_PRIMARY} mt-2`}
                    onClick={onMoveFinalize}
                  >
                    Move to finalize
                  </button>
                </section>
              ) : null}

              {section === 'finalize' ? (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Finalize status</h3>
                  <select
                    className={INPUT}
                    value={finalizeDraft}
                    onChange={(e) => setFinalizeDraft(e.target.value)}
                  >
                    {FINALIZE_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={saving} className={BTN} onClick={onSetFinalizeStatus}>
                      Save status
                    </button>
                    <button type="button" disabled={saving} className={BTN_PRIMARY} onClick={onRecruit}>
                      Mark recruited
                    </button>
                  </div>
                </section>
              ) : null}

              <section>
                <h3 className="text-sm font-semibold text-slate-900">Stage approval history</h3>
                {!candidate.stageHistory?.length ? (
                  <p className="mt-2 text-sm text-slate-400">No stage updates yet.</p>
                ) : (
                  <ol className="mt-3 space-y-3 border-l border-slate-200 pl-4">
                    {[...(candidate.stageHistory || [])]
                      .slice()
                      .reverse()
                      .map((item, index) => (
                        <li key={`${item.at}-${index}`} className="relative">
                          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          <p className="text-sm font-semibold text-slate-800">
                            {item.label || pretty(item.status)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatWhen(item.at)}
                            {item.by ? ` · ${item.by}` : ''}
                            {item.section ? ` · ${pretty(item.section)}` : ''}
                          </p>
                          {item.notes ? (
                            <p className="mt-1 text-xs text-slate-600">{item.notes}</p>
                          ) : null}
                        </li>
                      ))}
                  </ol>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, onSubmit, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
      <form onSubmit={onSubmit} className={`max-h-[90vh] w-full max-w-lg overflow-y-auto ${PANEL} p-5 shadow-xl`}>
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">{children}</div>
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" className={BTN} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={BTN_PRIMARY}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
