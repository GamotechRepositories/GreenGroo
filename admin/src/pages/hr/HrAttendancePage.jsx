import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Clock3,
  Download,
  Filter,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
  User,
  UserCheck,
  X,
  AlertCircle,
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
import { HrBackButtons, inr, personKey, Pill, pretty } from './hrShared';

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

function getWeekRange(dateObj) {
  const d = new Date(dateObj);
  const day = d.getDay();
  const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diffToMon));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().slice(0, 10),
    end: sun.toISOString().slice(0, 10),
  };
}

export default function HrAttendancePage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'daily-manager'; // 'daily-manager' | 'reports' | 'shifts'

  const setTab = (newTab) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    });
  };

  // Base state
  const [people, setPeople] = useState([]);
  const [roleKey, setRoleKey] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // -------------------------------------------------------------
  // Tab 1: Daily Attendance Manager State
  // -------------------------------------------------------------
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailyLog, setDailyLog] = useState([]);
  const [dailyStats, setDailyStats] = useState({});
  const [dailySearch, setDailySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Manual Punch Modal
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [punchSubmitting, setPunchSubmitting] = useState(false);
  const [punchForm, setPunchForm] = useState({
    employeeKey: '',
    date: new Date().toISOString().slice(0, 10),
    clockInTime: '09:00',
    clockOutTime: '18:00',
    notes: 'Manual entry by HR',
    status: 'present',
  });

  // -------------------------------------------------------------
  // Tab 2: Individual Reports State (Daily, Weekly, Monthly)
  // -------------------------------------------------------------
  const [reportEmployeeKey, setReportEmployeeKey] = useState('');
  const [reportFilterType, setReportFilterType] = useState('monthly'); // 'daily' | 'weekly' | 'monthly'
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportWeek, setReportWeek] = useState(getWeekRange(new Date()));
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // -------------------------------------------------------------
  // Tab 3: Shifts Roster State
  // -------------------------------------------------------------
  const [shifts, setShifts] = useState([]);
  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    assignee: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '18:00',
    shiftName: 'General',
  });

  // Load basic directory & daily attendance
  const loadDailyAttendance = async (dateToLoad = selectedDate) => {
    setLoading(true);
    try {
      const [attRes, directoryRes, rosterRes] = await Promise.all([
        opsApi.list('hr/attendance', { date: dateToLoad }),
        opsApi.list('hr'),
        opsApi.list('hr/shifts', { roleKey }),
      ]);

      const loadedPeople = directoryRes.data || [];
      setPeople(loadedPeople);
      setDailyLog(attRes.data || []);
      setDailyStats(attRes.stats || {});
      setShifts(rosterRes.data || []);

      // If no employee selected for report yet, default to first person
      if (!reportEmployeeKey && loadedPeople.length > 0) {
        setReportEmployeeKey(personKey(loadedPeople[0]));
      }

      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyAttendance(selectedDate);
  }, [selectedDate, roleKey]);

  // Load individual report whenever report filters change
  const loadIndividualReport = async () => {
    if (!reportEmployeeKey) return;
    const [, ...idParts] = reportEmployeeKey.split(':');
    const employeeId = idParts.join(':');
    if (!employeeId) return;

    setReportLoading(true);
    try {
      const queryParams = {
        employeeId,
        filterType: reportFilterType,
      };
      if (reportFilterType === 'daily') {
        queryParams.date = reportDate;
      } else if (reportFilterType === 'weekly') {
        queryParams.startDate = reportWeek.start;
        queryParams.endDate = reportWeek.end;
      } else {
        queryParams.month = reportMonth;
      }

      const res = await opsApi.get('hr/attendance/report', { params: queryParams });
      setReportData(res.data || null);
    } catch (err) {
      console.warn('Report load error:', err.message);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'reports' && reportEmployeeKey) {
      loadIndividualReport();
    }
  }, [tab, reportEmployeeKey, reportFilterType, reportDate, reportWeek, reportMonth]);

  // Handle Quick Clock-Out for an active employee
  const handleQuickClockOut = async (person) => {
    try {
      await opsApi.create('hr/attendance', {
        action: 'out',
        employeeId: person.id,
        employeeType: person.employeeType,
        name: person.name,
      });
      await loadDailyAttendance(selectedDate);
      if (tab === 'reports') await loadIndividualReport();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to clock out');
    }
  };

  // Handle Manual Punch Submission
  const handleCreateManualPunch = async (e) => {
    e.preventDefault();
    const targetPerson = people.find((p) => personKey(p) === punchForm.employeeKey);
    if (!targetPerson) {
      alert('Please select an employee');
      return;
    }
    setPunchSubmitting(true);
    try {
      await opsApi.post('hr/attendance/manual', {
        employeeId: targetPerson.id,
        employeeType: targetPerson.employeeType,
        name: targetPerson.name,
        role: targetPerson.role || targetPerson.roleKey,
        date: punchForm.date,
        clockIn: punchForm.clockInTime,
        clockOut: punchForm.clockOutTime,
        notes: punchForm.notes,
        status: punchForm.status,
      });
      setShowPunchModal(false);
      await loadDailyAttendance(selectedDate);
      if (tab === 'reports') await loadIndividualReport();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record attendance');
    } finally {
      setPunchSubmitting(false);
    }
  };

  // Delete an attendance entry
  const handleDeleteAttendance = async (id) => {
    if (!window.confirm('Delete this attendance entry?')) return;
    try {
      await opsApi.delete(`hr/attendance/${id}`);
      await loadDailyAttendance(selectedDate);
      if (tab === 'reports') await loadIndividualReport();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete entry');
    }
  };

  // Create Shift Roster
  const handleCreateShift = async (event) => {
    event.preventDefault();
    const person = people.find((row) => personKey(row) === shiftForm.assignee);
    const [employeeType, ...rest] = shiftForm.assignee.split(':');
    await opsApi.create('hr/shifts', {
      ...shiftForm,
      employeeId: rest.join(':'),
      employeeType,
      name: person?.name,
      role: person?.role,
      roleKey: person?.roleKey,
    });
    setOpenShiftModal(false);
    await loadDailyAttendance(selectedDate);
  };

  // Week navigation helpers
  const handlePrevWeek = () => {
    const cur = new Date(`${reportWeek.start}T00:00:00`);
    cur.setDate(cur.getDate() - 7);
    setReportWeek(getWeekRange(cur));
  };
  const handleNextWeek = () => {
    const cur = new Date(`${reportWeek.start}T00:00:00`);
    cur.setDate(cur.getDate() + 7);
    setReportWeek(getWeekRange(cur));
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = reportMonth.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    setReportMonth(prev.toISOString().slice(0, 7));
  };
  const handleNextMonth = () => {
    const [y, m] = reportMonth.split('-').map(Number);
    const next = new Date(y, m, 1);
    setReportMonth(next.toISOString().slice(0, 7));
  };

  // Export report to CSV
  const handleExportCsv = () => {
    if (!reportData?.timeline?.length) {
      alert('No data to export');
      return;
    }
    const headers = ['Date', 'Day', 'Status', 'Clock In', 'Clock Out', 'Duration', 'Source', 'Notes'];
    const rows = reportData.timeline.map((item) => [
      item.date,
      item.dayName,
      item.status,
      formatTime(item.clockIn),
      item.clockOut ? formatTime(item.clockOut) : item.status === 'active' ? 'Active' : '—',
      item.durationFormatted,
      item.source,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_report_${reportData.person?.name || 'employee'}_${reportFilterType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered rows for daily view
  const filteredDailyList = useMemo(() => {
    return people
      .filter((person) => {
        if (roleKey !== 'all' && person.roleKey !== roleKey) return false;
        if (dailySearch.trim()) {
          const q = dailySearch.toLowerCase();
          if (!person.name?.toLowerCase().includes(q) && !person.role?.toLowerCase().includes(q)) {
            return false;
          }
        }
        return true;
      })
      .map((person) => {
        const att = dailyLog.find((row) => String(row.employeeId) === String(person.id));
        let status = 'absent';
        if (att) {
          status = att.clockOut ? 'completed' : 'active';
        }
        return {
          person,
          attendance: att || null,
          status,
        };
      })
      .filter((item) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'active') return item.status === 'active';
        if (statusFilter === 'completed') return item.status === 'completed';
        if (statusFilter === 'absent') return item.status === 'absent';
        return true;
      });
  }, [people, dailyLog, roleKey, dailySearch, statusFilter]);

  const roles = [...new Map(people.map((p) => [p.roleKey, p.role])).entries()];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <HrBackButtons fallback="/hr-management" />
          <p className={PAGE_KICKER}>HR Management</p>
          <h1 className={PAGE_TITLE}>Daily Attendance & Reports</h1>
          <p className={PAGE_SUB}>
            Monitor real-time clock-ins from the Staff App, manage daily attendance, and view individual attendance reports filterable daily, weekly, or monthly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadDailyAttendance(selectedDate)}
            disabled={loading}
            className={BTN}
            title="Refresh logs"
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setPunchForm((f) => ({
                ...f,
                date: selectedDate,
                employeeKey: people[0] ? personKey(people[0]) : '',
              }));
              setShowPunchModal(true);
            }}
            className={`${BTN_PRIMARY} bg-emerald-600 hover:bg-emerald-700`}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            + Record / Adjust Punch
          </button>
          <button
            type="button"
            onClick={() => setOpenShiftModal(true)}
            className={`${BTN_PRIMARY} bg-slate-800 hover:bg-slate-900`}
          >
            <Clock3 className="mr-1.5 h-4 w-4" />
            Assign Shift
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {/* Real-time KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className={`${PANEL} p-3.5`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Staff</span>
            <User className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{people.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Total active team</p>
        </div>

        <div className={`${PANEL} p-3.5`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Present Today</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-emerald-700">{dailyStats.presentCount ?? dailyLog.length}</p>
          <p className="mt-0.5 text-[11px] text-emerald-600">
            {people.length ? `${Math.round(((dailyStats.presentCount || dailyLog.length) / people.length) * 100)}% attendance` : '—'}
          </p>
        </div>

        <div className={`${PANEL} p-3.5`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Working Now</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{dailyStats.currentlyWorking ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Clocked in · Active</p>
        </div>

        <div className={`${PANEL} p-3.5`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Completed Shift</span>
            <CheckCircle2 className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{dailyStats.completedShift ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Clocked out</p>
        </div>

        <div className={`${PANEL} p-3.5`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>From Staff App</span>
            <Smartphone className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{dailyStats.staffAppPunches ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Mobile punches</p>
        </div>

        <div className={`${PANEL} p-3.5`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>On Leave / Off</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-amber-700">{dailyStats.onLeaveCount ?? 0}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Approved leaves</p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-6">
          <button
            type="button"
            onClick={() => setTab('daily-manager')}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition ${
              tab === 'daily-manager'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            Daily Attendance Manager
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('reports');
              if (reportEmployeeKey) loadIndividualReport();
            }}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition ${
              tab === 'reports'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Individual Attendance Reports (Daily · Weekly · Monthly)
          </button>

          <button
            type="button"
            onClick={() => setTab('shifts')}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition ${
              tab === 'shifts'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock3 className="h-4 w-4" />
            Shift Rosters ({shifts.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY ATTENDANCE MANAGER */}
      {/* ========================================================================= */}
      {tab === 'daily-manager' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            {/* Date Navigator */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(`${selectedDate}T00:00:00`);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().slice(0, 10));
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                title="Previous Day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                  selectedDate === new Date().toISOString().slice(0, 10)
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Today
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`${INPUT} text-xs py-1 px-2.5 max-w-[150px] font-semibold text-slate-800`}
              />

              <button
                type="button"
                onClick={() => {
                  const d = new Date(`${selectedDate}T00:00:00`);
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().slice(0, 10));
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                title="Next Day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
              <div className="relative min-w-[200px] max-w-xs">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff name..."
                  className={`${INPUT} pl-8 py-1 text-xs`}
                  value={dailySearch}
                  onChange={(e) => setDailySearch(e.target.value)}
                />
              </div>

              <select
                className={`${INPUT} text-xs py-1 max-w-[150px]`}
                value={roleKey}
                onChange={(e) => setRoleKey(e.target.value)}
              >
                <option value="all">All Roles</option>
                {roles.map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                className={`${INPUT} text-xs py-1 max-w-[150px]`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">🟢 Working Now</option>
                <option value="completed">✔ Completed Shift</option>
                <option value="absent">⚠️ Absent / Not Punched</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className={PANEL}>
            <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">
                Staff Punch Records for {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </h2>
              <span className="text-xs text-slate-500">
                Showing {filteredDailyList.length} employee{filteredDailyList.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F8F9FA]">
                  <tr>
                    <th className={TH}>Employee</th>
                    <th className={TH}>Status</th>
                    <th className={TH}>Clock In</th>
                    <th className={TH}>Clock Out</th>
                    <th className={TH}>Hours Worked</th>
                    <th className={TH}>Source</th>
                    <th className={TH}>Notes / Remarks</th>
                    <th className={TH}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDailyList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                        No staff records found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDailyList.map(({ person, attendance, status }) => (
                      <tr key={personKey(person)} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{person.name}</div>
                          <div className="text-xs text-slate-500 capitalize">
                            {pretty(person.role || person.roleKey)} · {person.department || 'Operations'}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs">
                          {status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Working Now
                            </span>
                          ) : status === 'completed' ? (
                            <Pill tone="green">Completed Shift</Pill>
                          ) : (
                            <Pill tone="slate">Not Punched</Pill>
                          )}
                        </td>

                        <td className="px-4 py-3 text-xs font-medium text-slate-800">
                          {attendance?.clockIn ? formatTime(attendance.clockIn) : '—'}
                        </td>

                        <td className="px-4 py-3 text-xs font-medium text-slate-800">
                          {attendance?.clockOut ? (
                            formatTime(attendance.clockOut)
                          ) : status === 'active' ? (
                            <span className="text-emerald-600 font-semibold italic">In Progress</span>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="px-4 py-3 text-xs font-bold text-slate-900">
                          {attendance ? formatDuration(attendance.durationMinutes) : '—'}
                        </td>

                        <td className="px-4 py-3 text-xs">
                          {attendance?.source === 'staff_app' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                              <Smartphone className="h-3 w-3" />
                              Staff App
                            </span>
                          ) : attendance?.source === 'admin' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              HR Admin
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                          {attendance?.notes || '—'}
                        </td>

                        <td className="px-4 py-3 text-xs">
                          <div className="flex items-center gap-2">
                            {status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleQuickClockOut(person)}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200"
                                title="Clock out employee"
                              >
                                <LogOut className="h-3 w-3" />
                                Clock Out
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setPunchForm({
                                  employeeKey: personKey(person),
                                  date: selectedDate,
                                  clockInTime: attendance?.clockIn ? new Date(attendance.clockIn).toISOString().slice(11, 16) : '09:00',
                                  clockOutTime: attendance?.clockOut ? new Date(attendance.clockOut).toISOString().slice(11, 16) : '18:00',
                                  notes: attendance?.notes || 'Adjusted by HR',
                                  status: 'present',
                                });
                                setShowPunchModal(true);
                              }}
                              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 underline"
                            >
                              {attendance ? 'Adjust' : 'Punch'}
                            </button>
                            {attendance && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAttendance(attendance._id)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                                title="Delete punch record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INDIVIDUAL ATTENDANCE REPORTS (DAILY, WEEKLY, MONTHLY) */}
      {/* ========================================================================= */}
      {tab === 'reports' && (
        <div className="space-y-4">
          {/* Employee & Filter Configuration Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            {/* Employee Selector */}
            <div className="flex-1 min-w-[260px] max-w-md">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Employee for Report:
              </label>
              <select
                className={`${INPUT} font-semibold text-slate-900`}
                value={reportEmployeeKey}
                onChange={(e) => setReportEmployeeKey(e.target.value)}
              >
                {people.map((p) => (
                  <option key={personKey(p)} value={personKey(p)}>
                    {p.name} ({pretty(p.role || p.roleKey)} · {p.department || 'Operations'})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Mode Selector (Daily / Weekly / Monthly) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Report Frequency:</label>
              <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setReportFilterType('daily')}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    reportFilterType === 'daily' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  📅 Daily
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilterType('weekly')}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    reportFilterType === 'weekly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  📆 Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilterType('monthly')}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    reportFilterType === 'monthly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  🗓️ Monthly
                </button>
              </div>
            </div>

            {/* Period Navigator based on mode */}
            <div className="flex items-center gap-2">
              {reportFilterType === 'daily' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Day:</label>
                  <input
                    type="date"
                    className={`${INPUT} text-xs py-1.5 font-semibold`}
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                </div>
              )}

              {reportFilterType === 'weekly' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Week:</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevWeek}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                      title="Previous Week"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50">
                      {reportWeek.start} to {reportWeek.end}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextWeek}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                      title="Next Week"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {reportFilterType === 'monthly' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Month:</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                      title="Previous Month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <input
                      type="month"
                      className={`${INPUT} text-xs py-1.5 font-bold text-slate-800`}
                      value={reportMonth}
                      onChange={(e) => setReportMonth(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                      title="Next Month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-5">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className={`${BTN} text-xs py-1.5`}
                  title="Export to CSV"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Report Analytics Cards */}
          {reportData && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className={`${PANEL} p-3.5`}>
                <div className="text-xs font-semibold text-slate-500">Attendance Rate</div>
                <p className="mt-1.5 text-2xl font-bold text-emerald-700">
                  {reportData.stats?.attendancePercentage ?? 0}%
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Present vs working days</p>
              </div>

              <div className={`${PANEL} p-3.5`}>
                <div className="text-xs font-semibold text-slate-500">Total Hours</div>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">
                  {reportData.stats?.totalHours ?? 0} hrs
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Avg: {reportData.stats?.avgDailyHours ?? 0} hrs / day
                </p>
              </div>

              <div className={`${PANEL} p-3.5`}>
                <div className="text-xs font-semibold text-slate-500">Days Present</div>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">
                  {reportData.stats?.presentDays ?? 0}
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-600">Punched in & worked</p>
              </div>

              <div className={`${PANEL} p-3.5`}>
                <div className="text-xs font-semibold text-slate-500">From Staff App</div>
                <p className="mt-1.5 text-2xl font-bold text-emerald-700">
                  {reportData.stats?.staffAppPunches ?? 0}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Mobile app punches</p>
              </div>

              <div className={`${PANEL} p-3.5`}>
                <div className="text-xs font-semibold text-slate-500">Approved Leaves</div>
                <p className="mt-1.5 text-2xl font-bold text-amber-700">
                  {reportData.stats?.leaveDays ?? 0}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Leave requests</p>
              </div>

              <div className={`${PANEL} p-3.5`}>
                <div className="text-xs font-semibold text-slate-500">Days Absent</div>
                <p className="mt-1.5 text-2xl font-bold text-rose-700">
                  {reportData.stats?.absentDays ?? 0}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">No punch recorded</p>
              </div>
            </div>
          )}

          {/* Breakdown Views */}
          {reportLoading ? (
            <div className="flex justify-center py-20 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !reportData ? (
            <div className={`${PANEL} p-12 text-center text-sm text-slate-400`}>
              Select an employee to view their individual attendance report.
            </div>
          ) : reportFilterType === 'weekly' ? (
            /* Weekly 7-day card grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {reportData.timeline?.map((day) => (
                <div
                  key={day.date}
                  className={`rounded-2xl border p-4 transition ${
                    day.isToday
                      ? 'border-emerald-500 bg-emerald-50/30 shadow-sm'
                      : day.status === 'present' || day.status === 'active'
                      ? 'border-slate-200 bg-white'
                      : day.status === 'on_leave'
                      ? 'border-amber-200 bg-amber-50/30'
                      : day.status === 'off'
                      ? 'border-slate-100 bg-slate-50/50'
                      : 'border-rose-100 bg-rose-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <div>
                      <p className="font-bold text-xs text-slate-900">{day.dayName}</p>
                      <p className="text-[11px] text-slate-500">{day.date.slice(5)}</p>
                    </div>
                    {day.status === 'active' ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ) : day.status === 'present' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : null}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Status:</span>
                      <span className="font-semibold capitalize text-slate-800">
                        {day.status === 'off' ? 'Weekend' : day.status === 'on_leave' ? 'On Leave' : day.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>In:</span>
                      <span className="font-medium text-slate-800">{formatTime(day.clockIn)}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Out:</span>
                      <span className="font-medium text-slate-800">{formatTime(day.clockOut)}</span>
                    </div>

                    <div className="flex items-center justify-between font-bold text-slate-900 border-t pt-1 mt-1">
                      <span>Hours:</span>
                      <span className="text-emerald-700">{day.durationFormatted}</span>
                    </div>

                    {day.source === 'staff_app' && (
                      <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 pt-1">
                        <Smartphone className="h-2.5 w-2.5" /> Staff App
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Daily or Monthly Ledger Table */
            <div className={PANEL}>
              <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {reportData.person?.name} · {reportFilterType === 'daily' ? `Daily Log for ${reportDate}` : `Monthly Ledger for ${reportMonth}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {reportData.person?.designation || reportData.person?.role} · {reportData.person?.department || 'Operations'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {reportData.stats?.attendancePercentage}% Overall Attendance
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#F8F9FA]">
                    <tr>
                      <th className={TH}>Date & Day</th>
                      <th className={TH}>Status</th>
                      <th className={TH}>Clock In</th>
                      <th className={TH}>Clock Out</th>
                      <th className={TH}>Duration</th>
                      <th className={TH}>Punch Source</th>
                      <th className={TH}>Remarks / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.timeline?.map((day) => (
                      <tr
                        key={day.date}
                        className={`hover:bg-slate-50/70 transition ${
                          day.isToday ? 'bg-emerald-50/20 font-medium' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 text-xs">
                          <div className="font-semibold text-slate-900">
                            {day.date}{' '}
                            <span className="text-slate-400 font-normal">({day.dayName})</span>
                            {day.isToday && <span className="ml-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">Today</span>}
                          </div>
                        </td>

                        <td className="px-4 py-2.5 text-xs">
                          {day.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active Now
                            </span>
                          ) : day.status === 'present' ? (
                            <Pill tone="green">Present</Pill>
                          ) : day.status === 'on_leave' ? (
                            <Pill tone="amber">Approved Leave</Pill>
                          ) : day.status === 'off' ? (
                            <Pill tone="slate">Weekend / Off</Pill>
                          ) : (
                            <Pill tone="rose">Absent</Pill>
                          )}
                        </td>

                        <td className="px-4 py-2.5 text-xs font-medium text-slate-800">
                          {formatTime(day.clockIn)}
                        </td>

                        <td className="px-4 py-2.5 text-xs font-medium text-slate-800">
                          {formatTime(day.clockOut)}
                        </td>

                        <td className="px-4 py-2.5 text-xs font-bold text-slate-900">
                          {day.durationFormatted}
                        </td>

                        <td className="px-4 py-2.5 text-xs">
                          {day.source === 'staff_app' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Smartphone className="h-3 w-3" /> Staff App
                            </span>
                          ) : day.source === 'admin' ? (
                            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">Admin</span>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">
                          {day.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SHIFTS ROSTER (PRESERVED) */}
      {/* ========================================================================= */}
      {tab === 'shifts' && (
        <div className={PANEL}>
          <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Assigned Shifts & Working Hours</h2>
            <button
              type="button"
              onClick={() => setOpenShiftModal(true)}
              className="text-xs font-semibold text-slate-800 hover:underline"
            >
              + Assign Shift
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#F2F2F2]">
                <tr>
                  {['Name', 'Role', 'Date', 'Shift Name', 'Scheduled Hours'].map((h) => (
                    <th key={h} className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No shift rosters assigned yet.
                    </td>
                  </tr>
                ) : (
                  shifts.map((row) => (
                    <tr key={row._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium">{row.name}</td>
                      <td className="px-3 py-2.5 text-xs">{row.role || pretty(row.roleKey)}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums">{row.date}</td>
                      <td className="px-3 py-2.5 text-xs font-semibold">{row.shiftName}</td>
                      <td className="px-3 py-2.5 text-xs tabular-nums text-emerald-800 font-semibold">
                        {row.startTime} – {row.endTime}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: MANUAL PUNCH / ADJUST ATTENDANCE */}
      {/* ========================================================================= */}
      {showPunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2 text-emerald-700">
                <Clock className="h-5 w-5" />
                <h3 className="font-bold text-slate-900 text-sm">Record / Adjust Punch</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPunchModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualPunch} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee *</label>
                <select
                  required
                  className={INPUT}
                  value={punchForm.employeeKey}
                  onChange={(e) => setPunchForm((f) => ({ ...f, employeeKey: e.target.value }))}
                >
                  <option value="">-- Choose employee --</option>
                  {people.map((p) => (
                    <option key={personKey(p)} value={personKey(p)}>
                      {p.name} ({pretty(p.role || p.roleKey)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  className={INPUT}
                  value={punchForm.date}
                  onChange={(e) => setPunchForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clock In Time</label>
                  <input
                    type="time"
                    className={INPUT}
                    value={punchForm.clockInTime}
                    onChange={(e) => setPunchForm((f) => ({ ...f, clockInTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clock Out Time</label>
                  <input
                    type="time"
                    className={INPUT}
                    value={punchForm.clockOutTime}
                    onChange={(e) => setPunchForm((f) => ({ ...f, clockOutTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  className={INPUT}
                  value={punchForm.status}
                  onChange={(e) => setPunchForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="present">Present</option>
                  <option value="late">Late Arrival</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Field duty adjustments or manual card punch"
                  className={INPUT}
                  value={punchForm.notes}
                  onChange={(e) => setPunchForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowPunchModal(false)}
                  className={BTN}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={punchSubmitting}
                  className={`${BTN_PRIMARY} bg-emerald-600 hover:bg-emerald-700`}
                >
                  {punchSubmitting ? 'Saving…' : 'Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN SHIFT MODAL */}
      {/* ========================================================================= */}
      {openShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={handleCreateShift} className={`w-full max-w-lg ${PANEL} p-5`}>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold">Assign Shift Roster</h2>
              <button
                type="button"
                onClick={() => setOpenShiftModal(false)}
                className="rounded-lg p-1 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600">
                Employee
                <select
                  required
                  className={`${INPUT} mt-1.5`}
                  value={shiftForm.assignee}
                  onChange={(e) => setShiftForm((p) => ({ ...p, assignee: e.target.value }))}
                >
                  <option value="">Select Employee</option>
                  {people.map((person) => (
                    <option key={personKey(person)} value={personKey(person)}>
                      {person.name} · {person.role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Date
                <input
                  type="date"
                  required
                  className={`${INPUT} mt-1.5`}
                  value={shiftForm.date}
                  onChange={(e) => setShiftForm((p) => ({ ...p, date: e.target.value }))}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Shift Name
                <input
                  className={`${INPUT} mt-1.5`}
                  value={shiftForm.shiftName}
                  onChange={(e) => setShiftForm((p) => ({ ...p, shiftName: e.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-slate-600">
                  Start Time
                  <input
                    type="time"
                    className={`${INPUT} mt-1.5`}
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm((p) => ({ ...p, startTime: e.target.value }))}
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  End Time
                  <input
                    type="time"
                    className={`${INPUT} mt-1.5`}
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm((p) => ({ ...p, endTime: e.target.value }))}
                  />
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={BTN} onClick={() => setOpenShiftModal(false)}>
                Cancel
              </button>
              <button type="submit" className={BTN_PRIMARY}>
                Save Shift
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
