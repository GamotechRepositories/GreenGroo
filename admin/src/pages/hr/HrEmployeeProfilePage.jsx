import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Award,
  ChevronRight,
  Loader2,
  Plus,
  Star,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import opsApi from '../../api/opsApi';
import {
  BTN,
  BTN_PRIMARY,
  INPUT,
  PAGE_KICKER,
  PAGE_SUB,
  PAGE_TITLE,
  PANEL,
  TH,
} from '../../utils/ui';
import { HrBackButtons, inr, Pill, pretty } from './hrShared';

const APPRAISAL_CYCLES = [
  'Annual Appraisal',
  'Mid-Year Review',
  'Probation Clearance',
  'Merit / Out-of-turn',
  'Market Adjustment',
  'Promotion Hike',
  'Other',
];

export default function HrEmployeeProfilePage() {
  const { type, id } = useParams();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Modals for career actions
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showIncrModal, setShowIncrModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Action form states
  const [promoForm, setPromoForm] = useState({
    newDesignation: '',
    newDepartment: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    reason: '',
    approvedBy: 'Admin HR',
    status: 'effective',
  });

  const [incrForm, setIncrForm] = useState({
    previousSalary: 0,
    newSalary: 0,
    hikePercentage: 10,
    effectiveDate: new Date().toISOString().slice(0, 10),
    cycle: 'Annual Appraisal',
    reason: '',
    approvedBy: 'Admin HR',
    status: 'processed',
  });

  const [reviewForm, setReviewForm] = useState({
    reviewPeriod: `${new Date().getFullYear()} Annual Review`,
    rating: 4.5,
    achievements: '',
    improvementAreas: '',
    feedback: '',
    reviewedBy: 'HR Appraiser',
    reviewDate: new Date().toISOString().slice(0, 10),
    status: 'finalized',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await opsApi.get(`hr/people/${type}/${id}`);
      const payload = res.data || {};
      setData(payload);
      const person = payload.person || {};
      setProfile({
        monthlySalary: person.monthlySalary || '',
        department: person.department || '',
        joiningDate: person.joiningDate || '',
        bankAccount: person.bankAccount || '',
        ifsc: person.ifsc || '',
        upi: person.upi || '',
        workNotes: person.workNotes || '',
      });

      // Preset forms for this employee
      setPromoForm((f) => ({
        ...f,
        newDesignation: person.designation || '',
        newDepartment: person.department || '',
      }));

      const curSal = Number(person.monthlySalary || 0);
      setIncrForm((f) => ({
        ...f,
        previousSalary: curSal,
        newSalary: Math.round(curSal * 1.1),
        hikePercentage: 10,
      }));

      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [type, id]);

  const save = async (event) => {
    event.preventDefault();
    if (!data?.person) return;
    setSaving(true);
    try {
      await opsApi.create('hr/employment', {
        employeeId: data.person.id,
        employeeType: data.person.employeeType,
        name: data.person.name,
        role: data.person.role,
        ...profile,
        monthlySalary: Number(profile.monthlySalary || 0),
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  // Submit Promotion for this person
  const handleLogPromotion = async (e) => {
    e.preventDefault();
    if (!data?.person) return;
    if (!promoForm.newDesignation.trim()) {
      alert('Please enter new designation');
      return;
    }
    setModalSubmitting(true);
    try {
      await opsApi.create('hr/promotions', {
        employeeId: data.person.id,
        employeeType: data.person.employeeType,
        name: data.person.name,
        previousRole: data.person.role || '',
        newRole: data.person.role || '',
        previousDesignation: data.person.designation || data.person.role || '',
        newDesignation: promoForm.newDesignation.trim(),
        previousDepartment: data.person.department || '',
        newDepartment: promoForm.newDepartment.trim(),
        effectiveDate: promoForm.effectiveDate,
        reason: promoForm.reason.trim(),
        approvedBy: promoForm.approvedBy.trim(),
        status: promoForm.status,
      });
      setShowPromoModal(false);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not record promotion');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Submit Increment for this person
  const handleAddIncrement = async (e) => {
    e.preventDefault();
    if (!data?.person) return;
    if (Number(incrForm.newSalary) <= 0) {
      alert('New monthly salary must be greater than 0');
      return;
    }
    setModalSubmitting(true);
    try {
      await opsApi.create('hr/increments', {
        employeeId: data.person.id,
        employeeType: data.person.employeeType,
        name: data.person.name,
        previousSalary: Number(incrForm.previousSalary || 0),
        newSalary: Number(incrForm.newSalary),
        effectiveDate: incrForm.effectiveDate,
        cycle: incrForm.cycle,
        reason: incrForm.reason.trim(),
        approvedBy: incrForm.approvedBy.trim(),
        status: incrForm.status,
      });
      setShowIncrModal(false);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not record increment');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Submit Review for this person
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!data?.person) return;
    setModalSubmitting(true);
    try {
      await opsApi.create('hr/performance', {
        employeeId: data.person.id,
        employeeType: data.person.employeeType,
        name: data.person.name,
        reviewPeriod: reviewForm.reviewPeriod.trim(),
        rating: Number(reviewForm.rating),
        achievements: reviewForm.achievements.trim(),
        improvementAreas: reviewForm.improvementAreas.trim(),
        feedback: reviewForm.feedback.trim(),
        reviewedBy: reviewForm.reviewedBy.trim(),
        reviewDate: reviewForm.reviewDate,
        status: reviewForm.status,
      });
      setShowReviewModal(false);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not record review');
    } finally {
      setModalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <HrBackButtons />
        <div className="flex justify-center py-20 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
    );
  }
  if (!data?.person) {
    return (
      <div>
        <HrBackButtons />
        <p className="text-sm text-rose-600">{error || 'Employee not found'}</p>
      </div>
    );
  }

  const person = data.person;
  const promotions = data.promotions || [];
  const increments = data.increments || [];
  const performanceLogs = data.performanceLogs || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <HrBackButtons>
            <Link
              to={`/hr-management/employees?role=${encodeURIComponent(person.roleKey || '')}`}
              className={BTN}
            >
              Back to {pretty(person.roleKey)} list
            </Link>
          </HrBackButtons>
          <p className={PAGE_KICKER}>Employee profile</p>
          <h1 className={PAGE_TITLE}>{person.name}</h1>
          <p className={PAGE_SUB}>
            {person.designation || person.role} · {person.department || 'Operations'} ·{' '}
            {person.phone || '—'} · {person.email || '—'}
          </p>
        </div>

        {/* Quick action buttons on profile */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPromoModal(true)}
            className={`${BTN_PRIMARY} bg-emerald-600 hover:bg-emerald-700 text-xs py-1.5`}
          >
            <TrendingUp className="mr-1 h-3.5 w-3.5" />
            Log Promotion
          </button>
          <button
            type="button"
            onClick={() => setShowIncrModal(true)}
            className={`${BTN_PRIMARY} bg-sky-600 hover:bg-sky-700 text-xs py-1.5`}
          >
            <Wallet className="mr-1 h-3.5 w-3.5" />
            Add Increment
          </button>
          <button
            type="button"
            onClick={() => setShowReviewModal(true)}
            className={`${BTN_PRIMARY} bg-violet-600 hover:bg-violet-700 text-xs py-1.5`}
          >
            <Award className="mr-1 h-3.5 w-3.5" />
            Add Review
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column: Employment Details Form */}
        <form onSubmit={save} className={`${PANEL} space-y-3 p-4 lg:col-span-1 h-fit`}>
          <div className="flex items-center justify-between border-b pb-2">
            <p className="text-sm font-semibold text-slate-800">Employment Details</p>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {inr(profile.monthlySalary || 0)} / mo
            </span>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            Department
            <input
              className={`${INPUT} mt-1.5`}
              value={profile.department}
              onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Monthly salary (₹)
            <input
              type="number"
              min="0"
              className={`${INPUT} mt-1.5 font-bold text-slate-900`}
              value={profile.monthlySalary}
              onChange={(e) => setProfile((p) => ({ ...p, monthlySalary: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Joining date
            <input
              type="date"
              className={`${INPUT} mt-1.5`}
              value={profile.joiningDate}
              onChange={(e) => setProfile((p) => ({ ...p, joiningDate: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Bank account
            <input
              className={`${INPUT} mt-1.5`}
              value={profile.bankAccount}
              onChange={(e) => setProfile((p) => ({ ...p, bankAccount: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            IFSC
            <input
              className={`${INPUT} mt-1.5`}
              value={profile.ifsc}
              onChange={(e) => setProfile((p) => ({ ...p, ifsc: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            UPI
            <input
              className={`${INPUT} mt-1.5`}
              value={profile.upi}
              onChange={(e) => setProfile((p) => ({ ...p, upi: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            Notes
            <textarea
              rows={3}
              className={`${INPUT} mt-1.5`}
              value={profile.workNotes}
              onChange={(e) => setProfile((p) => ({ ...p, workNotes: e.target.value }))}
            />
          </label>
          <button type="submit" disabled={saving} className={BTN_PRIMARY}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>

        {/* Right column: Career History & Logs */}
        <div className="space-y-4 lg:col-span-2">
          {/* Promotions History */}
          <div className={PANEL}>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-900">Promotions & Role Upgrades</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPromoModal(true)}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                + Log Promotion
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F8F9FA]">
                  <tr>
                    <th className={TH}>New Designation</th>
                    <th className={TH}>Department</th>
                    <th className={TH}>Effective Date</th>
                    <th className={TH}>Reason</th>
                    <th className={TH}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!promotions.length ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-5 text-center text-xs text-slate-400">
                        No promotions logged for this employee yet.
                      </td>
                    </tr>
                  ) : (
                    promotions.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-xs font-semibold text-emerald-800">
                          {row.previousDesignation ? (
                            <span className="flex items-center gap-1 text-slate-600">
                              <span className="line-through text-slate-400">{row.previousDesignation}</span>
                              <ChevronRight className="h-3 w-3 text-slate-400" />
                              <span className="font-bold text-emerald-700">{row.newDesignation}</span>
                            </span>
                          ) : (
                            row.newDesignation
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">{row.newDepartment || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">{row.effectiveDate || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">{row.reason || '—'}</td>
                        <td className="px-4 py-2.5 text-xs">
                          <Pill tone={row.status === 'effective' || row.status === 'approved' ? 'green' : 'amber'}>
                            {row.status}
                          </Pill>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Increments History */}
          <div className={PANEL}>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-semibold text-slate-900">Salary Revisions & Increments</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIncrModal(true)}
                className="text-xs font-semibold text-sky-700 hover:underline"
              >
                + Add Increment
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F8F9FA]">
                  <tr>
                    <th className={TH}>Cycle</th>
                    <th className={TH}>Old Salary</th>
                    <th className={TH}>New Salary</th>
                    <th className={TH}>Hike Amount (%)</th>
                    <th className={TH}>Effective Date</th>
                    <th className={TH}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!increments.length ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-5 text-center text-xs text-slate-400">
                        No increments logged for this employee yet.
                      </td>
                    </tr>
                  ) : (
                    increments.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-800">{row.cycle || 'Appraisal'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{inr(row.previousSalary)}</td>
                        <td className="px-4 py-2.5 text-xs font-bold text-slate-900">{inr(row.newSalary)}</td>
                        <td className="px-4 py-2.5 text-xs">
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +{inr(row.incrementAmount)} ({row.incrementPercentage > 0 ? `+${row.incrementPercentage}%` : '0%'})
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">{row.effectiveDate || '—'}</td>
                        <td className="px-4 py-2.5 text-xs">
                          <Pill tone={row.status === 'processed' || row.status === 'approved' ? 'green' : 'amber'}>
                            {row.status}
                          </Pill>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Reviews */}
          <div className={PANEL}>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-semibold text-slate-900">Performance Appraisals</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="text-xs font-semibold text-violet-700 hover:underline"
              >
                + Record Review
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {!performanceLogs.length ? (
                <div className="px-4 py-5 text-center text-xs text-slate-400">
                  No performance reviews logged for this employee yet.
                </div>
              ) : (
                performanceLogs.map((row) => (
                  <div key={row._id} className="p-3.5 space-y-2 hover:bg-slate-50/70">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{row.reviewPeriod}</span>
                        <Pill tone={row.status === 'finalized' ? 'green' : 'blue'}>{row.status}</Pill>
                        <span className="text-[11px] text-slate-400">({row.reviewDate})</span>
                      </div>
                      <div className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900 border border-amber-200">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        {Number(row.rating).toFixed(1)} / 5.0
                      </div>
                    </div>
                    {row.achievements ? (
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Achievements: </span>
                        {row.achievements}
                      </p>
                    ) : null}
                    {row.feedback ? (
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Feedback: </span>
                        {row.feedback}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Standard Operational Sections */}
          <Section title="Leave" rows={data.leaves} columns={['leaveType', 'fromDate', 'toDate', 'status']} />
          <Section title="Attendance" rows={data.attendance} columns={['date', 'clockIn', 'clockOut']} dateCols />
          <Section title="Payroll" rows={data.payroll} columns={['month', 'gross', 'net', 'status']} moneyCols={['gross', 'net']} />
          <Section title="Shifts" rows={data.shifts} columns={['date', 'shiftName', 'startTime', 'endTime']} />
          <Section title="Meetings" rows={data.meetings} columns={['link', 'meetingId', 'password', 'note']} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QUICK MODAL 1: Promotion */}
      {/* ========================================================================= */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">Log Promotion: {person.name}</h3>
              <button type="button" onClick={() => setShowPromoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleLogPromotion} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Designation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Operations Executive"
                  className={INPUT}
                  value={promoForm.newDesignation}
                  onChange={(e) => setPromoForm((f) => ({ ...f, newDesignation: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Department</label>
                <input
                  type="text"
                  className={INPUT}
                  value={promoForm.newDepartment}
                  onChange={(e) => setPromoForm((f) => ({ ...f, newDepartment: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Date *</label>
                <input
                  type="date"
                  required
                  className={INPUT}
                  value={promoForm.effectiveDate}
                  onChange={(e) => setPromoForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Justification</label>
                <textarea
                  rows={2}
                  className={INPUT}
                  value={promoForm.reason}
                  onChange={(e) => setPromoForm((f) => ({ ...f, reason: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowPromoModal(false)} className={BTN}>
                  Cancel
                </button>
                <button type="submit" disabled={modalSubmitting} className={`${BTN_PRIMARY} bg-emerald-600 hover:bg-emerald-700`}>
                  {modalSubmitting ? 'Saving…' : 'Save Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK MODAL 2: Increment */}
      {/* ========================================================================= */}
      {showIncrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">Record Increment: {person.name}</h3>
              <button type="button" onClick={() => setShowIncrModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddIncrement} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Salary</label>
                  <input type="text" readOnly className={`${INPUT} bg-slate-50`} value={inr(incrForm.previousSalary)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hike %</label>
                  <input
                    type="number"
                    step="0.5"
                    className={INPUT}
                    value={incrForm.hikePercentage}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      const prev = Number(incrForm.previousSalary || 0);
                      setIncrForm((f) => ({ ...f, hikePercentage: p, newSalary: Math.round(prev * (1 + p / 100)) }));
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Monthly Salary (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className={`${INPUT} font-bold text-emerald-800`}
                  value={incrForm.newSalary}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    const prev = Number(incrForm.previousSalary || 0);
                    const p = prev > 0 ? Number((((n - prev) / prev) * 100).toFixed(1)) : 0;
                    setIncrForm((f) => ({ ...f, newSalary: n, hikePercentage: p }));
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Appraisal Cycle</label>
                  <select
                    className={INPUT}
                    value={incrForm.cycle}
                    onChange={(e) => setIncrForm((f) => ({ ...f, cycle: e.target.value }))}
                  >
                    {APPRAISAL_CYCLES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Date *</label>
                  <input
                    type="date"
                    required
                    className={INPUT}
                    value={incrForm.effectiveDate}
                    onChange={(e) => setIncrForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Notes</label>
                <textarea
                  rows={2}
                  className={INPUT}
                  value={incrForm.reason}
                  onChange={(e) => setIncrForm((f) => ({ ...f, reason: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowIncrModal(false)} className={BTN}>
                  Cancel
                </button>
                <button type="submit" disabled={modalSubmitting} className={`${BTN_PRIMARY} bg-sky-600 hover:bg-sky-700`}>
                  {modalSubmitting ? 'Saving…' : 'Save Increment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK MODAL 3: Performance Review */}
      {/* ========================================================================= */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">Record Appraisal: {person.name}</h3>
              <button type="button" onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddReview} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Review Period *</label>
                  <input
                    type="text"
                    required
                    className={INPUT}
                    value={reviewForm.reviewPeriod}
                    onChange={(e) => setReviewForm((f) => ({ ...f, reviewPeriod: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rating (1 to 5) *</label>
                  <select
                    className={INPUT}
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                  >
                    {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1].map((r) => (
                      <option key={r} value={r}>★ {r} / 5.0</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Key Achievements</label>
                <textarea
                  rows={2}
                  className={INPUT}
                  value={reviewForm.achievements}
                  onChange={(e) => setReviewForm((f) => ({ ...f, achievements: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback & Areas to Improve</label>
                <textarea
                  rows={2}
                  className={INPUT}
                  value={reviewForm.feedback}
                  onChange={(e) => setReviewForm((f) => ({ ...f, feedback: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowReviewModal(false)} className={BTN}>
                  Cancel
                </button>
                <button type="submit" disabled={modalSubmitting} className={`${BTN_PRIMARY} bg-violet-600 hover:bg-violet-700`}>
                  {modalSubmitting ? 'Saving…' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, rows, columns, dateCols, moneyCols = [] }) {
  return (
    <div className={PANEL}>
      <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F2F2F2]">
            <tr>
              {columns.map((col) => (
                <th key={col} className={TH}>
                  {pretty(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!rows?.length ? (
              <tr>
                <td className="px-3 py-6 text-xs text-slate-400" colSpan={columns.length}>
                  None yet
                </td>
              </tr>
            ) : (
              rows.slice(0, 8).map((row) => (
                <tr key={row._id} className="border-b border-slate-100 last:border-0">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 text-xs">
                      {col === 'status' ? (
                        <Pill tone={row[col] === 'approved' || row[col] === 'paid' ? 'green' : 'amber'}>
                          {row[col]}
                        </Pill>
                      ) : moneyCols.includes(col) ? (
                        inr(row[col])
                      ) : dateCols && row[col] ? (
                        new Date(row[col]).toLocaleString('en-IN')
                      ) : (
                        row[col] || '—'
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
