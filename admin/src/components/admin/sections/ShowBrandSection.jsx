import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { deleteBrand, updateBrand } from "../../../api/api";
import { useAdminBrandsQuery } from "../../../hooks/queries/useAdminBrandsQuery";
import { adminQueryKeys } from "../../../hooks/queries/queryKeys";
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

function ShowBrandSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);

  const queryParams = useMemo(
    () => ({ page, limit: ADMIN_PAGE_SIZE }),
    [page]
  );

  const { data, isLoading, isError, error: queryError } = useAdminBrandsQuery(queryParams);

  const brands = data?.items || [];
  const pagination = data?.pagination || {
    page,
    limit: ADMIN_PAGE_SIZE,
    total: brands.length,
    totalPages: 1,
  };
  const loading = isLoading;
  const loadError = isError
    ? queryError?.response?.data?.message || "Failed to load brands"
    : "";

  const deleteMutation = useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.brands.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateBrand(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.brands.all });
    },
  });

  const handleEdit = (brand) => {
    navigate("/brands/add", { state: { editBrand: brand } });
  };

  const handleTogglePriceLogin = async (brand) => {
    try {
      setError("");
      setSuccess("");
      await updateMutation.mutateAsync({
        id: brand._id,
        payload: { priceRequiresLogin: !brand.priceRequiresLogin },
      });
      setSuccess(
        brand.priceRequiresLogin
          ? `Prices for ${brand.brandName} are now visible without login`
          : `Prices for ${brand.brandName} now require login`
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update brand");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this brand?")) return;
    try {
      setError("");
      setSuccess("");
      await deleteMutation.mutateAsync(id);
      setSuccess("Brand deleted");
      if (brands.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete brand");
    }
  };

  return (
    <div className="min-w-0">
      <AdminAlert
        error={error || loadError}
        success={success}
        onClear={() => setError("")}
      />

      <div className={pageHeaderClass}>
        <p className="text-sm font-medium text-neutral-700">
          All brands ({pagination.total})
        </p>
        <div className={pageHeaderActionsClass}>
          <button
            type="button"
            onClick={() => navigate("/brands/add")}
            className={btnPrimary}
          >
            Add Brand
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading...</p>
      ) : brands.length === 0 ? (
        <p className="text-text-secondary">No brands yet.</p>
      ) : (
        <div className={adminTableWrapperClass}>
          <table className={adminCompactTableClass}>
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[28%]" />
              <col className="w-[16%]" />
              <col className="w-[24%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className={adminTableHeaderClass}>
                <th className={adminCompactThClass}>Image</th>
                <th className={adminCompactThClass}>Brand Name</th>
                <th className={adminCompactThClass}>Status</th>
                <th className={adminCompactThClass}>Price visibility</th>
                <th className={adminCompactThClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr
                  key={brand._id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                >
                  <td className={adminCompactTdClass}>
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white">
                      <img
                        src={brand.brandImage}
                        alt={brand.brandName}
                        className="h-8 w-8 object-contain"
                      />
                    </div>
                  </td>
                  <td className={`${adminCompactTdClass} font-semibold text-neutral-900`}>
                    <span className="block truncate">{brand.brandName}</span>
                  </td>
                  <td className={adminCompactTdClass}>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        brand.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {brand.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={adminCompactTdClass}>
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(brand.priceRequiresLogin)}
                        disabled={updateMutation.isPending}
                        onChange={() => handleTogglePriceLogin(brand)}
                        className="h-4 w-4 accent-primary"
                        aria-label={`Require login to see ${brand.brandName} prices`}
                      />
                      <span className="text-[11px] font-medium text-neutral-700">
                        {brand.priceRequiresLogin ? "Login only" : "Public"}
                      </span>
                    </label>
                  </td>
                  <td className={adminCompactTdClass}>
                    <div className="flex flex-nowrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(brand)}
                        className={iconBtnClass}
                        title="Edit brand"
                        aria-label="Edit brand"
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(brand._id)}
                        className={iconBtnDangerClass}
                        title="Delete brand"
                        aria-label="Delete brand"
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

export default ShowBrandSection;
