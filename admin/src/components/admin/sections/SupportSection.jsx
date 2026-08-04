import { useCallback, useEffect, useState } from "react";
import {
  getAdminSupportMessage,
  getAdminSupportMessages,
  updateAdminSupportStatus,
} from "../../../api/api";
import { useAuth } from "../../../context/AuthContext";
import { useSupportNotification } from "../../../context/AdminNotificationContext";
import AdminAlert from "../AdminAlert";
import AdminPagination, { ADMIN_PAGE_SIZE } from "../AdminPagination";
import AdminSearchBar from "../AdminSearchBar";
import {
  adminCompactTableClass,
  adminCompactTdClass,
  adminCompactThClass,
  adminTableHeaderClass,
  adminTableWrapperClass,
} from "../adminStyles";
import { getIssueTypeLabel } from "../../../utils/supportConstants";

function getErrorMessage(err, fallback) {
  return err.response?.data?.message || err.message || fallback;
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SupportDetailModal({ messageId, onClose }) {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!messageId) return;

    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await getAdminSupportMessage(messageId);
        if (active) setMessage(data.data);
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load message"));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [messageId]);

  if (!messageId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold text-neutral-900">Support Message</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm font-semibold text-neutral-500 hover:bg-neutral-100"
          >
            Close
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : message ? (
          <div className="space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <p><span className="font-semibold text-neutral-700">Name:</span> {message.name}</p>
              <p><span className="font-semibold text-neutral-700">Email:</span> {message.email}</p>
              <p><span className="font-semibold text-neutral-700">Phone:</span> {message.phone}</p>
              <p><span className="font-semibold text-neutral-700">Order ID:</span> {message.orderId || "—"}</p>
              <p><span className="font-semibold text-neutral-700">Issue:</span> {getIssueTypeLabel(message.issueType)}</p>
              <p><span className="font-semibold text-neutral-700">Date:</span> {formatDate(message.createdAt)}</p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-neutral-700">Message</p>
              <p className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-neutral-800">
                {message.message}
              </p>
            </div>
            {message.attachment ? (
              <div>
                <p className="mb-2 font-semibold text-neutral-700">Attachment</p>
                <img
                  src={message.attachment}
                  alt={message.attachmentName || "Support attachment"}
                  className="max-h-80 rounded-lg border border-neutral-200 object-contain"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SupportSection() {
  const { adminUser } = useAuth();
  const { markSupportAsSeen } = useSupportNotification();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ADMIN_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    markSupportAsSeen();
  }, [markSupportAsSeen]);

  const fetchMessages = useCallback(async () => {
    if (adminUser?.role !== "admin") return;

    try {
      setLoading(true);
      setError("");
      const params = { page, limit: ADMIN_PAGE_SIZE };
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const { data } = await getAdminSupportMessages(params);
      setMessages(data.data || []);
      setPagination(
        data.pagination || {
          page,
          limit: ADMIN_PAGE_SIZE,
          total: data.data?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load support messages"));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [adminUser, page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const filteredMessages = messages;

  const handleStatusChange = async (id, status) => {
    try {
      setError("");
      setSuccess("");
      await updateAdminSupportStatus(id, { status });
      setMessages((prev) =>
        prev.map((message) => (message._id === id ? { ...message, status } : message))
      );
      setSuccess("Status updated");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update status"));
    }
  };

  return (
    <div className="min-w-0">
      <AdminAlert
        error={error}
        success={success}
        onClear={() => {
          setError("");
          setSuccess("");
        }}
      />

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-neutral-700">
            {pagination.total} message{pagination.total === 1 ? "" : "s"}
          </p>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <AdminSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, email, phone, order ID, or message..."
        />
      </div>

      {loading ? (
        <p className="mt-4 text-text-secondary">Loading support messages...</p>
      ) : filteredMessages.length === 0 ? (
        <p className="mt-4 text-text-secondary">No support messages found.</p>
      ) : (
        <div className={adminTableWrapperClass}>
          <table className={adminCompactTableClass}>
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[12%]" />
              <col className="w-[20%]" />
              <col className="w-[8%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className={adminTableHeaderClass}>
                <th className={adminCompactThClass}>Date</th>
                <th className={adminCompactThClass}>Name</th>
                <th className={adminCompactThClass}>Email</th>
                <th className={adminCompactThClass}>Phone</th>
                <th className={adminCompactThClass}>Order ID</th>
                <th className={adminCompactThClass}>Issue Type</th>
                <th className={adminCompactThClass}>Message</th>
                <th className={adminCompactThClass}>Attachment</th>
                <th className={adminCompactThClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((message) => (
                <tr
                  key={message._id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                >
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    <span className="block truncate">{formatDate(message.createdAt)}</span>
                  </td>
                  <td className={`${adminCompactTdClass} font-medium text-neutral-900`}>
                    <span className="block truncate">{message.name}</span>
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    <span className="block truncate">{message.email}</span>
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    <span className="block truncate">{message.phone}</span>
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    <span className="block truncate">{message.orderId || "—"}</span>
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    <span className="line-clamp-2">{getIssueTypeLabel(message.issueType)}</span>
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(message._id)}
                      className="line-clamp-2 text-left text-primary hover:underline"
                    >
                      {message.message}
                    </button>
                  </td>
                  <td className={adminCompactTdClass}>
                    {message.hasAttachment ? (
                      <button
                        type="button"
                        onClick={() => setSelectedId(message._id)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className={adminCompactTdClass}>
                    <select
                      value={message.status}
                      onChange={(e) => handleStatusChange(message._id, e.target.value)}
                      className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700 focus:border-primary focus:outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <AdminPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            loading={loading}
            onPageChange={setPage}
          />
        </div>
      )}

      <SupportDetailModal messageId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

export default SupportSection;
