import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { deleteProduct } from "../../../api/api";
import { useAdminCategoryOptionsQuery } from "../../../hooks/queries/useAdminCategoriesQuery";
import { useAdminProductsQuery } from "../../../hooks/queries/useAdminProductsQuery";
import { adminQueryKeys } from "../../../hooks/queries/queryKeys";
import AdminAlert from "../AdminAlert";
import AdminPagination, { ADMIN_PAGE_SIZE } from "../AdminPagination";
import ProductDetailModal from "../ProductDetailModal";
import AdminProductPrice from "../AdminProductPrice";
import { IconEdit, IconTrash } from "../AdminIcons";
import {
  adminCompactTableClass,
  adminCompactTdClass,
  adminCompactThClass,
  adminTableHeaderClass,
  adminTableWrapperClass,
  iconBtnClass,
  iconBtnDangerClass,
} from "../adminStyles";
import ProductListFilters from "./ProductListFilters";

const ALLOWED_STATUS_FILTERS = new Set([
  "all",
  "active",
  "inactive",
  "out_of_stock",
  "low_stock",
]);

function ShowProductSection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status && ALLOWED_STATUS_FILTERS.has(status)) {
      setStatusFilter(status);
      setPage(1);
    }
  }, [searchParams]);

  const { data: categoryData = [] } = useAdminCategoryOptionsQuery();
  const categoryOptions = useMemo(
    () => categoryData.map((category) => category.categoryName),
    [categoryData]
  );

  const queryParams = useMemo(() => {
    const params = {
      page,
      limit: ADMIN_PAGE_SIZE,
      sortBy,
      sortDir,
    };
    if (selectedCategory !== "all") params.category = selectedCategory;
    if (statusFilter !== "all") params.status = statusFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    return params;
  }, [page, selectedCategory, statusFilter, searchQuery, sortBy, sortDir]);

  const { data, isLoading, isError, error: queryError } = useAdminProductsQuery(queryParams);

  const products = data?.items || [];
  const pagination = data?.pagination || {
    page,
    limit: ADMIN_PAGE_SIZE,
    total: products.length,
    totalPages: 1,
  };
  const statusCounts = data?.statusCounts || null;
  const loading = isLoading;
  const loadError = isError
    ? queryError?.response?.data?.message || "Failed to load products"
    : "";

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, statusFilter, searchQuery, sortBy, sortDir]);

  useEffect(() => {
    if (!selectedProduct) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") setSelectedProduct(null);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [selectedProduct]);

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.products.all });
    },
  });

  const handleEdit = (product) => {
    navigate("/products/add", { state: { editProduct: product } });
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm("Delete this product?")) return;
    try {
      setError("");
      setSuccess("");
      await deleteMutation.mutateAsync(id);
      setSuccess("Product deleted");
      if (selectedProduct?._id === id) setSelectedProduct(null);
      if (products.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product");
    }
  };

  return (
    <div className="min-w-0">
      <AdminAlert
        error={error || loadError}
        success={success}
        onClear={() => setError("")}
      />

      <ProductListFilters
        categories={categoryOptions}
        totalCount={statusCounts?.all ?? pagination.total}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusCounts={statusCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDir={sortDir}
        onSortDirToggle={() => setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))}
      />

      <p className="mb-4 mt-4 text-sm font-medium text-neutral-700">
        {pagination.total} product{pagination.total === 1 ? "" : "s"} · Click a row to view full
        details
      </p>

      {loading ? (
        <p className="text-text-secondary">Loading products...</p>
      ) : pagination.total === 0 ? (
        <p className="text-text-secondary">No products found.</p>
      ) : products.length === 0 ? (
        <p className="text-text-secondary">No products on this page.</p>
      ) : (
        <div className={adminTableWrapperClass}>
          <table className={adminCompactTableClass}>
            <colgroup>
              <col className="w-[7%]" />
              <col className="w-[17%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[7%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              <tr className={adminTableHeaderClass}>
                <th className={adminCompactThClass}>Image</th>
                <th className={adminCompactThClass}>Product Name</th>
                <th className={adminCompactThClass}>SKU</th>
                <th className={adminCompactThClass}>Brand</th>
                <th className={adminCompactThClass}>Categories</th>
                <th className={adminCompactThClass}>Price</th>
                <th className={adminCompactThClass}>In stock</th>
                <th className={adminCompactThClass}>Status</th>
                <th className={adminCompactThClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product._id}
                  onClick={() => setSelectedProduct(product)}
                  className="cursor-pointer border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                >
                  <td className={adminCompactTdClass}>
                    <div className="h-8 w-8 overflow-hidden rounded border border-neutral-200 bg-neutral-50">
                      {product.productImages?.[0] ? (
                        <img
                          src={product.productImages[0]}
                          alt={product.name}
                          className="h-full w-full object-contain p-0.5"
                        />
                      ) : null}
                    </div>
                  </td>
                  <td className={`${adminCompactTdClass} font-semibold text-neutral-900`}>
                    <span className="line-clamp-2 break-words">{product.name}</span>
                  </td>
                  <td className={`${adminCompactTdClass} font-mono text-[10px] text-neutral-600`}>
                    <span className="block truncate">{product.sku || "—"}</span>
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    <span className="block truncate">{product.brandName}</span>
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-600`}>
                    <span className="line-clamp-2 break-words">
                      {product.categories?.length
                        ? `${product.categories.join(", ")}${
                            (product.subcategories?.length
                              ? product.subcategories
                              : product.subcategory
                                ? [product.subcategory]
                                : []
                            ).length
                              ? ` / ${(product.subcategories?.length ? product.subcategories : [product.subcategory]).join(", ")}`
                              : ""
                          }`
                        : "—"}
                    </span>
                  </td>
                  <td className={adminCompactTdClass}>
                    <AdminProductPrice product={product} />
                  </td>
                  <td className={`${adminCompactTdClass} text-neutral-800`}>
                    {product.inStock !== false ? "In stock" : "Out of stock"}
                  </td>
                  <td className={adminCompactTdClass}>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium lowercase ${
                        product.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.isActive ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className={adminCompactTdClass} onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-nowrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className={iconBtnClass}
                        title="Edit"
                        aria-label="Edit product"
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(product._id, e)}
                        className={iconBtnDangerClass}
                        title="Delete"
                        aria-label="Delete product"
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

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onEdit={handleEdit}
      />
    </div>
  );
}

export default ShowProductSection;
