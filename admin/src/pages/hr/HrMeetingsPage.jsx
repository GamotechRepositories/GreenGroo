import { useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';
import { Pill, pretty, HrBackButtons } from './hrShared';

const empty = { roles: [], link: '', meetingId: '', password: '', note: '' };

export default function HrMeetingsPage() {
  const [rows, setRows] = useState([]);
  const [rolesList, setRolesList] = useState([{ value: 'all', label: 'All roles' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await opsApi.list('hr/meetings');
      setRows(res.data || []);
      const roleRes = await opsApi.get('hr/roles');
      if (roleRes.data?.length) setRolesList(roleRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await opsApi.create('hr/meetings', form);
      setOpen(false);
      setForm(empty);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not schedule meeting');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    if (selectedOptions.includes('all')) {
      setForm(f => ({ ...f, roles: ['all'] }));
    } else {
      setForm(f => ({ ...f, roles: selectedOptions }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <HrBackButtons />
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>Meetings</h1>
          <p className={PAGE_SUB}>Schedule online meetings for specific roles or teams.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className={BTN}><RefreshCw className="mr-1.5 h-4 w-4" />Refresh</button>
          <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY}><Plus className="mr-1.5 h-4 w-4" />New meeting</button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

      <div className={PANEL}>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F2F2F2]">
                <tr>{['Roles', 'Link', 'Meeting ID', 'Password', 'Note', 'Date'].map((h) => <th key={h || 'a'} className={TH}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-400">No meetings scheduled yet</td></tr>
                ) : rows.map((row) => (
                  <tr key={row._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2.5 font-medium">{row.roles.map(r => pretty(r)).join(', ')}</td>
                    <td className="px-3 py-2.5">
                      {row.link ? <a href={row.link} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">{row.link}</a> : '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">{row.meetingId || '—'}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{row.password || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-500 max-w-[200px] truncate">{row.note || '—'}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form onSubmit={save} className={`${PANEL} w-full max-w-md p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Schedule Meeting</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-semibold">
                Select Roles <span className="text-rose-500">*</span>
                <select multiple value={form.roles} onChange={handleRoleChange} className={`${INPUT} mt-1 h-32`}>
                  {rolesList.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">Hold Ctrl (or Cmd) to select multiple roles.</p>
              </label>

              <label className="block text-sm font-semibold">
                Meeting Link <span className="text-slate-400 font-normal">(Optional)</span>
                <input type="url" value={form.link} onChange={(e) => setForm(f => ({ ...f, link: e.target.value }))} className={`${INPUT} mt-1`} placeholder="https://zoom.us/j/..." />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm font-semibold">
                  Meeting ID <span className="text-slate-400 font-normal">(Optional)</span>
                  <input type="text" value={form.meetingId} onChange={(e) => setForm(f => ({ ...f, meetingId: e.target.value }))} className={`${INPUT} mt-1`} placeholder="123 456 7890" />
                </label>
                <label className="block text-sm font-semibold">
                  Password <span className="text-slate-400 font-normal">(Optional)</span>
                  <input type="text" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className={`${INPUT} mt-1`} placeholder="Passcode" />
                </label>
              </div>

              <label className="block text-sm font-semibold">
                Note <span className="text-slate-400 font-normal">(Optional)</span>
                <textarea rows={3} value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} className={`${INPUT} mt-1`} placeholder="Agenda or extra details..." />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className={BTN}>Cancel</button>
              <button type="submit" disabled={saving || !form.roles.length} className={BTN_PRIMARY}>{saving ? 'Sending…' : 'Send'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
