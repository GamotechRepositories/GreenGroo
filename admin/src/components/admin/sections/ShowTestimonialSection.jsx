import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteTestimonial, getAllTestimonials } from "../../../api/api";
import AdminAlert from "../AdminAlert";
import AdminPagination, { ADMIN_PAGE_SIZE } from "../AdminPagination";
import { IconEdit, IconTrash } from "../AdminIcons";
import {
  adminCompactTableClass,
  adminCompactTdClass,
  adminCompactThClass,
  adminTableHeaderClass,
  adminTableWrapperClass,
  btnPrimary,
  iconBtnClass,
  iconBtnDangerClass,
  pageHeaderActionsClass,
  pageHeaderClass,
} from "../adminStyles";

function ShowTestimonialSection() {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ADMIN_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getAllTestimonials({ page, limit: ADMIN_PAGE_SIZE });
      setTestimonials(data.data || []);
      setPagination(
        data.pagination || {
          page,
          limit: ADMIN_PAGE_SIZE,
          total: data.data?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleEdit = (item) => {
    navigate("/testimonials/add", { state: { editTestimonial: item } });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this testimonial?")) return;
    try {
      setError("");
      setSuccess("");
      await deleteTestimonial(id);
      setSuccess("Testimonial deleted");
      const nextPage = testimonials.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else fetchTestimonials();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete testimonial");
    }
  };

  return (
    <div className="min-w-0">
      <AdminAlert error={error} success={success} onClear={() => setError("")} />

      <div className={pageHeaderClass}>
        <p className="text-sm font-medium text-neutral-700">
          All testimonials ({pagination.total})
        </p>
        <div className={pageHeaderActionsClass}>
          <button
            type="button"
            onClick={() => navigate("/testimonials/add")}
            className={btnPrimary}
          >
            Add Testimonial
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : testimonials.length === 0 ? (
        <p className="text-text-secondary">No testimonials yet.</p>
      ) : (
        <div className={adminTableWrapperClass}>
          <table className={adminCompactTableClass}>
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[44%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className={adminTableHeaderClass}>
                <th className={adminCompactThClass}>Name</th>
                <th className={adminCompactThClass}>Text</th>
                <th className={adminCompactThClass}>Order</th>
                <th className={adminCompactThClass}>Status</th>
                <th className={adminCompactThClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                >
                  <td className={adminCompactTdClass}>
                    <p className="truncate font-semibold text-neutral-900">{item.name}</p>
                    <p className="mt-0.5 truncate text-[10px] text-neutral-500">
                      {item.role || "—"}
                    </p>
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    <span className="line-clamp-2 break-words text-[10px] sm:text-[11px]">
                      {item.text}
                    </span>
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    {item.order ?? 0}
                  </td>
                  <td className={adminCompactTdClass}>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        item.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={adminCompactTdClass}>
                    <div className="flex flex-nowrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className={iconBtnClass}
                        title="Edit testimonial"
                        aria-label="Edit testimonial"
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className={iconBtnDangerClass}
                        title="Delete testimonial"
                        aria-label="Delete testimonial"
                      >
                        <IconTrash />
                      </button>
                    </div>
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
    </div>
  );
}

export default ShowTestimonialSection;
