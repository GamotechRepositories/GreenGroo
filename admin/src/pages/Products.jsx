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
  Palette,
  Video,
  Play,
  Star,
  ChevronLeft,
  ChevronRight,
  Film,
} from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5001';

const DEPARTMENT_OPTIONS = [
  { slug: 'greengrocc', name: 'GreenGrocc', color: 'emerald', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  { slug: 'ready2cook', name: 'Ready2Cook', color: 'amber', dot: 'bg-amber-500', bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  { slug: 'supermall', name: 'SuperMall', color: 'blue', dot: 'bg-sky-500', bg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
];

const PRODUCT_GLOW_THEMES = [
  { name: 'Clean (Default)', hex: '', borderHex: '#E2E8F0' },
  { name: 'Emerald Fresh', hex: '#10B981', borderHex: '#10B981' },
  { name: 'Warm Amber', hex: '#F59E0B', borderHex: '#F59E0B' },
  { name: 'Sky Azure', hex: '#0EA5E9', borderHex: '#0EA5E9' },
  { name: 'Royal Purple', hex: '#8B5CF6', borderHex: '#8B5CF6' },
  { name: 'Rose Blush', hex: '#EC4899', borderHex: '#EC4899' },
  { name: 'Citrus Gold', hex: '#EAB308', borderHex: '#EAB308' },
  { name: 'Ocean Cyan', hex: '#06B6D4', borderHex: '#06B6D4' },
  { name: 'Forest Jade', hex: '#059669', borderHex: '#059669' },
];

// Helper functions for bulletproof hex color formatting
const formatHexGlow = (raw) => {
  if (!raw) return '';
  let clean = String(raw).trim();
  if (clean.startsWith('#')) {
    clean = '#' + clean.slice(1).replace(/[^0-9A-Fa-f]/g, '').slice(0, 8);
  } else if (/^[0-9A-Fa-f]+$/.test(clean)) {
    clean = '#' + clean.slice(0, 8);
  } else {
    clean = clean.replace(/[^0-9A-Fa-f#]/g, '');
    if (!clean.startsWith('#') && clean.length > 0) clean = '#' + clean;
  }
  return clean;
};

const getValidColorPickerHex = (raw) => {
  if (!raw) return '#10B981';
  const hex = formatHexGlow(raw);
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
  if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  if (/^#[0-9A-Fa-f]{8}$/.test(hex)) {
    return hex.slice(0, 7);
  }
  return '#10B981';
};

const getGlowBgStyle = (raw, alpha = '0D') => {
  if (!raw) return undefined;
  const hex = formatHexGlow(raw);
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return `${hex}${alpha}`;
  }
  return hex;
};

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
    maxOrderQuantity: '',
    stepByQuantity: 1,
    cardGlowColor: '',
    badge: '',
    productImages: [],
    videoUrl: '',
    description: '',
    features: [],
    specifications: [],
    isActive: true,
  });

  // Media Upload helper states
  const [imageMode, setImageMode] = useState('upload'); // upload or url
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const imageInputRef = useRef(null);

  const [videoMode, setVideoMode] = useState('upload'); // upload or url
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const videoInputRef = useRef(null);

  // Live preview image & video switcher
  const [previewImageIdx, setPreviewImageIdx] = useState(0);
  const [previewShowVideo, setPreviewShowVideo] = useState(false);

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
      maxOrderQuantity: '',
      stepByQuantity: 1,
      cardGlowColor: '',
      badge: '',
      productImages: [],
      videoUrl: '',
      description: '',
      features: [],
      specifications: [],
      isActive: true,
    });
    setImageUrlInput('');
    setVideoUrlInput('');
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
      minOrderQuantity: product.minOrderQuantity ?? 1,
      maxOrderQuantity: product.maxOrderQuantity ?? product.maxOrderQty ?? '',
      stepByQuantity: product.stepByQuantity || 1,
      cardGlowColor: product.cardGlowColor || product.glowColor || '',
      badge: product.badge || '',
      productImages: Array.isArray(product.productImages) ? [...product.productImages] : [],
      videoUrl: product.videoUrl || '',
      description: product.description || '',
      features: Array.isArray(product.features) ? [...product.features] : [],
      specifications: Array.isArray(product.specifications) ? [...product.specifications] : [],
      isActive: product.isActive !== undefined ? product.isActive : true,
    });
    setImageUrlInput('');
    setVideoUrlInput(product.videoUrl || '');
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

  // Multiple Images Upload to S3
  const handleMultipleImagesUpload = async (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const files = Array.from(filesList);
    try {
      setImageUploading(true);
      setError('');
      setUploadProgressText(`Uploading ${files.length} image(s)...`);

      const uploadData = new FormData();
      files.forEach((file) => {
        uploadData.append('files', file);
      });
      uploadData.append('folder', 'products');

      const res = await axios.post(`${API_BASE}/api/upload`, uploadData);
      const data = res.data;

      if (data.success) {
        const newUrls = Array.isArray(data.urls)
          ? data.urls
          : data.url
          ? [data.url]
          : [];
        setFormData((prev) => ({
          ...prev,
          productImages: [...prev.productImages, ...newUrls],
        }));
        setSuccessMsg(`${newUrls.length} image(s) uploaded successfully!`);
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        setError(data.message || 'Image upload failed');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setError(err.response?.data?.message || err.message || 'Image upload failed. You can paste a direct Image URL instead.');
    } finally {
      setImageUploading(false);
      setUploadProgressText('');
      if (imageInputRef.current) imageInputRef.current.value = '';
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

  const handleSetPrimaryImage = (index) => {
    if (index === 0) return;
    setFormData((prev) => {
      const copy = [...prev.productImages];
      const [target] = copy.splice(index, 1);
      return {
        ...prev,
        productImages: [target, ...copy],
      };
    });
  };

  const handleMoveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= formData.productImages.length) return;
    setFormData((prev) => {
      const copy = [...prev.productImages];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return {
        ...prev,
        productImages: copy,
      };
    });
  };

  // 1 Video Upload to S3
  const handleVideoUpload = async (file) => {
    if (!file) return;
    try {
      setVideoUploading(true);
      setError('');
      setUploadProgressText('Uploading product video...');

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', 'products/videos');

      const res = await axios.post(`${API_BASE}/api/upload`, uploadData);
      const data = res.data;

      if (data.success && (data.url || data.urls?.[0])) {
        const vidUrl = data.url || data.urls[0];
        setFormData((prev) => ({ ...prev, videoUrl: vidUrl }));
        setSuccessMsg('Product video uploaded successfully!');
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        setError(data.message || 'Video upload failed');
      }
    } catch (err) {
      console.error('Video upload failed:', err);
      setError(err.response?.data?.message || err.message || 'Video upload failed. You can paste a direct Video URL instead.');
    } finally {
      setVideoUploading(false);
      setUploadProgressText('');
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleAddVideoUrl = () => {
    const trimmed = videoUrlInput.trim();
    if (!trimmed) return;
    setFormData((prev) => ({ ...prev, videoUrl: trimmed }));
    setSuccessMsg('Product video URL attached!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRemoveVideo = () => {
    setFormData((prev) => ({ ...prev, videoUrl: '' }));
    setVideoUrlInput('');
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
        maxOrderQuantity: formData.maxOrderQuantity !== '' && !isNaN(parseInt(formData.maxOrderQuantity, 10)) ? parseInt(formData.maxOrderQuantity, 10) : null,
        stepByQuantity: parseInt(formData.stepByQuantity, 10) || 1,
        productImages: formData.productImages,
        videoUrl: formData.videoUrl?.trim() || '',
        description: formData.description.trim(),
        features: formData.features,
        specifications: formData.specifications,
        isActive: Boolean(formData.isActive),
        cardGlowColor: formData.cardGlowColor?.trim() || '',
        badge: formData.badge?.trim() || '',
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
    const previewImage = formData.productImages[previewImageIdx] || formData.productImages[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&h=400&q=80';
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

              {/* Stock Quantity, Min/Max Order Qty & In Stock Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 pt-1">
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
                    placeholder="e.g. 1"
                    value={formData.minOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, minOrderQuantity: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Order Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50 (optional)"
                    value={formData.maxOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, maxOrderQuantity: e.target.value === '' ? '' : parseInt(e.target.value, 10) || '' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-2 sm:pt-6">
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

            {/* STEP 3: Media Gallery (Multiple Images & 1 Video) & Details */}
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
                    Upload product photos (multiple) and product video (1 clip) for storefront showcase
                  </p>
                </div>
              </div>

              {/* 3A: MULTIPLE IMAGES UPLOAD SECTION (Compact & Professional) */}
              <div className="space-y-2.5 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ImageIcon className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Product Images ({formData.productImages.length})
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                      • 1st photo is Cover
                    </span>
                  </div>

                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        imageMode === 'upload'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        imageMode === 'url'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                      }`}
                    >
                      URL Link
                    </button>
                  </div>
                </div>

                {imageMode === 'upload' ? (
                  <div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleMultipleImagesUpload(e.target.files)}
                    />
                    <div
                      onClick={() => !imageUploading && imageInputRef.current?.click()}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-700 dark:group-hover:bg-emerald-950/60 dark:group-hover:text-emerald-300 flex items-center justify-center shrink-0 transition-colors">
                          {imageUploading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {imageUploading ? (
                              <span className="text-emerald-600 dark:text-emerald-400">{uploadProgressText || 'Uploading images to S3...'}</span>
                            ) : (
                              <>
                                <span>Click to upload</span> <span className="font-normal text-slate-500 dark:text-slate-400">or drag multiple photos</span>
                              </>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            JPG, PNG, WebP, AVIF • Batch upload supported
                          </div>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs group-hover:border-emerald-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors shrink-0 hidden sm:inline">
                        Browse Files
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/... or direct image URL"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs shrink-0"
                    >
                      + Add URL
                    </button>
                  </div>
                )}

                {/* Uploaded Images Thumbnails */}
                {formData.productImages.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {formData.productImages.map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative group rounded-xl border overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-2xs aspect-square ${
                            idx === 0
                              ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <img src={img} alt={`Product ${idx + 1}`} className="h-full w-full object-cover" />

                          {/* Cover Badge on First Image */}
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5 pointer-events-none">
                              <Star className="h-2.5 w-2.5 fill-white" />
                              <span>Cover</span>
                            </span>
                          )}

                          {/* Hover Actions */}
                          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(idx)}
                                className="p-1 rounded bg-white/90 text-amber-600 hover:bg-white transition-colors"
                                title="Set as Cover photo"
                              >
                                <Star className="h-3 w-3 fill-amber-500" />
                              </button>
                            )}
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, idx - 1)}
                                className="p-1 rounded bg-white/90 text-slate-700 hover:bg-white transition-colors"
                                title="Move Left"
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>
                            )}
                            {idx < formData.productImages.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, idx + 1)}
                                className="p-1 rounded bg-white/90 text-slate-700 hover:bg-white transition-colors"
                                title="Move Right"
                              >
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(img)}
                              className="p-1 rounded bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                              title="Delete Image"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3B: 1 PRODUCT VIDEO UPLOAD SECTION (Compact & Professional) */}
              <div className="space-y-2.5 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Video className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Product Video (1 Clip - Optional)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setVideoMode('upload')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        videoMode === 'upload'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                      }`}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMode('url')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        videoMode === 'url'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                      }`}
                    >
                      URL Link
                    </button>
                  </div>
                </div>

                {formData.videoUrl ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 p-2.5 space-y-2">
                    <div className="flex items-center justify-between px-1 text-white">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
                        <span>Attached Video</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveVideo}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600/90 hover:bg-rose-600 text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    <video
                      src={formData.videoUrl}
                      controls
                      className="w-full max-h-40 rounded-lg object-contain bg-black"
                    />

                    <div className="text-[10px] text-slate-400 font-mono truncate px-1">
                      {formData.videoUrl}
                    </div>
                  </div>
                ) : (
                  <div>
                    {videoMode === 'upload' ? (
                      <div>
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                          className="hidden"
                          onChange={(e) => handleVideoUpload(e.target.files?.[0])}
                        />
                        <div
                          onClick={() => !videoUploading && videoInputRef.current?.click()}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-lg bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-purple-100 group-hover:text-purple-700 dark:group-hover:bg-purple-950/60 dark:group-hover:text-purple-300 flex items-center justify-center shrink-0 transition-colors">
                              {videoUploading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Video className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div className="text-left min-w-0">
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {videoUploading ? (
                                  <span className="text-purple-600 dark:text-purple-400">{uploadProgressText || 'Uploading video to S3...'}</span>
                                ) : (
                                  <>
                                    <span>Click to upload 1 product video</span> <span className="font-normal text-slate-500 dark:text-slate-400">(Optional)</span>
                                  </>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                MP4, WebM, MOV • Max 100MB
                              </div>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs group-hover:border-purple-500 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors shrink-0 hidden sm:inline">
                            Select Video
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://.../video.mp4 or direct video link"
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddVideoUrl();
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddVideoUrl}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs shrink-0"
                        >
                          Attach Video
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3C: DESCRIPTION */}
              <div className="space-y-1.5 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">
                    Short Description
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {formData.description.length} characters
                  </span>
                </div>
                <textarea
                  rows="2"
                  placeholder="Fresh farm-picked produce delivered within 10 minutes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs resize-none"
                />
              </div>

              {/* 3D: KEY FEATURES BULLET POINTS (Clean & Professional) */}
              <div className="space-y-2.5 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Key Highlights & Features ({formData.features.length})
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                      • Bullet points on product details
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Press Enter ↵ to add</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a key highlight (e.g. 100% Organic, Cold Pressed, No Preservatives)"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    disabled={!featureInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs shrink-0 flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {formData.features.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {formData.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 transition-colors shadow-2xs"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>{feat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 p-0.5 rounded transition-colors cursor-pointer"
                          title="Remove highlight"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No highlights added yet. Type a bullet point above and press Add or Enter.</p>
                )}
              </div>

              {/* Active Storefront Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <div className="space-y-0.5">
                  <label htmlFor="productIsActive" className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer block">
                    Storefront Visibility
                  </label>
                  <p className="text-[11px] text-slate-400">
                    {formData.isActive ? 'Active & visible to customers in catalog' : 'Hidden from storefront (draft mode)'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="productIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
              </div>
            </div>

            {/* STEP 4: Card Theme & Storefront Badge (Clean Modern Style) */}
            <div className="bg-slate-50/50 dark:bg-slate-950/20 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 pb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold text-xs shadow-xs">
                  4
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Card Theme & Storefront Badge
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Customize card accent tint, background glow, and storefront promotional tag
                  </p>
                </div>
              </div>

              {/* Preset Glow Themes (Figma / Linear Style) */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Preset Card Glow Palettes
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {PRODUCT_GLOW_THEMES.find((t) => (formData.cardGlowColor || '').toLowerCase() === t.hex.toLowerCase())?.name || (formData.cardGlowColor ? `Custom (${formData.cardGlowColor})` : 'Clean (Default)')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {PRODUCT_GLOW_THEMES.map((theme) => {
                    const isSelected = (formData.cardGlowColor || '').toLowerCase() === theme.hex.toLowerCase();
                    return (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, cardGlowColor: theme.hex }))}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                        title={theme.name}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-black/10 dark:border-white/20 shrink-0 shadow-2xs"
                          style={{ backgroundColor: theme.hex || '#ffffff' }}
                        />
                        <span>{theme.name.replace(' (Default)', '')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Hex Color & Promotional Badge (2-Column Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Column 1: Custom Hex Color */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                  <label className="text-xs font-bold text-slate-900 dark:text-white block">
                    Custom Glow Hex Color
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Modern Native Color Swatch */}
                    <div className="relative h-8 w-8 rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden shadow-2xs cursor-pointer group shrink-0 hover:scale-105 transition-transform">
                      <input
                        type="color"
                        value={getValidColorPickerHex(formData.cardGlowColor)}
                        onChange={(e) => setFormData((prev) => ({ ...prev, cardGlowColor: formatHexGlow(e.target.value) }))}
                        className="absolute -inset-4 h-16 w-16 cursor-pointer opacity-0"
                        title="Click to open color picker"
                      />
                      <div
                        className="h-full w-full rounded-lg"
                        style={{ backgroundColor: formData.cardGlowColor ? getValidColorPickerHex(formData.cardGlowColor) : '#10B981' }}
                      />
                    </div>

                    {/* Clean Hex Input */}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="#10B981"
                        value={formData.cardGlowColor}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({ ...prev, cardGlowColor: formatHexGlow(val) }));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs uppercase"
                        maxLength={9}
                      />
                    </div>

                    {formData.cardGlowColor && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, cardGlowColor: '' }))}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 text-xs font-semibold transition-colors cursor-pointer"
                        title="Reset to default clean"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Column 2: Promotional Badge with Quick-Picks */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 dark:text-white">
                      Promotional Tag / Badge
                    </label>
                    {formData.badge && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-2xs"
                        style={{ backgroundColor: formatHexGlow(formData.cardGlowColor) || '#10B981' }}
                      >
                        {formData.badge}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Farm Fresh, 100% Organic, Best Seller"
                    value={formData.badge}
                    onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                  <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium mr-0.5">Quick pick:</span>
                    {["Farm Fresh", "100% Organic", "Best Seller", "Hot Deal", "Limited Stock"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, badge: prev.badge === tag ? '' : tag }))}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-all cursor-pointer ${
                          formData.badge === tag
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
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

              {/* Mock Mobile Product Card with Dynamic Glow Background */}
              <div
                className="rounded-2xl border overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: getGlowBgStyle(formData.cardGlowColor, '0D'),
                  borderColor: getGlowBgStyle(formData.cardGlowColor, '45'),
                  boxShadow: formData.cardGlowColor
                    ? `0 12px 32px -4px ${getGlowBgStyle(formData.cardGlowColor, '30')}`
                    : undefined,
                }}
              >
                {/* Product Image / Video Box */}
                <div
                  className="relative h-44 w-full flex items-center justify-center p-3 transition-colors overflow-hidden"
                  style={{
                    backgroundColor: getGlowBgStyle(formData.cardGlowColor, '15'),
                  }}
                >
                  {previewShowVideo && formData.videoUrl ? (
                    <video
                      src={formData.videoUrl}
                      controls
                      autoPlay
                      className="h-full w-full object-contain bg-black rounded-lg"
                    />
                  ) : (
                    <img
                      src={previewImage}
                      alt="Product Preview"
                      className="max-h-full max-w-full object-contain transition-all"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&h=400&q=80';
                      }}
                    />
                  )}

                  {/* Header Overlay Badges Bar */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                    {formData.discountedPercent > 0 ? (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[10px] shadow-xs shrink-0">
                        {formData.discountedPercent}% OFF
                      </span>
                    ) : <span />}

                    <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
                      {formData.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewShowVideo((prev) => !prev)}
                          className={`px-2 py-0.5 rounded-lg text-white font-bold text-[10px] shadow-xs tracking-wide flex items-center gap-1 cursor-pointer transition-all ${
                            previewShowVideo ? 'bg-purple-700 ring-2 ring-purple-300' : 'bg-purple-600 hover:bg-purple-500'
                          }`}
                          title="Toggle Video Preview"
                        >
                          <Play className="h-2.5 w-2.5 fill-white" />
                          <span>{previewShowVideo ? 'Photo' : 'Video'}</span>
                        </button>
                      )}
                      {formData.badge && (
                        <span
                          className="px-2 py-0.5 rounded-lg text-white font-bold text-[10px] shadow-xs tracking-wide"
                          style={{ backgroundColor: formatHexGlow(formData.cardGlowColor) || '#10B981' }}
                        >
                          {formData.badge}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-bold text-[10px] shadow-xs border border-slate-200/60">
                        {formData.department === 'ready2cook' ? 'Ready2Cook' : formData.department === 'supermall' ? 'SuperMall' : 'GreenGrocc'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Multiple Images Selector Strip in Preview */}
                {formData.productImages.length > 1 && !previewShowVideo && (
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                      {formData.productImages.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPreviewImageIdx(i)}
                          className={`h-7 w-7 rounded-md border overflow-hidden shrink-0 transition-all cursor-pointer ${
                            (previewImageIdx === i || (!previewImageIdx && i === 0))
                              ? 'border-amber-500 ring-2 ring-amber-500/40 scale-105'
                              : 'border-slate-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 pl-1">
                      {previewImageIdx + 1}/{formData.productImages.length}
                    </span>
                  </div>
                )}

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
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price & MRP</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredProducts.map((p) => {
                  const img = Array.isArray(p.productImages) && p.productImages[0] ? p.productImages[0] : '';
                  const dept = DEPARTMENT_OPTIONS.find((d) => d.slug === p.section) || DEPARTMENT_OPTIONS[0];
                  const primaryCat = Array.isArray(p.categories) ? p.categories[0] : p.category;

                  return (
                    <tr
                      key={p._id}
                      onClick={() => handleOpenEdit(p)}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      {/* Product Thumbnail & Title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden transition-colors"
                            style={{
                              backgroundColor: getGlowBgStyle(p.cardGlowColor, '15'),
                              borderColor: getGlowBgStyle(p.cardGlowColor, '40'),
                            }}
                          >
                            {img ? (
                              <img src={img} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white line-clamp-1 text-xs">
                              {p.cardGlowColor && (
                                <span
                                  className="h-2 w-2 rounded-full shrink-0 shadow-2xs"
                                  style={{ backgroundColor: formatHexGlow(p.cardGlowColor) }}
                                  title={`Glow: ${p.cardGlowColor}`}
                                />
                              )}
                              <span className="truncate">{p.name}</span>
                              {p.badge && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-2xs shrink-0"
                                  style={{ backgroundColor: formatHexGlow(p.cardGlowColor) || '#10B981' }}
                                >
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap pt-0.5">
                              <span className="font-mono text-[10px]">SKU: {p.sku || '—'}</span>
                              <span>•</span>
                              <span>{p.brandName || 'GreenGrocc'}</span>
                              {Array.isArray(p.productImages) && p.productImages.length > 1 && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  • {p.productImages.length} photos
                                </span>
                              )}
                              {p.videoUrl && (
                                <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                                  <Film className="h-2.5 w-2.5" />
                                  <span>Video</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${dept.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${dept.dot}`} />
                          <span>{dept.name}</span>
                        </span>
                      </td>

                      {/* Category & Subcategory */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">{primaryCat || '—'}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{p.subcategory || 'General'}</div>
                      </td>

                      {/* Pricing */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white tabular-nums text-xs">
                          ₹{p.discountedPrice != null ? p.discountedPrice : p.price}
                        </div>
                        {p.price > p.discountedPrice && (
                          <div className="flex items-center gap-1 text-[11px] pt-0.5">
                            <span className="text-slate-400 line-through tabular-nums">₹{p.price}</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400 text-[10px]">
                              {p.discountedPercent}% off
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Stock Toggle */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleStock(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${
                            p.inStock
                              ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                          }`}
                          title="Click to toggle stock status"
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${p.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="tabular-nums">{p.inStock ? `${p.stock ?? 0} in stock` : 'Out of stock'}</span>
                        </button>
                      </td>

                      {/* Active Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                          p.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <span>{p.isActive ? 'Active' : 'Hidden'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
            const hasGlow = Boolean(p.cardGlowColor);
            const cardBgStyle = getGlowBgStyle(p.cardGlowColor, '0D');
            const cardBorderStyle = getGlowBgStyle(p.cardGlowColor, '40');
            const imgBgStyle = getGlowBgStyle(p.cardGlowColor, '15');

            return (
              <div
                key={p._id}
                onClick={() => handleOpenEdit(p)}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group bg-white dark:bg-slate-900"
                style={{
                  backgroundColor: cardBgStyle,
                  borderColor: cardBorderStyle,
                  boxShadow: hasGlow ? `0 8px 24px -4px ${getGlowBgStyle(p.cardGlowColor, '25')}` : undefined,
                }}
              >
                <div>
                  {/* Image container */}
                  <div
                    className="relative h-36 w-full flex items-center justify-center p-3 transition-colors bg-slate-50/50 dark:bg-slate-800/40"
                    style={{ backgroundColor: imgBgStyle || undefined }}
                  >
                    {img ? (
                      <img src={img} alt={p.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200" />
                    ) : (
                      <Package className="h-8 w-8 text-slate-300" />
                    )}

                    {/* Top overlay badges */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none">
                      {p.discountedPercent > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[9px] shadow-xs shrink-0">
                          {p.discountedPercent}% OFF
                        </span>
                      ) : <span />}

                      <div className="flex items-center gap-1 shrink-0">
                        {p.badge && (
                          <span
                            className="px-1.5 py-0.5 rounded text-white font-bold text-[9px] shadow-xs tracking-wide"
                            style={{ backgroundColor: formatHexGlow(p.cardGlowColor) || '#10B981' }}
                          >
                            {p.badge}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${dept.bg}`}>
                          <span className={`h-1 w-1 rounded-full ${dept.dot}`} />
                          <span>{dept.name}</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom overlay media count indicators */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 pointer-events-none">
                      {Array.isArray(p.productImages) && p.productImages.length > 1 && (
                        <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-medium shadow-xs">
                          {p.productImages.length} photos
                        </span>
                      )}
                      {p.videoUrl && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-600/90 backdrop-blur-xs text-white text-[9px] font-medium shadow-xs flex items-center gap-0.5">
                          <Play className="h-2 w-2 fill-white" />
                          <span>Video</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-3.5 space-y-1">
                    <div className="text-[10px] font-semibold text-slate-400">
                      {primaryCat || 'General'}
                    </div>
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
                      {p.name}
                    </h4>
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                        ₹{p.discountedPrice != null ? p.discountedPrice : p.price}
                      </span>
                      {p.price > p.discountedPrice && (
                        <span className="text-[11px] text-slate-400 line-through tabular-nums">₹{p.price}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="px-3.5 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${p.inStock ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${p.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>{p.inStock ? `${p.stock ?? 0} in stock` : 'Out of stock'}</span>
                  </span>
                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(p)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
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
