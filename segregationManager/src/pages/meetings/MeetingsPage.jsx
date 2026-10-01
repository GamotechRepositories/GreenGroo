import { useState, useEffect } from "react";
import { api } from "../../api/staffApi";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api.get("/api/admin-ops/hr/meetings/mine")
      .then((res) => {
        if (alive) {
          const allMeetings = res.data?.data || [];
          setMeetings(allMeetings.filter(m => m.roles.includes('all') || m.roles.includes('segregation')));
        }
      })
      .catch((err) => alive && setError(err.response?.data?.message || "Failed to load meetings"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Meetings</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {loading ? (
        <p className="text-slate-500">Loading meetings...</p>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No meetings scheduled at this time.
        </div>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => (
            <div key={meeting._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Team Meeting</h3>
                  <p className="text-sm text-slate-500">{new Date(meeting.createdAt).toLocaleString('en-IN')}</p>
                </div>
                {meeting.link && (
                  <a href={meeting.link} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    Join Meeting
                  </a>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {meeting.meetingId && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Meeting ID</p>
                    <p className="font-mono text-sm text-slate-700">{meeting.meetingId}</p>
                  </div>
                )}
                {meeting.password && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Password</p>
                    <p className="font-mono text-sm text-slate-700">{meeting.password}</p>
                  </div>
                )}
              </div>
              {meeting.note && (
                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="text-sm text-slate-700">{meeting.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
