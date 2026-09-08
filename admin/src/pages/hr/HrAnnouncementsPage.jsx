import { useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, X } from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';
import { Pill, pretty } from './hrShared';

const empty = { title: '', body: '', roleKey: 'all', status: 'draft', scheduledAt: '' };

export default function HrAnnouncementsPage() {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([{ value: 'all', label: 'All roles' }]);
  const [filter, setFilter] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await opsApi.list('hr/announcements', { roleKey: filter, status });
      setRows(res.data || []);
      if (res.roles?.length) setRoles(res.roles);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter, status]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await opsApi.create('hr/announcements', form);
      setOpen(false);
      setForm(empty);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save announcement');
    } finally {
      setSaving(false);
    }
  };

  const publish = async (row) => {
    await opsApi.update('hr/announcements', row._id, { status: 'published' });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>Announcements</h1>
          <p className={PAGE_SUB}>Create announcements for each role. Draft, schedule, then publish so only that role sees them.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className={BTN}><RefreshCw className="mr-1.5 h-4 w-4" />Refresh</button>
          <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY}><Plus className="mr-1.5 h-4 w-4" />New announcement</button>
        </div>
      </div>
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div> : null}

      <div className="flex flex-wrap gap-2">
        <select className={`${INPUT} max-w-[200px]`} value={filter} onChange={(e) => setFilter(e.target.value)}>
          {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
        </select>
        <select className={`${INPUT} max-w-[160px]`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div className={PANEL}>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F2F2F2]">
                <tr>{['Title', 'Role', 'Status', 'When', ''].map((h) => <th key={h || 'a'} className={TH}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-400">No announcements yet</td></tr>
                ) : rows.map((row) => (
                  <tr key={row._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold">{row.title}</p>
                      <p className="text-xs text-slate-500">{row.body || '—'}</p>
                    </td>
                    <td className="px-3 py-2.5 text-xs">{pretty(row.roleKey)}</td>
                    <td className="px-3 py-2.5">
                      <Pill tone={row.status === 'published' ? 'green' : row.status === 'scheduled' ? 'blue' : 'amber'}>{row.status}</Pill>
                    </td>
                    <td className="px-3 py-2.5 text-xs tabular-nums">{row.scheduledAt || (row.publishedAt ? new Date(row.publishedAt).toLocaleDateString('en-IN') : '—')}</td>
                    <td className="px-3 py-2.5 text-right">
                      {row.status !== 'published' ? (
                        <button type="button" className={`${BTN} h-8 min-h-0 px-2.5 text-xs`} onClick={() => publish(row)}>Publish</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={save} className={`w-full max-w-lg ${PANEL} p-5`}>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold">Create announcement</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600">
                Visible to role
                <select className={`${INPUT} mt-1.5`} value={form.roleKey} onChange={(e) => setForm((p) => ({ ...p, roleKey: e.target.value }))}>
                  {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Title
                <input required className={`${INPUT} mt-1.5`} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Message
                <textarea rows={4} className={`${INPUT} mt-1.5`} value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Schedule date (optional)
                <input type="date" className={`${INPUT} mt-1.5`} value={form.scheduledAt} onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))} />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Status
                <select className={`${INPUT} mt-1.5`} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Publish now</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={BTN} onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
