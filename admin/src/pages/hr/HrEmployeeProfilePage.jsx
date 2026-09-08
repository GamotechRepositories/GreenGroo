import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';
import { inr, Pill, pretty, HrBackButtons } from './hrShared';

export default function HrEmployeeProfilePage() {
  const { type, id } = useParams();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  if (loading) {
    return (
      <div>
        <HrBackButtons />
        <div className="flex justify-center py-20 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
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
  return (
    <div className="space-y-4">
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
        <p className={PAGE_SUB}>{person.role} · {person.phone || '—'} · {person.email || '—'}</p>
      </div>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={save} className={`${PANEL} space-y-3 p-4 lg:col-span-1`}>
          <p className="text-sm font-semibold">Employment</p>
          <label className="block text-xs font-semibold text-slate-600">Department<input className={`${INPUT} mt-1.5`} value={profile.department} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">Monthly salary<input type="number" min="0" className={`${INPUT} mt-1.5`} value={profile.monthlySalary} onChange={(e) => setProfile((p) => ({ ...p, monthlySalary: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">Joining date<input type="date" className={`${INPUT} mt-1.5`} value={profile.joiningDate} onChange={(e) => setProfile((p) => ({ ...p, joiningDate: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">Bank account<input className={`${INPUT} mt-1.5`} value={profile.bankAccount} onChange={(e) => setProfile((p) => ({ ...p, bankAccount: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">IFSC<input className={`${INPUT} mt-1.5`} value={profile.ifsc} onChange={(e) => setProfile((p) => ({ ...p, ifsc: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">UPI<input className={`${INPUT} mt-1.5`} value={profile.upi} onChange={(e) => setProfile((p) => ({ ...p, upi: e.target.value }))} /></label>
          <label className="block text-xs font-semibold text-slate-600">Notes<textarea rows={3} className={`${INPUT} mt-1.5`} value={profile.workNotes} onChange={(e) => setProfile((p) => ({ ...p, workNotes: e.target.value }))} /></label>
          <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? 'Saving…' : 'Save profile'}</button>
        </form>

        <div className="space-y-4 lg:col-span-2">
          <Section title="Leave" rows={data.leaves} columns={['leaveType', 'fromDate', 'toDate', 'status']} />
          <Section title="Attendance" rows={data.attendance} columns={['date', 'clockIn', 'clockOut']} dateCols />
          <Section title="Payroll" rows={data.payroll} columns={['month', 'gross', 'net', 'status']} moneyCols={['gross', 'net']} />
          <Section title="Shifts" rows={data.shifts} columns={['date', 'shiftName', 'startTime', 'endTime']} />
        </div>
      </div>
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
            <tr>{columns.map((col) => <th key={col} className={TH}>{pretty(col)}</th>)}</tr>
          </thead>
          <tbody>
            {!rows?.length ? (
              <tr><td className="px-3 py-6 text-xs text-slate-400" colSpan={columns.length}>None yet</td></tr>
            ) : rows.slice(0, 8).map((row) => (
              <tr key={row._id} className="border-b border-slate-100 last:border-0">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-xs">
                    {col === 'status' ? <Pill tone={row[col] === 'approved' || row[col] === 'paid' ? 'green' : 'amber'}>{row[col]}</Pill>
                      : moneyCols.includes(col) ? inr(row[col])
                      : dateCols && row[col] ? new Date(row[col]).toLocaleString('en-IN')
                      : row[col] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
