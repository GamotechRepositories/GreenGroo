import { useCallback, useEffect, useRef, useState, Fragment } from "react";
import { createUser, deleteUser, getUserOrderStats, getUsers, updateUser } from "../../../api/api";
import AdminAlert from "../AdminAlert";
import AdminPagination, { ADMIN_PAGE_SIZE } from "../AdminPagination";
import AdminSearchBar from "../AdminSearchBar";
import { IconEdit, IconTrash } from "../AdminIcons";
import UserEditModal from "../UserEditModal";
import {
  adminCompactTableClass,
  adminCompactTdClass,
  adminCompactThClass,
  adminFilterCardClass,
  adminTableHeaderClass,
  adminTableWrapperClass,
  btnPrimary,
  iconBtnClass,
  iconBtnDangerClass,
  pageHeaderActionsClass,
  pageHeaderClass,
} from "../adminStyles";
import { formatPrice } from "./adminOrderUtils";

const SEARCH_DEBOUNCE_MS = 300;

function CustomerHistoryPanel({ stats, loading, error }) {
  if (loading) {
    return <p className="text-sm text-neutral-500">Loading customer history...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="w-full min-w-0 space-y-3">
      <p className="text-sm font-semibold text-neutral-900">Customer History</p>
      <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
        <div className="min-w-0 rounded-lg border border-neutral-200 bg-white px-2 py-2 sm:px-3">
          <p className="text-[10px] leading-tight text-neutral-500 sm:text-xs">Total Orders</p>
          <p className="mt-1 truncate text-base font-semibold text-neutral-900 sm:text-lg">
            {stats?.totalOrders ?? 0}
          </p>
        </div>
        <div className="min-w-0 rounded-lg border border-neutral-200 bg-white px-2 py-2 sm:px-3">
          <p className="text-[10px] leading-tight text-neutral-500 sm:text-xs">Total Revenue</p>
          <p className="mt-1 truncate text-base font-semibold text-neutral-900 sm:text-lg">
            {formatPrice(stats?.totalRevenue ?? 0)}
          </p>
        </div>
        <div className="min-w-0 rounded-lg border border-neutral-200 bg-white px-2 py-2 sm:px-3">
          <p className="text-[10px] leading-tight text-neutral-500 sm:text-xs">Avg Order Value</p>
          <p className="mt-1 truncate text-base font-semibold text-neutral-900 sm:text-lg">
            {formatPrice(stats?.averageOrderValue ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

function UserSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [historyByUser, setHistoryByUser] = useState({});
  const [historyLoadingId, setHistoryLoadingId] = useState(null);
  const fetchRequestIdRef = useRef(0);
  const skipSearchDebounceRef = useRef(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ADMIN_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    if (skipSearchDebounceRef.current) {
      skipSearchDebounceRef.current = false;
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      const nextQuery = searchInput.trim();
      setSearchQuery((prev) => {
        if (prev === nextQuery) return prev;
        setExpandedUserId(null);
        setPage(1);
        return nextQuery;
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timerId);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current;

    try {
      setLoading(true);
      setError("");
      const params = { page, limit: ADMIN_PAGE_SIZE };
      if (searchQuery) {
        if (/^\d+$/.test(searchQuery)) {
          params.phone = searchQuery;
        } else {
          params.name = searchQuery;
          params.search = searchQuery;
        }
      }
      const { data } = await getUsers(params);
      if (requestId !== fetchRequestIdRef.current) return;

      setUsers(data.data || []);
      setPagination(
        data.pagination || {
          page,
          limit: ADMIN_PAGE_SIZE,
          total: data.data?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      if (requestId !== fetchRequestIdRef.current) return;
      setError(
        err.response?.data?.message ||
          "Failed to load users. Login as admin to view registered dealers."
      );
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const loadCustomerHistory = async (userId) => {
    if (historyByUser[userId]?.stats || historyByUser[userId]?.error) return;

    try {
      setHistoryLoadingId(userId);
      const { data } = await getUserOrderStats(userId);
      setHistoryByUser((prev) => ({
        ...prev,
        [userId]: { stats: data.data, error: "" },
      }));
    } catch (err) {
      setHistoryByUser((prev) => ({
        ...prev,
        [userId]: {
          stats: null,
          error: err.response?.data?.message || "Failed to load customer history",
        },
      }));
    } finally {
      setHistoryLoadingId(null);
    }
  };

  const handleRowClick = (userId) => {
    const id = String(userId);
    if (expandedUserId === id) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(id);
    loadCustomerHistory(id);
  };

  const closeModal = () => {
    setEditingUser(null);
    setShowAddUser(false);
  };

  const handleSave = async (id, payload) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      if (id) {
        await updateUser(id, payload);
        setSuccess("User updated successfully");
      } else {
        if (!payload.password) {
          delete payload.password;
        }
        await createUser(payload);
        setSuccess("User added successfully");
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || (id ? "Failed to update user" : "Failed to add user"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      setError("");
      setSuccess("");
      await deleteUser(id);
      setSuccess("User deleted");
      if (editingUser?._id === id) setEditingUser(null);
      if (expandedUserId === String(id)) setExpandedUserId(null);
      const nextPage = users.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
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

      <div className={pageHeaderClass}>
        <div>
          <p className="text-sm font-medium text-neutral-700">
            All users ({pagination.total})
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Click any row to see history
          </p>
        </div>
        <div className={pageHeaderActionsClass}>
          <button
            type="button"
            onClick={() => setShowAddUser(true)}
            className={btnPrimary}
          >
            Add User
          </button>
        </div>
      </div>

      <div className={`${adminFilterCardClass} mb-4`}>
        <AdminSearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search by name or phone number..."
        />
      </div>

      {loading && users.length === 0 ? (
        <p className="text-text-secondary">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-text-secondary">
          {error
            ? "Could not load users."
            : searchQuery
              ? "No users found for this search."
              : "No registered users yet."}
        </p>
      ) : (
        <div className={adminTableWrapperClass}>
          {loading ? (
            <p className="mb-2 px-3 pt-3 text-xs text-neutral-500">Searching...</p>
          ) : null}
          <table className={adminCompactTableClass}>
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[28%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[26%]" />
            </colgroup>
            <thead>
              <tr className={adminTableHeaderClass}>
                <th className={adminCompactThClass}>Name</th>
                <th className={adminCompactThClass}>Email</th>
                <th className={adminCompactThClass}>Phone</th>
                <th className={adminCompactThClass}>Joined</th>
                <th className={adminCompactThClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const userId = String(user._id);
                const isExpanded = expandedUserId === userId;
                const history = historyByUser[userId];

                return (
                  <Fragment key={userId}>
                    <tr
                      onClick={() => handleRowClick(userId)}
                      className={`cursor-pointer border-b border-neutral-100 hover:bg-neutral-50/50 ${
                        isExpanded ? "bg-neutral-50/70" : ""
                      }`}
                    >
                      <td className={`${adminCompactTdClass} font-semibold text-neutral-900`}>
                        <span className="block truncate">{user.name}</span>
                      </td>
                      <td className={`${adminCompactTdClass} text-neutral-600`}>
                        <span className="block truncate">{user.email}</span>
                      </td>
                      <td className={`${adminCompactTdClass} text-neutral-600`}>
                        <span className="block truncate">{user.phone}</span>
                      </td>
                      <td className={`${adminCompactTdClass} text-neutral-600`}>
                        <span className="block truncate">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString("en-IN")
                            : "—"}
                        </span>
                      </td>
                      <td className={adminCompactTdClass}>
                        <div className="flex flex-nowrap items-center gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingUser(user);
                            }}
                            className={iconBtnClass}
                            title="Edit"
                            aria-label="Edit user"
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(user._id);
                            }}
                            className={iconBtnDangerClass}
                            title="Delete"
                            aria-label="Delete user"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr className="border-b border-neutral-100 bg-neutral-50">
                        <td colSpan={5} className="px-3 py-3 sm:px-4">
                          <CustomerHistoryPanel
                            stats={history?.stats}
                            loading={historyLoadingId === userId}
                            error={history?.error}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          <AdminPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            loading={loading}
            onPageChange={(nextPage) => {
              setExpandedUserId(null);
              setPage(nextPage);
            }}
          />
        </div>
      )}

      <UserEditModal
        user={editingUser}
        isAdd={showAddUser}
        onClose={closeModal}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

export default UserSection;
