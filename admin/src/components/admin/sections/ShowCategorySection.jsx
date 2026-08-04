import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { deleteCategory } from "../../../api/api";
import { useAdminCategoriesQuery } from "../../../hooks/queries/useAdminCategoriesQuery";
import { adminQueryKeys } from "../../../hooks/queries/queryKeys";
import AdminAlert from "../AdminAlert";
import AdminPagination, { ADMIN_PAGE_SIZE } from "../AdminPagination";
import AdminSearchBar from "../AdminSearchBar";
import { IconEdit, IconTrash } from "../AdminIcons";
import {
  adminCompactTableClass,
  adminCompactTdClass,
  adminCompactThClass,
  adminTableHeaderClass,
  adminTableWrapperClass,
  iconBtnClass,
  iconBtnDangerClass,
  pageHeaderClass,
} from "../adminStyles";

function ShowCategorySection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const queryParams = useMemo(() => {
    const params = { page, limit: ADMIN_PAGE_SIZE };
    if (searchQuery.trim()) params.search = searchQuery.trim();
    return params;
  }, [page, searchQuery]);

  const { data, isLoading, isError, error: queryError } = useAdminCategoriesQuery(queryParams);

  const categories = data?.items || [];
  const pagination = data?.pagination || {
    page,
    limit: ADMIN_PAGE_SIZE,
    total: categories.length,
    totalPages: 1,
  };
  const loading = isLoading;
  const loadError = isError
    ? queryError?.response?.data?.message || "Failed to load categories"
    : "";

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories.all });
    },
  });

  const handleEdit = (cat) => {
    navigate("/categories/add", { state: { editCategory: cat } });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      setError("");
      setSuccess("");
      await deleteMutation.mutateAsync(id);
      setSuccess("Category deleted");
      if (categories.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category");
    }
  };

  return (
    <div className="min-w-0">
      <AdminAlert
        error={error || loadError}
        success={success}
        onClear={() => {
          setError("");
        }}
      />

      <div className={pageHeaderClass}>
        <p className="text-sm font-medium text-neutral-700">
          All categories ({pagination.total})
        </p>
      </div>

      <div className="mb-4">
        <AdminSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search categories or subcategories..."
        />
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : categories.length === 0 ? (
        <p className="text-text-secondary">No categories yet.</p>
      ) : (
        <div className={adminTableWrapperClass}>
          <table className={adminCompactTableClass}>
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[22%]" />
              <col className="w-[38%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead>
              <tr className={adminTableHeaderClass}>
                <th className={adminCompactThClass}>Image</th>
                <th className={adminCompactThClass}>Category Name</th>
                <th className={adminCompactThClass}>Subcategories</th>
                <th className={adminCompactThClass}>Status</th>
                <th className={adminCompactThClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat._id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                >
                  <td className={adminCompactTdClass}>
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white">
                      <img
                        src={cat.categoryImage}
                        alt={cat.categoryName}
                        className="h-8 w-8 object-contain"
                      />
                    </div>
                  </td>
                  <td className={`${adminCompactTdClass} font-semibold text-neutral-900`}>
                    <span className="block truncate">{cat.categoryName}</span>
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    <span className="block truncate">
                      {(cat.subcategories || []).join(", ") || "—"}
                    </span>
                  </td>
                  <td className={adminCompactTdClass}>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        cat.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={adminCompactTdClass}>
                    <div className="flex flex-nowrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(cat)}
                        className={iconBtnClass}
                        title="Edit category"
                        aria-label="Edit category"
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat._id)}
                        className={iconBtnDangerClass}
                        title="Delete category"
                        aria-label="Delete category"
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

export default ShowCategorySection;
