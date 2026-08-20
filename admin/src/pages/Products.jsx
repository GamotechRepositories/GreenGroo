import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Layers,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Upload,
  Link2,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  Eye,
  EyeOff,
  Image as ImageIcon,
  FolderTree,
  ChevronDown,
  Loader2,
  ArrowLeft,
  Tag,
  Boxes,
  IndianRupee,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  List,
} from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5001';

const DEPARTMENT_OPTIONS = [
  { slug: 'greengrocc', name: 'GreenGrocc', color: 'emerald', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' },
  { slug: 'ready2cook', name: 'Ready2Cook', color: 'amber', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' },
  { slug: 'supermall', name: 'SuperMall', color: 'blue', bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800' },
];

export default function Products() {
  // Data state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering & View state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, in_stock, out_of_stock
  const [viewMode, setViewMode] = useState('table'); // table or grid

  // Full-page Add/Edit Mode
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    department: 'greengrocc',
    category: '',
    subcategory: '',
    brandName: 'GreenGrocc',
    price: '',
    discountedPrice: '',
    discountedPercent: 0,
    stock: 100,
    inStock: true,
    minOrderQuantity: 1,
    stepByQuantity: 1,
    productImages: [],
    description: '',
    features: [],
    specifications: [],
    isActive: true,
  });

  // Image Upload helper state
  const [imageMode, setImageMode] = useState('upload'); // upload or url
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef(null);

  // Temp feature & spec inputs
  const [featureInput, setFeatureInput] = useState('');
  const [specKeyInput, setSpecKeyInput] = useState('');
  const [specValInput, setSpecValInput] = useState('');

  // 1. Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch products, categories, sections in parallel
      const [prodRes, catRes, secRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/api/products?limit=500`),
        axios.get(`${API_BASE}/api/categories/all`),
        axios.get(`${API_BASE}/api/sections`),
      ]);

      if (prodRes.status === 'fulfilled') {
        const pData = prodRes.value.data;
        if (pData?.data && Array.isArray(pData.data)) {
          setProducts(pData.data);
        } else if (Array.isArray(pData)) {
          setProducts(pData);
        } else {
          setProducts([]);
        }
      }

      if (catRes.status === 'fulfilled') {
        const cData = catRes.value.data;
        setCategories(Array.isArray(cData?.data) ? cData.data : Array.isArray(cData) ? cData : []);
      }

      if (secRes.status === 'fulfilled') {
        const sData = secRes.value.data;
        setSections(Array.isArray(sData?.data) ? sData.data : Array.isArray(sData) ? sData : []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load products. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered categories for the chosen department in form
  const availableCategoriesForForm = useMemo(() => {
    if (!formData.department) return categories;
    return categories.filter((c) => {
      const sec = (c.section || '').toLowerCase();
      return sec === formData.department.toLowerCase();
    });
  }, [categories, formData.department]);

  // Available subcategories for the selected category
  const availableSubcategoriesForForm = useMemo(() => {
    if (!formData.category) return [];
    const found = categories.find(
      (c) => c.categoryName.toLowerCase() === formData.category.toLowerCase()
    );
    return Array.isArray(found?.subcategories) ? found.subcategories : [];
  }, [categories, formData.category]);

  // Open Create Form
  const handleOpenCreate = () => {
    const defaultCat = categories[0]?.categoryName || '';
    const defaultSub = categories[0]?.subcategories?.[0] || 'General';
    const defaultSec = categories[0]?.section || 'greengrocc';

    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `GRN-${Date.now().toString().slice(-6)}`,
      department: defaultSec,
      category: defaultCat,
      subcategory: defaultSub,
      brandName: 'GreenGrocc',
      price: '',
      discountedPrice: '',
      discountedPercent: 0,
      stock: 100,
      inStock: true,
      minOrderQuantity: 1,
      stepByQuantity: 1,
      productImages: [],
      description: '',
      features: [],
      specifications: [],
      isActive: true,
    });
    setImageUrlInput('');
    setFeatureInput('');
    setSpecKeyInput('');
    setSpecValInput('');
    setIsEditorOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (product) => {
    const primaryCat = Array.isArray(product.categories) ? product.categories[0] : product.category || '';
    const foundCat = categories.find((c) => c.categoryName.toLowerCase() === primaryCat.toLowerCase());

    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      department: product.section || foundCat?.section || 'greengrocc',
      category: primaryCat,
      subcategory: product.subcategory || (Array.isArray(product.subcategories) ? product.subcategories[0] : '') || 'General',
      brandName: product.brandName || 'GreenGrocc',
      price: product.price != null ? String(product.price) : '',
      discountedPrice: product.discountedPrice != null ? String(product.discountedPrice) : '',
      discountedPercent: product.discountedPercent || 0,
      stock: product.stock != null ? product.stock : 100,
      inStock: product.inStock !== undefined ? product.inStock : true,
      minOrderQuantity: product.minOrderQuantity || 1,
      stepByQuantity: product.stepByQuantity || 1,
      productImages: Array.isArray(product.productImages) ? [...product.productImages] : [],
      description: product.description || '',
      features: Array.isArray(product.features) ? [...product.features] : [],
      specifications: Array.isArray(product.specifications) ? [...product.specifications] : [],
      isActive: product.isActive !== undefined ? product.isActive : true,
    });
    setImageUrlInput('');
    setFeatureInput('');
    setSpecKeyInput('');
    setSpecValInput('');
    setIsEditorOpen(true);
  };

  // Auto-calculate discount percentage or price
  const handlePriceChange = (priceVal, discVal) => {
    const p = parseFloat(priceVal) || 0;
    const d = parseFloat(discVal) || 0;

    let pct = 0;
    if (p > 0 && d > 0 && d < p) {
      pct = Math.round(((p - d) / p) * 100);
    }

    setFormData((prev) => ({
      ...prev,
      price: priceVal,
      discountedPrice: discVal,
      discountedPercent: pct,
    }));
  };

  // Image Upload to S3
  const handleImageFileChange = async (file) => {
    if (!file) return;
    try {
      setImageUploading(true);
      setError('');

      const presignRes = await axios.post(`${API_BASE}/api/upload/presign`, {
        fileName: file.name,
        fileType: file.type,
      });

      const { uploadUrl, fileUrl } = presignRes.data;

      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
      });

      setFormData((prev) => ({
        ...prev,
        productImages: [...prev.productImages, fileUrl],
      }));
      setSuccessMsg('Image uploaded successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Image upload failed:', err);
      setError('Image upload failed. You can paste a direct Image URL instead.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!formData.productImages.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        productImages: [...prev.productImages, trimmed],
      }));
    }
    setImageUrlInput('');
  };

  const handleRemoveImage = (imgUrl) => {
    setFormData((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((img) => img !== imgUrl),
    }));
  };

  // Feature bullet points
  const handleAddFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    if (!formData.features.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, features: [...prev.features, trimmed] }));
    }
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  // Specifications
  const handleAddSpec = () => {
    const k = specKeyInput.trim();
    const v = specValInput.trim();
    if (!k || !v) return;
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { name: k, value: v }],
    }));
    setSpecKeyInput('');
    setSpecValInput('');
  };

  const handleRemoveSpec = (idx) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== idx),
    }));
  };

  // Form Submit (Create or Update)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!formData.category) {
      setError('Please select a product category');
      return;
    }
    if (!formData.productImages.length) {
      setError('Please upload or provide at least one product image');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid regular price');
      return;
    }

    const discNum = parseFloat(formData.discountedPrice) || priceNum;

    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || undefined,
        categories: [formData.category],
        subcategory: formData.subcategory.trim() || 'General',
        subcategories: [formData.subcategory.trim() || 'General'],
        brandName: formData.brandName.trim() || 'GreenGrocc',
        price: priceNum,
        discountedPrice: discNum,
        discountedPercent: formData.discountedPercent || 0,
        stock: parseInt(formData.stock, 10) || 0,
        inStock: Boolean(formData.inStock),
        minOrderQuantity: parseInt(formData.minOrderQuantity, 10) || 1,
        stepByQuantity: parseInt(formData.stepByQuantity, 10) || 1,
        productImages: formData.productImages,
        description: formData.description.trim(),
        features: formData.features,
        specifications: formData.specifications,
        isActive: Boolean(formData.isActive),
        section: formData.department,
        storeType: formData.department === 'ready2cook' ? 'festive' : formData.department === 'supermall' ? 'mall' : 'main',
      };

      if (editingProduct) {
        await axios.put(`${API_BASE}/api/products/${editingProduct._id}`, payload);
        setSuccessMsg(`Product "${formData.name}" updated successfully!`);
      } else {
        await axios.post(`${API_BASE}/api/products`, payload);
        setSuccessMsg(`Product "${formData.name}" created successfully!`);
      }

      setIsEditorOpen(false);
      setEditingProduct(null);
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to save product:', err);
      setError(err.response?.data?.message || 'Failed to save product. Please check fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const confirmDelete = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      setError('');
      await axios.delete(`${API_BASE}/api/products/${productToDelete._id}`);
      setSuccessMsg(`Product "${productToDelete.name}" deleted successfully.`);
      setDeleteModalOpen(false);
      setProductToDelete(null);
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Delete product failed:', err);
      setError(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle In-Stock quickly
  const handleToggleStock = async (product) => {
    try {
      const updatedInStock = !product.inStock;
      await axios.put(`${API_BASE}/api/products/${product._id}`, {
        inStock: updatedInStock,
        stock: updatedInStock ? (product.stock > 0 ? product.stock : 50) : 0,
      });
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, inStock: updatedInStock } : p))
      );
    } catch (err) {
      console.error('Toggle stock failed:', err);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(query);
        const matchesSku = (p.sku || '').toLowerCase().includes(query);
        const matchesBrand = (p.brandName || '').toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesBrand) return false;
      }

      // Department
      if (selectedDepartment !== 'all') {
        const pSec = (p.section || '').toLowerCase();
        if (pSec !== selectedDepartment.toLowerCase()) return false;
      }

      // Category
      if (selectedCategory !== 'all') {
        const pCats = Array.isArray(p.categories) ? p.categories : [p.category];
        const hasCat = pCats.some((c) => String(c || '').toLowerCase() === selectedCategory.toLowerCase());
        if (!hasCat) return false;
      }

      // Stock
      if (stockFilter === 'in_stock' && !p.inStock) return false;
      if (stockFilter === 'out_of_stock' && p.inStock) return false;

      return true;
    });
  }, [products, searchQuery, selectedDepartment, selectedCategory, stockFilter]);

  // Metric Stats
  const metrics = useMemo(() => {
    const total = products.length;
    const inStockCount = products.filter((p) => p.inStock).length;
    const outOfStockCount = total - inStockCount;
    const activeCount = products.filter((p) => p.isActive).length;
    return { total, inStockCount, outOfStockCount, activeCount };
  }, [products]);

  // -------------------------------------------------------------
  // RENDER: FULL-PAGE PRODUCT EDITOR
  // -------------------------------------------------------------
  if (isEditorOpen) {
    const previewImage = formData.productImages[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&h=400&q=80';
    const previewSelling = parseFloat(formData.discountedPrice) || parseFloat(formData.price) || 0;
    const previewMrp = parseFloat(formData.price) || previewSelling;

    return (
      <div className="space-y-6 pb-12">
        {/* Top Header & Breadcrumb Bar */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer font-bold text-slate-600 dark:text-slate-300"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Products</span>
                </button>
                <span>/</span>
                <span className="text-slate-900 dark:text-white font-semibold">
                  {editingProduct ? `Edit: ${editingProduct.name}` : 'New Product'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product to Store'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure department mapping, pricing, stock inventory, and media gallery
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>{editingProduct ? 'Update Product' : 'Publish Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-Column Form: Single Outer Container with Seamless Flat Color Bands */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden divide-y divide-slate-200/70 dark:divide-slate-800">

            {/* STEP 1: Department & Basic Info (Fresh Soft Sky Blue Tint) */}
            <div className="bg-sky-50/50 dark:bg-sky-950/20 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-white font-bold text-xs shadow-xs">
                  1
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Department & Categorization
                  </h3>
                  <p className="text-[11px] text-sky-800/80 dark:text-sky-300">
                    Map this product to a store department, category, and subcategory
                  </p>
                </div>
              </div>

              {/* Department Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Store Department <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {DEPARTMENT_OPTIONS.map((dept) => {
                    const isSelected = formData.department === dept.slug;
                    return (
                      <button
                        key={dept.slug}
                        type="button"
                        onClick={() => {
                          const matchingCats = categories.filter(
                            (c) => (c.section || '').toLowerCase() === dept.slug.toLowerCase()
                          );
                          setFormData((prev) => ({
                            ...prev,
                            department: dept.slug,
                            category: matchingCats[0]?.categoryName || '',
                            subcategory: matchingCats[0]?.subcategories?.[0] || 'General',
                          }));
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                        }`}
                      >
                        {dept.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product Name & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Product Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fresh Organic Tomatoes 1kg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SKU Code Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TOM-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 shadow-2xs"
                  />
                </div>
              </div>

              {/* Category & Subcategory Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const chosenCat = e.target.value;
                      const catObj = categories.find((c) => c.categoryName.toLowerCase() === chosenCat.toLowerCase());
                      setFormData((prev) => ({
                        ...prev,
                        category: chosenCat,
                        subcategory: catObj?.subcategories?.[0] || 'General',
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer shadow-2xs"
                  >
                    <option value="" disabled>Select category</option>
                    {availableCategoriesForForm.map((cat) => (
                      <option key={cat._id || cat.slug} value={cat.categoryName}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subcategory / Filter
                  </label>
                  {availableSubcategoriesForForm.length > 0 ? (
                    <select
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer shadow-2xs"
                    >
                      {availableSubcategoriesForForm.map((sub, i) => (
                        <option key={i} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Leafy Greens"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 shadow-2xs"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GreenGrocc"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: Pricing & Stock Inventory (Soft Emerald Tint) */}
            <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xs">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Pricing & Inventory Stock
                  </h3>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300">
                    Set selling price, MRP, discounts, and inventory availability
                  </p>
                </div>
              </div>

              {/* Price & Discount Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    MRP Original Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="e.g. 60"
                      value={formData.price}
                      onChange={(e) => handlePriceChange(e.target.value, formData.discountedPrice)}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Selling Discounted Price (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 text-sm font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 45"
                      value={formData.discountedPrice}
                      onChange={(e) => handlePriceChange(formData.price, e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discount % Off
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-emerald-700 dark:text-emerald-400 shadow-2xs flex items-center justify-between">
                    <span>{formData.discountedPercent}% OFF</span>
                    <span className="text-[10px] font-normal text-slate-400">Auto</span>
                  </div>
                </div>
              </div>

              {/* Stock Quantity & In Stock Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Inventory Stock (Units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 100"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Min Order Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, minOrderQuantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-6">
                  <input
                    type="checkbox"
                    id="productInStock"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="productInStock" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Available in Stock
                  </label>
                </div>
              </div>
            </div>

            {/* STEP 3: Media, Description & Specifications (Soft Amber Tint) */}
            <div className="bg-amber-50/40 dark:bg-amber-950/20 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white font-bold text-xs shadow-xs">
                  3
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Media Gallery & Product Details
                  </h3>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300">
                    Upload product images, write short descriptions and add specifications
                  </p>
                </div>
              </div>

              {/* Upload or URL Switcher */}
              <div className="space-y-3">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-800 border border-amber-500/20 dark:border-slate-700 w-fit">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      imageMode === 'upload'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      imageMode === 'url'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    <span>Image URL</span>
                  </button>
                </div>

                {imageMode === 'upload' ? (
                  <div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileChange(e.target.files?.[0])}
                    />
                    <div
                      onClick={() => !imageUploading && imageInputRef.current?.click()}
                      className="relative rounded-2xl border-2 border-dashed border-amber-300/80 dark:border-amber-700/60 hover:border-amber-500 transition-colors cursor-pointer overflow-hidden bg-white dark:bg-slate-800 group h-32 flex items-center justify-center shadow-2xs"
                    >
                      {imageUploading ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
                          <span className="text-xs font-semibold text-amber-700">Uploading to S3...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 p-4 text-center">
                          <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            Click to upload product image
                          </p>
                          <p className="text-[11px] text-slate-400">JPG, PNG, WEBP</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... or /products/item.webp"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                    >
                      Add Image
                    </button>
                  </div>
                )}

                {/* Thumbnails Gallery */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {formData.productImages.map((img, idx) => (
                    <div key={idx} className="relative group h-16 w-16 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white shadow-2xs">
                      <img src={img} alt="Thumb" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <Trash2 className="h-4 w-4 text-rose-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Fresh farm-picked produce delivered within 10 minutes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-2xs"
                />
              </div>

              {/* Key Features Bullet points */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Key Highlights / Features
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. 100% Organic, No Pesticides (Press Enter)"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.features.map((feat, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 dark:bg-slate-700 dark:text-amber-200 text-xs border border-amber-300/40">
                      <span>{feat}</span>
                      <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-amber-600 hover:text-rose-600">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="productIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="productIsActive" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Active & visible on customer storefront
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Live Product Preview */}
          <div className="space-y-4">
            <div className="sticky top-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Customer Preview
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  Storefront Card
                </span>
              </div>

              {/* Mock Mobile Product Card */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/90 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Product Image Box */}
                <div className="relative h-44 w-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-3">
                  <img
                    src={previewImage}
                    alt="Product Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&h=400&q=80';
                    }}
                  />
                  {formData.discountedPercent > 0 && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[10px] shadow-xs">
                      {formData.discountedPercent}% OFF
                    </span>
                  )}
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold text-[10px] shadow-xs border border-slate-200/60">
                    {formData.department === 'ready2cook' ? 'Ready2Cook' : formData.department === 'supermall' ? 'SuperMall' : 'GreenGrocc'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>{formData.category || 'Category'}</span>
                    <span>•</span>
                    <span>{formData.subcategory || 'Subcategory'}</span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {formData.name || 'Sample Product Name'}
                  </h4>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      ₹{previewSelling}
                    </span>
                    {previewMrp > previewSelling && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{previewMrp}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60">
                    <span className={`text-[11px] font-bold ${formData.inStock ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {formData.inStock ? '● In Stock' : '✕ Out of Stock'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formData.sku || 'SKU-001'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel & Return
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: MAIN PRODUCT CATALOG (TABLE & GRID)
  // -------------------------------------------------------------
  return (
    <div className="space-y-5 pb-10">
      {/* Alert Notices */}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold shadow-xs">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hero Header & Metric Stats Ribbon (ONE Single Unified Card) */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-5">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Package className="h-4 w-4" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Product Inventory & Catalog
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage store products, live pricing, stock availability, and department mapping
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Product</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Stats Boxes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Products</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{metrics.total}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">In Stock</span>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{metrics.inStockCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Out of Stock</span>
            <div className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5">{metrics.outOfStockCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">Active in Store</span>
            <div className="text-xl font-black text-sky-700 dark:text-sky-400 mt-0.5">{metrics.activeCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by title, SKU, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Department, Category, Stock Dropdowns & View Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Department */}
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedCategory('all');
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept.slug} value={dept.slug}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer max-w-[150px]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c._id || c.slug} value={c.categoryName}>
                  {c.categoryName}
                </option>
              ))}
            </select>

            {/* Stock */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              <option value="all">All Stock</option>
              <option value="in_stock">In Stock Only</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs' : 'text-slate-400'
                }`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-xs' : 'text-slate-400'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS DISPLAY */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading catalog items...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No products found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {searchQuery || selectedDepartment !== 'all' || selectedCategory !== 'all'
              ? 'Try clearing your filters or search keywords to view products.'
              : 'Your store catalog is empty. Click "+ New Product" to add your first item.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
          >
            + Add Product
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price & MRP</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredProducts.map((p) => {
                  const img = Array.isArray(p.productImages) && p.productImages[0] ? p.productImages[0] : '';
                  const dept = DEPARTMENT_OPTIONS.find((d) => d.slug === p.section) || DEPARTMENT_OPTIONS[0];
                  const primaryCat = Array.isArray(p.categories) ? p.categories[0] : p.category;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                            {img ? (
                              <img src={img} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {p.sku || 'N/A'} • {p.brandName || 'GreenGrocc'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${dept.bg}`}>
                          {dept.name}
                        </span>
                      </td>

                      {/* Category & Subcategory */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{primaryCat || '—'}</div>
                        <div className="text-[10px] text-slate-400">{p.subcategory || 'General'}</div>
                      </td>

                      {/* Pricing */}
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-900 dark:text-white">
                          ₹{p.discountedPrice != null ? p.discountedPrice : p.price}
                        </div>
                        {p.price > p.discountedPrice && (
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-400 line-through">₹{p.price}</span>
                            <span className="font-bold text-rose-500">({p.discountedPercent}% off)</span>
                          </div>
                        )}
                      </td>

                      {/* Stock Toggle */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                            p.inStock
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${p.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{p.inStock ? `${p.stock || 'In'} Stock` : 'Out of Stock'}</span>
                        </button>
                      </td>

                      {/* Active Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          p.isActive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
                        }`}>
                          {p.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const img = Array.isArray(p.productImages) && p.productImages[0] ? p.productImages[0] : '';
            const dept = DEPARTMENT_OPTIONS.find((d) => d.slug === p.section) || DEPARTMENT_OPTIONS[0];
            const primaryCat = Array.isArray(p.categories) ? p.categories[0] : p.category;

            return (
              <div
                key={p._id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-36 w-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-3">
                    {img ? (
                      <img src={img} alt={p.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Package className="h-8 w-8 text-slate-300" />
                    )}
                    <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${dept.bg}`}>
                      {dept.name}
                    </span>
                    {p.discountedPercent > 0 && (
                      <span className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-black text-[9px]">
                        {p.discountedPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-1.5">
                    <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {primaryCat || 'General'}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {p.name}
                    </h4>
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        ₹{p.discountedPrice != null ? p.discountedPrice : p.price}
                      </span>
                      {p.price > p.discountedPrice && (
                        <span className="text-xs text-slate-400 line-through">₹{p.price}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                  <span className={`text-[10px] font-bold ${p.inStock ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {p.inStock ? '● In Stock' : '✕ Out'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(p)}
                      className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Product</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{productToDelete.name}"</strong>? It will be removed from customer searches and storefront inventory.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete Product</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
