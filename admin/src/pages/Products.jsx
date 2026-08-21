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
  User,
  MapPin,
  Calendar,
  Sprout,
  Tractor,
  Droplets,
  FileText,
  CheckCircle,
} from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5001';

const DEPARTMENT_OPTIONS = [
  { slug: 'greengrocc', name: 'GreenGrocc', color: 'emerald', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  { slug: 'ready2cook', name: 'Ready2Cook', color: 'amber', dot: 'bg-amber-500', bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  { slug: 'supermall', name: 'SuperMall', color: 'blue', dot: 'bg-sky-500', bg: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
];

export const FORM_STEPS = [
  { id: 1, title: 'Basic Details', subtitle: 'Category & SKU', icon: Package },
  { id: 2, title: 'Pricing & Units', subtitle: 'Unit, MRP & Stock', icon: Tag },
  { id: 3, title: 'Media & Details', subtitle: 'Photos & Highlights', icon: ImageIcon },
  { id: 4, title: 'Farmer Traceability', subtitle: 'Farmer & Land Specs', icon: Tractor },
];

export const STANDARD_UNIT_TYPES = [
  'Piece',
  'Kg',
  'Gram',
  'Liter',
  'ML',
  'Box',
  'Pack',
  'Packet',
  'Bag',
  'Set',
  'Pair',
  'Dozen',
  'Bundle',
  'Bunch',
  'Meter',
  'CM',
];

export const PRESET_UNIT_OPTIONS = [
  { qty: 1, type: 'Piece', label: '1 Piece' },
  { qty: 250, type: 'Gram', label: '250 Gram' },
  { qty: 500, type: 'Gram', label: '500 Gram' },
  { qty: 1, type: 'Kg', label: '1 Kg' },
  { qty: 2, type: 'Kg', label: '2 Kg' },
  { qty: 5, type: 'Kg', label: '5 Kg' },
  { qty: 500, type: 'ML', label: '500 ML' },
  { qty: 1, type: 'Liter', label: '1 Liter' },
  { qty: 1, type: 'Dozen', label: '1 Dozen' },
  { qty: 1, type: 'Bunch', label: '1 Bunch' },
  { qty: 1, type: 'Pack', label: '1 Pack' },
  { qty: 2, type: 'Pack', label: '2 Pack' },
  { qty: 1, type: 'Packet', label: '1 Packet' },
  { qty: 1, type: 'Box', label: '1 Box' },
  { qty: 1, type: 'Bag', label: '1 Bag' },
  { qty: 1, type: 'Bundle', label: '1 Bundle' },
  { qty: 1, type: 'Set', label: '1 Set' },
  { qty: 1, type: 'Pair', label: '1 Pair' },
];

export const parseUnitInfo = (rawUnit) => {
  if (!rawUnit) return { quantity: 1, unitType: 'Piece', unit: '1 Piece' };
  const str = String(rawUnit).trim();
  const match = str.match(/^([\d.]+)\s*(.*)$/);
  if (!match) {
    return { quantity: 1, unitType: 'Piece', unit: str };
  }
  const qty = parseFloat(match[1]) || 1;
  const rawType = (match[2] || '').trim().toLowerCase();

  let detectedType = 'Piece';
  if (rawType.startsWith('kg') || rawType.startsWith('kilo')) detectedType = 'Kg';
  else if (rawType.startsWith('gram') || rawType.startsWith('gm') || rawType === 'g') detectedType = 'Gram';
  else if (rawType.startsWith('liter') || rawType.startsWith('litre') || rawType.startsWith('ltr') || rawType === 'l') detectedType = 'Liter';
  else if (rawType.startsWith('ml') || rawType.startsWith('milli')) detectedType = 'ML';
  else if (rawType.startsWith('box')) detectedType = 'Box';
  else if (rawType.startsWith('packet') || rawType.startsWith('pkt')) detectedType = 'Packet';
  else if (rawType.startsWith('pack')) detectedType = 'Pack';
  else if (rawType.startsWith('bag')) detectedType = 'Bag';
  else if (rawType.startsWith('set')) detectedType = 'Set';
  else if (rawType.startsWith('pair')) detectedType = 'Pair';
  else if (rawType.startsWith('dozen') || rawType.startsWith('doz')) detectedType = 'Dozen';
  else if (rawType.startsWith('bundle')) detectedType = 'Bundle';
  else if (rawType.startsWith('bunch')) detectedType = 'Bunch';
  else if (rawType.startsWith('meter') || rawType === 'm') detectedType = 'Meter';
  else if (rawType.startsWith('cm')) detectedType = 'CM';
  else if (rawType.startsWith('pc') || rawType.startsWith('piece')) detectedType = 'Piece';

  return {
    quantity: qty,
    unitType: detectedType,
    unit: `${qty} ${detectedType}`,
  };
};

export const formatUnitString = (qty, type) => {
  const q = qty !== '' && qty != null ? qty : '1';
  const t = type || 'Piece';
  return `${q} ${t}`;
};

const DEMO_FARMER = {
  name: 'Kiran Vitthal Pawar',
  location: 'Niphad, Nashik',
  harvestingDate: 'Today (Fresh Morning Harvest)',
  farmerImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&h=600&q=80',
  farmImage: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&h=600&q=80',
  totalArea: '3 Acres',
  cultivationArea: '3 Acres',
  cropCycle: '60 Days Harvest Cycle',
  agricultureMethod: 'Modern and Traditional (100% Organic)',
  lastCropTaken: 'Onion',
  currentCrop: 'Cleaned & Trimmed Methi Leaves',
  waterSource: 'Rivers, Solar Well (Drip Irrigation)',
  soilType: 'Rich Black Soil',
  farmTools: 'Tractor & Solar Drier',
  bio: 'Hello, my name is Kiran Vitthal Pawar. I am a graduate and I have been actively involved in farming for the past 5 years in Niphad, Nashik. We cultivate fresh organic produce using modern and traditional sustainable farming techniques.',
};

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
  const [formStep, setFormStep] = useState(1);
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
    unitQuantity: 1,
    unitType: 'Piece',
    unit: '1 Piece',
    variantType: 'single', // 'single' | 'multi'
    variants: [],
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
    // Farmer & Farm Traceability
    farmerName: '',
    farmerLocation: '',
    farmerImage: '',
    farmImage: '',
    harvestingDate: 'Today (Fresh Morning Harvest)',
    farmerDetails: {
      totalArea: '',
      cultivationArea: '',
      cropCycle: '',
      agricultureMethod: '',
      lastCropTaken: '',
      currentCrop: '',
      waterSource: '',
      soilType: '',
      farmTools: '',
      bio: '',
    },
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

  // Farmer & Farm Land Image Upload states
  const farmerPhotoInputRef = useRef(null);
  const farmLandPhotoInputRef = useRef(null);
  const [farmerPhotoUploading, setFarmerPhotoUploading] = useState(false);
  const [farmLandPhotoUploading, setFarmLandPhotoUploading] = useState(false);

  // Live preview image & video switcher
  const [previewImageIdx, setPreviewImageIdx] = useState(0);
  const [previewShowVideo, setPreviewShowVideo] = useState(false);
  const [previewSelectedVariant, setPreviewSelectedVariant] = useState('');

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
      unitQuantity: 1,
      unitType: 'Piece',
      unit: '1 Piece',
      variantType: 'single',
      variants: [],
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
      farmerName: '',
      farmerLocation: '',
      farmerImage: '',
      farmImage: '',
      harvestingDate: 'Today (Fresh Morning Harvest)',
      farmerDetails: {
        totalArea: '',
        cultivationArea: '',
        cropCycle: '',
        agricultureMethod: '',
        lastCropTaken: '',
        currentCrop: '',
        waterSource: '',
        soilType: '',
        farmTools: '',
        bio: '',
      },
    });
    setImageUrlInput('');
    setVideoUrlInput('');
    setFeatureInput('');
    setSpecKeyInput('');
    setSpecValInput('');
    setPreviewSelectedVariant('');
    setFormStep(1);
    setIsEditorOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (product) => {
    const primaryCat = Array.isArray(product.categories) ? product.categories[0] : product.category || '';
    const foundCat = categories.find((c) => c.categoryName.toLowerCase() === primaryCat.toLowerCase());
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    const parsedSingle = parseUnitInfo(product.unit || product.sub || product.weight || '1 Piece');

    setEditingProduct(product);
    setFormStep(1);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      department: product.section || foundCat?.section || 'greengrocc',
      category: primaryCat,
      subcategory: product.subcategory || (Array.isArray(product.subcategories) ? product.subcategories[0] : '') || 'General',
      brandName: product.brandName || 'GreenGrocc',
      unitQuantity: parsedSingle.quantity,
      unitType: parsedSingle.unitType,
      unit: product.unit || parsedSingle.unit,
      variantType: product.variantType || (hasVariants ? 'multi' : 'single'),
      variants: hasVariants
        ? product.variants.map((v) => {
            const vParsed = parseUnitInfo(v.name);
            return {
              quantity: v.quantity || vParsed.quantity,
              unitType: v.unitType || vParsed.unitType,
              name: v.name || vParsed.unit,
              price: v.price != null ? String(v.price) : '',
              discountedPrice: v.discountedPrice != null ? String(v.discountedPrice) : '',
              discountedPercent: v.discountedPercent || 0,
              stock: v.stock != null ? v.stock : 100,
              inStock: v.inStock !== undefined ? v.inStock : true,
            };
          })
        : [],
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
      farmerName: product.farmerName || product.farmerDetails?.name || '',
      farmerLocation: product.farmerLocation || product.farmerDetails?.location || '',
      farmerImage: product.farmerImage || product.farmerDetails?.farmerImage || '',
      farmImage: product.farmImage || product.farmerDetails?.farmImage || '',
      harvestingDate: product.harvestingDate || product.farmerDetails?.harvestingDate || 'Today (Fresh Morning Harvest)',
      farmerDetails: {
        totalArea: product.farmerDetails?.totalArea || '',
        cultivationArea: product.farmerDetails?.cultivationArea || '',
        cropCycle: product.farmerDetails?.cropCycle || '',
        agricultureMethod: product.farmerDetails?.agricultureMethod || '',
        lastCropTaken: product.farmerDetails?.lastCropTaken || '',
        currentCrop: product.farmerDetails?.currentCrop || '',
        waterSource: product.farmerDetails?.waterSource || '',
        soilType: product.farmerDetails?.soilType || '',
        farmTools: product.farmerDetails?.farmTools || '',
        bio: product.farmerDetails?.bio || '',
      },
    });
    setImageUrlInput('');
    setVideoUrlInput(product.videoUrl || '');
    setFeatureInput('');
    setSpecKeyInput('');
    setSpecValInput('');
    setPreviewSelectedVariant(hasVariants ? product.variants[0]?.name || '' : '');
    setIsEditorOpen(true);
  };

  // Auto Fill Demo Farmer Info
  const handleAutoFillFarmer = () => {
    setFormData((prev) => ({
      ...prev,
      farmerName: DEMO_FARMER.name,
      farmerLocation: DEMO_FARMER.location,
      farmerImage: DEMO_FARMER.farmerImage,
      farmImage: DEMO_FARMER.farmImage,
      harvestingDate: DEMO_FARMER.harvestingDate,
      farmerDetails: {
        totalArea: DEMO_FARMER.totalArea,
        cultivationArea: DEMO_FARMER.cultivationArea,
        cropCycle: DEMO_FARMER.cropCycle,
        agricultureMethod: DEMO_FARMER.agricultureMethod,
        lastCropTaken: DEMO_FARMER.lastCropTaken,
        currentCrop: prev.name ? prev.name.split('(')[0].trim() : DEMO_FARMER.currentCrop,
        waterSource: DEMO_FARMER.waterSource,
        soilType: DEMO_FARMER.soilType,
        farmTools: DEMO_FARMER.farmTools,
        bio: DEMO_FARMER.bio,
      },
    }));
    setSuccessMsg('Demo farmer & farm traceability details filled!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Single Unit Change Handler (Quantity + Measurement Unit)
  const handleSingleUnitChange = (qtyVal, typeVal) => {
    const q = qtyVal !== '' && qtyVal != null ? qtyVal : '1';
    const t = typeVal || formData.unitType || 'Piece';
    const formatted = formatUnitString(q, t);
    setFormData((prev) => ({
      ...prev,
      unitQuantity: qtyVal,
      unitType: t,
      unit: formatted,
    }));
  };

  // 1-Click Quick Preset Handler
  const handleApplyPresetUnit = (preset) => {
    setFormData((prev) => ({
      ...prev,
      unitQuantity: preset.qty,
      unitType: preset.type,
      unit: preset.label,
    }));
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

  // Variant Unit Handlers (Multi-Unit Pricing)
  const handleAddVariantOption = (presetQty = 1, presetType = 'Piece') => {
    setFormData((prev) => {
      const basePrice = prev.price || '40';
      const baseDisc = prev.discountedPrice || '28';
      const basePct = prev.discountedPercent || 30;
      const unitLabel = formatUnitString(presetQty, presetType);
      const newVar = {
        quantity: presetQty,
        unitType: presetType,
        name: unitLabel,
        price: basePrice,
        discountedPrice: baseDisc,
        discountedPercent: basePct,
        stock: 50,
        inStock: true,
      };
      return {
        ...prev,
        variants: [...prev.variants, newVar],
      };
    });
  };

  const handleRemoveVariantOption = (idx) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }));
  };

  const handleVariantFieldChange = (idx, field, value) => {
    setFormData((prev) => {
      const copy = [...prev.variants];
      const item = { ...copy[idx], [field]: value };

      if (field === 'quantity' || field === 'unitType') {
        const q = field === 'quantity' ? value : item.quantity;
        const t = field === 'unitType' ? value : item.unitType;
        item.name = formatUnitString(q, t);
      }

      if (field === 'price' || field === 'discountedPrice') {
        const p = parseFloat(field === 'price' ? value : item.price) || 0;
        const d = parseFloat(field === 'discountedPrice' ? value : item.discountedPrice) || 0;
        if (p > 0 && d > 0 && d < p) {
          item.discountedPercent = Math.round(((p - d) / p) * 100);
        } else {
          item.discountedPercent = 0;
        }
      }

      copy[idx] = item;
      return { ...prev, variants: copy };
    });
  };

  // Single Image Upload (Farmer Photo & Farm Land Photo)
  const handleFarmerPhotoUpload = async (file, type) => {
    if (!file) return;
    try {
      if (type === 'farmer') {
        setFarmerPhotoUploading(true);
      } else {
        setFarmLandPhotoUploading(true);
      }
      setError('');

      const uploadData = new FormData();
      uploadData.append('files', file);
      uploadData.append('folder', 'farmers');

      const res = await axios.post(`${API_BASE}/api/upload`, uploadData);
      const data = res.data;

      if (data.success) {
        const uploadedUrl = Array.isArray(data.urls) ? data.urls[0] : data.url;
        if (type === 'farmer') {
          setFormData((prev) => ({
            ...prev,
            farmerImage: uploadedUrl,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            farmImage: uploadedUrl,
          }));
        }
        setSuccessMsg(`${type === 'farmer' ? 'Farmer' : 'Farm land'} photo uploaded successfully!`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      setError(err.response?.data?.message || err.message || 'Photo upload failed.');
    } finally {
      if (type === 'farmer') {
        setFarmerPhotoUploading(false);
        if (farmerPhotoInputRef.current) farmerPhotoInputRef.current.value = '';
      } else {
        setFarmLandPhotoUploading(false);
        if (farmLandPhotoInputRef.current) farmLandPhotoInputRef.current.value = '';
      }
    }
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
    if (formData.variantType === 'multi') {
      if (!formData.variants.length || formData.variants.length < 2) {
        setError('Multi-unit pricing requires at least 2 unit options (e.g. 250g and 500g)');
        return;
      }
      for (let i = 0; i < formData.variants.length; i++) {
        const v = formData.variants[i];
        if (!v.name.trim()) {
          setError(`Unit option #${i + 1} is missing a unit label (e.g. 250g, 500g)`);
          return;
        }
        const vPrice = parseFloat(v.price);
        if (isNaN(vPrice) || vPrice <= 0) {
          setError(`Unit "${v.name}" requires a valid MRP price`);
          return;
        }
      }
    } else {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        setError('Please enter a valid regular price');
        return;
      }
    }

    const firstVar = formData.variants[0];
    const priceNum = formData.variantType === 'multi' && firstVar
      ? parseFloat(firstVar.price) || 0
      : parseFloat(formData.price) || 0;
    const discNum = formData.variantType === 'multi' && firstVar
      ? parseFloat(firstVar.discountedPrice) || priceNum
      : parseFloat(formData.discountedPrice) || priceNum;

    try {
      setIsSubmitting(true);
      setError('');

      const resolvedVariants = formData.variantType === 'multi'
        ? formData.variants.map((v) => {
            const vPrice = parseFloat(v.price) || 0;
            const vDisc = parseFloat(v.discountedPrice) || vPrice;
            const vPct = vPrice > 0 && vDisc > 0 && vDisc < vPrice
              ? Math.round(((vPrice - vDisc) / vPrice) * 100)
              : 0;
            const vParsed = parseUnitInfo(v.name);
            return {
              quantity: v.quantity != null ? parseFloat(v.quantity) || vParsed.quantity : vParsed.quantity,
              unitType: v.unitType || vParsed.unitType,
              name: (v.name || vParsed.unit).trim(),
              price: vPrice,
              discountedPrice: vDisc,
              discountedPercent: vPct,
              stock: parseInt(v.stock, 10) || 0,
              inStock: Boolean(v.inStock),
            };
          })
        : [];

      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || undefined,
        categories: [formData.category],
        subcategory: formData.subcategory.trim() || 'General',
        subcategories: [formData.subcategory.trim() || 'General'],
        brandName: formData.brandName.trim() || 'GreenGrocc',
        unit: formData.unit.trim() || (resolvedVariants[0]?.name || '1 pc'),
        variantType: formData.variantType === 'multi' ? 'multi' : 'single',
        variants: resolvedVariants,
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
        farmerName: formData.farmerName?.trim() || '',
        farmerLocation: formData.farmerLocation?.trim() || '',
        farmerImage: formData.farmerImage?.trim() || '',
        farmImage: formData.farmImage?.trim() || '',
        harvestingDate: formData.harvestingDate?.trim() || 'Today (Fresh Morning Harvest)',
        farmerDetails: {
          name: formData.farmerName?.trim() || '',
          location: formData.farmerLocation?.trim() || '',
          farmerImage: formData.farmerImage?.trim() || '',
          farmImage: formData.farmImage?.trim() || '',
          harvestingDate: formData.harvestingDate?.trim() || 'Today (Fresh Morning Harvest)',
          totalArea: formData.farmerDetails?.totalArea?.trim() || '',
          cultivationArea: formData.farmerDetails?.cultivationArea?.trim() || '',
          cropCycle: formData.farmerDetails?.cropCycle?.trim() || '',
          agricultureMethod: formData.farmerDetails?.agricultureMethod?.trim() || '',
          lastCropTaken: formData.farmerDetails?.lastCropTaken?.trim() || '',
          currentCrop: formData.farmerDetails?.currentCrop?.trim() || '',
          waterSource: formData.farmerDetails?.waterSource?.trim() || '',
          soilType: formData.farmerDetails?.soilType?.trim() || '',
          farmTools: formData.farmerDetails?.farmTools?.trim() || '',
          bio: formData.farmerDetails?.bio?.trim() || '',
        },
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

        {/* Stepper Navigation Bar */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 sm:p-2.5 shadow-2xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FORM_STEPS.map((step) => {
              const StepIcon = step.icon;
              const isCurrent = formStep === step.id;
              const isPassed = formStep > step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setFormStep(step.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-2xs ring-1 ring-emerald-500/30'
                      : isPassed
                      ? 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'bg-white dark:bg-slate-900 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : isPassed
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isPassed ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : step.id}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight truncate flex items-center gap-1.5">
                      <span>{step.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate hidden sm:block">
                      {step.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Form Steps */}
          <div className="lg:col-span-8 space-y-4">

            {/* STEP 1: Basic Information & Categorization */}
            {formStep === 1 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                        1
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900 dark:bg-white">
                        Product Details & Categorization
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-7">
                      Basic product name, department mapping, and category organization
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Step 1 of 4
                  </span>
                </div>

                {/* Department Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Store Department <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                          className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                              : 'bg-slate-50/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                          }`}
                        >
                          {dept.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product Title & SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Product Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fresh Palak / Spinach (250g)"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      SKU Code Identifier
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PALAK-001"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Category, Subcategory & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-2xs"
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
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Subcategory / Filter
                    </label>
                    {availableSubcategoriesForForm.length > 0 ? (
                      <select
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-2xs"
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
                        placeholder="e.g. Leafy Vegetables"
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GreenGrocc"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Step 1 Footer Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.name.trim()) {
                        setError('Please enter a product title to proceed.');
                        return;
                      }
                      setError('');
                      setFormStep(2);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    <span>Next: Pricing & Units</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Pricing & Inventory Options */}
            {formStep === 2 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                        2
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Pricing & Inventory Units
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-7">
                      Set measurement unit (Piece, Kg, Gram, Liter, ML, Box, Pack, etc.) and pricing rules
                    </p>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, variantType: 'single' }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        formData.variantType !== 'multi'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <Package className="h-3.5 w-3.5" />
                      <span>Single Unit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => {
                          let vars = prev.variants;
                          if (!vars || vars.length === 0) {
                            vars = [
                              {
                                quantity: prev.unitQuantity || 250,
                                unitType: prev.unitType || 'Gram',
                                name: prev.unit || '250 Gram',
                                price: prev.price || '40',
                                discountedPrice: prev.discountedPrice || '28',
                                discountedPercent: prev.discountedPercent || 30,
                                stock: prev.stock || 50,
                                inStock: prev.inStock !== false,
                              },
                              {
                                quantity: 500,
                                unitType: 'Gram',
                                name: '500 Gram',
                                price: '75',
                                discountedPrice: '52',
                                discountedPercent: 31,
                                stock: 50,
                                inStock: true,
                              },
                            ];
                          }
                          return {
                            ...prev,
                            variantType: 'multi',
                            variants: vars,
                          };
                        });
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        formData.variantType === 'multi'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      <Boxes className="h-3.5 w-3.5" />
                      <span>Multi-Unit Variants</span>
                    </button>
                  </div>
                </div>

                {/* SINGLE UNIT PRICING */}
                {formData.variantType !== 'multi' ? (
                  <div className="space-y-4">
                    {/* Quantity & Unit Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Quantity / Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          required
                          placeholder="e.g. 250"
                          value={formData.unitQuantity}
                          onChange={(e) => handleSingleUnitChange(e.target.value, formData.unitType)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                        />
                      </div>

                      <div className="sm:col-span-8">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Unit Measurement <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Display: {formData.unit || '1 Piece'}
                          </span>
                        </div>
                        <select
                          value={formData.unitType || 'Piece'}
                          onChange={(e) => handleSingleUnitChange(formData.unitQuantity, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-2xs"
                        >
                          {STANDARD_UNIT_TYPES.map((u) => (
                            <option key={u} value={u}>
                              {u} {u === 'Piece' ? '(pc)' : u === 'Kg' ? '(Kilogram)' : u === 'Gram' ? '(g)' : u === 'Liter' ? '(L)' : u === 'ML' ? '(Milliliter)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quick Preset Unit Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">Presets:</span>
                      {PRESET_UNIT_OPTIONS.map((p) => {
                        const isSel = String(formData.unitQuantity) === String(p.qty) && formData.unitType === p.type;
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => handleApplyPresetUnit(p)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                              isSel
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          MRP Original Price (₹) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">₹</span>
                          <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            placeholder="40"
                            value={formData.price}
                            onChange={(e) => handlePriceChange(e.target.value, formData.discountedPrice)}
                            className="w-full pl-7 pr-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Selling Price (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="28"
                            value={formData.discountedPrice}
                            onChange={(e) => handlePriceChange(formData.price, e.target.value)}
                            className="w-full pl-7 pr-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Discount % Off
                        </label>
                        <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                          <span>{formData.discountedPercent}% OFF</span>
                          <span className="text-[10px] font-normal text-slate-400">Calculated</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock & Limits Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Stock Quantity
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="100"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Min Order Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={formData.minOrderQuantity}
                          onChange={(e) => setFormData({ ...formData, minOrderQuantity: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 1 })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Max Order Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="50 (Optional)"
                          value={formData.maxOrderQuantity}
                          onChange={(e) => setFormData({ ...formData, maxOrderQuantity: e.target.value === '' ? '' : parseInt(e.target.value, 10) || '' })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1 sm:pt-6">
                        <input
                          type="checkbox"
                          id="productInStock"
                          checked={formData.inStock}
                          onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                        <label htmlFor="productInStock" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                          In Stock & Orderable
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MULTI-UNIT VARIANTS TABLE */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs text-slate-500">Configure size options (e.g. 250g, 500g, 1kg):</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs text-slate-400 font-medium">Quick add:</span>
                        {[
                          { q: 250, t: 'Gram' },
                          { q: 500, t: 'Gram' },
                          { q: 1, t: 'Kg' },
                          { q: 2, t: 'Kg' },
                          { q: 1, t: 'Piece' },
                          { q: 1, t: 'Dozen' },
                          { q: 1, t: 'Liter' },
                          { q: 500, t: 'ML' },
                          { q: 1, t: 'Pack' },
                          { q: 1, t: 'Box' },
                        ].map((preset) => (
                          <button
                            key={`${preset.q}-${preset.t}`}
                            type="button"
                            onClick={() => handleAddVariantOption(preset.q, preset.t)}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            + {preset.q} {preset.t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {formData.variants.map((variant, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2"
                        >
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                {variant.name || `${variant.quantity || 1} ${variant.unitType || 'Piece'}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={variant.inStock !== false}
                                  onChange={(e) => handleVariantFieldChange(idx, 'inStock', e.target.checked)}
                                  className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                                />
                                <span>In Stock</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveVariantOption(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                                title="Delete variant"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                            <div>
                              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">Qty</label>
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={variant.quantity != null ? variant.quantity : ''}
                                onChange={(e) => handleVariantFieldChange(idx, 'quantity', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">Unit</label>
                              <select
                                value={variant.unitType || 'Piece'}
                                onChange={(e) => handleVariantFieldChange(idx, 'unitType', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white cursor-pointer"
                              >
                                {STANDARD_UNIT_TYPES.map((u) => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">MRP (₹)</label>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={variant.price}
                                onChange={(e) => handleVariantFieldChange(idx, 'price', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">Selling (₹)</label>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={variant.discountedPrice}
                                onChange={(e) => handleVariantFieldChange(idx, 'discountedPrice', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">Discount</label>
                              <div className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center">
                                {variant.discountedPercent || 0}% OFF
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">Stock</label>
                              <input
                                type="number"
                                min="0"
                                value={variant.stock}
                                onChange={(e) => handleVariantFieldChange(idx, 'stock', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddVariantOption(1, 'Piece')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Another Variant</span>
                    </button>
                  </div>
                )}

                {/* Step 2 Footer Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back: Basic Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (formData.variantType !== 'multi' && !formData.price) {
                        setError('Please specify the product price.');
                        return;
                      }
                      setError('');
                      setFormStep(3);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    <span>Next: Media & Details</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Media Assets & Description */}
            {formStep === 3 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                        3
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Media & Product Content
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-7">
                      Upload product photography, promotional video, and bullet point highlights
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Step 3 of 4
                  </span>
                </div>

                {/* Product Photos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Product Images ({formData.productImages.length}) <span className="text-slate-400 font-normal">• First image is Cover</span>
                    </label>

                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setImageMode('upload')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          imageMode === 'upload'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageMode('url')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          imageMode === 'url'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        Image URL
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
                        className="flex items-center justify-between px-4 py-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                            {imageUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {imageUploading ? (
                                <span className="text-emerald-600">{uploadProgressText || 'Uploading to Cloud...'}</span>
                              ) : (
                                'Click to browse or drag photos here'
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              JPG, PNG, WebP supported
                            </div>
                          </div>
                        </div>

                        <span className="px-3 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs">
                          Browse Files
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/... or image link"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImageUrl();
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                      >
                        Add URL
                      </button>
                    </div>
                  )}

                  {/* Thumbnails */}
                  {formData.productImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
                      {formData.productImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="group relative rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-square shadow-2xs"
                        >
                          <img
                            src={imgUrl}
                            alt={`Product ${idx + 1}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&h=300&q=80';
                            }}
                          />

                          {idx === 0 && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-bold shadow-xs">
                              Cover
                            </span>
                          )}

                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetCoverImage(idx)}
                                className="px-1.5 py-0.5 rounded bg-white text-slate-900 text-[10px] font-semibold cursor-pointer hover:bg-slate-100"
                              >
                                Cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveProductImage(idx)}
                              className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Video */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Product Video <span className="text-slate-400 font-normal">(Optional clip)</span>
                    </label>

                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setVideoMode('upload')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          videoMode === 'upload'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        Upload Video
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoMode('url')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          videoMode === 'url'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        Video URL
                      </button>
                    </div>
                  </div>

                  {formData.videoUrl ? (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Video clip attached</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewShowVideo((p) => !p)}
                          className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          {previewShowVideo ? 'Hide' : 'Preview'}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveVideo}
                          className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-medium cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {videoMode === 'upload' ? (
                        <div>
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => handleVideoUpload(e.target.files?.[0])}
                          />
                          <div
                            onClick={() => !videoUploading && videoInputRef.current?.click()}
                            className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <Video className="h-4 w-4 text-slate-400" />
                              <span className="text-xs text-slate-600 dark:text-slate-300">
                                {videoUploading ? (uploadProgressText || 'Uploading video...') : 'Select video file (MP4, WebM)'}
                              </span>
                            </div>
                            <span className="px-2.5 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200">
                              Upload File
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="https://.../video.mp4"
                            value={videoUrlInput}
                            onChange={(e) => setVideoUrlInput(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={handleAddVideoUrl}
                            className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium cursor-pointer"
                          >
                            Attach
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Description & Features */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Product Description
                      </label>
                      <span className="text-[11px] text-slate-400">{formData.description.length} characters</span>
                    </div>
                    <textarea
                      rows="3"
                      placeholder="Provide detailed description of product quality, freshness, and usage..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Key Highlights & Badges
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 100% Organic, Direct from Farm"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFeature();
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        disabled={!featureInput.trim()}
                        className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium cursor-pointer transition-colors disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>

                    {formData.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {formData.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700"
                          >
                            <span>{feat}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(idx)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label htmlFor="productIsActive" className="text-xs font-semibold text-slate-800 dark:text-white cursor-pointer block">
                      Product Visibility Status
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {formData.isActive ? 'Active and visible in store catalog' : 'Draft / Hidden from customer storefront'}
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

                {/* Step 3 Footer Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormStep(2)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back: Pricing & Units</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStep(4)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    <span>Next: Farmer Traceability</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Direct Farmer & Farm Traceability (Fully Responsive) */}
            {formStep === 4 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4 shadow-2xs">
                {/* Step Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0">
                        4
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        Farmer Profile & Farm Traceability
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                        Direct Farmer Connect
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 sm:ml-7 leading-relaxed">
                      Farmer origin, harvest timestamp, and land specifications displayed on customer app
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoFillFarmer}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Auto Fill Example</span>
                  </button>
                </div>

                {/* 1. Farmer Basic Info Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Farmer Full Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kiran Vitthal Pawar"
                      value={formData.farmerName}
                      onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>Farm Location / District</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Niphad, Nashik, Maharashtra"
                      value={formData.farmerLocation}
                      onChange={(e) => setFormData({ ...formData, farmerLocation: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Harvest Date / Status</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Today (Fresh Harvest)"
                      value={formData.harvestingDate}
                      onChange={(e) => setFormData({ ...formData, harvestingDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* 2. Photo Uploaders (Responsive Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Farmer Portrait Photo */}
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>Farmer Portrait Photo</span>
                      </label>
                      {formData.farmerImage && (
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, farmerImage: '' }))}
                          className="text-[11px] text-rose-500 hover:text-rose-700 cursor-pointer font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="relative h-12 w-12 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shrink-0 shadow-2xs">
                        {formData.farmerImage ? (
                          <img src={formData.farmerImage} alt="Farmer" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <input
                          ref={farmerPhotoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFarmerPhotoUpload(e.target.files?.[0], 'farmer')}
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => farmerPhotoInputRef.current?.click()}
                            disabled={farmerPhotoUploading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium cursor-pointer shrink-0 transition-colors"
                          >
                            {farmerPhotoUploading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                            <span>Upload</span>
                          </button>
                          <input
                            type="text"
                            placeholder="or paste image URL..."
                            value={formData.farmerImage}
                            onChange={(e) => setFormData({ ...formData, farmerImage: e.target.value })}
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Farmland Photo */}
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span>Farmland Photo</span>
                      </label>
                      {formData.farmImage && (
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, farmImage: '' }))}
                          className="text-[11px] text-rose-500 hover:text-rose-700 cursor-pointer font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="relative h-12 w-12 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shrink-0 shadow-2xs">
                        {formData.farmImage ? (
                          <img src={formData.farmImage} alt="Farm Land" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <input
                          ref={farmLandPhotoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFarmerPhotoUpload(e.target.files?.[0], 'farmland')}
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => farmLandPhotoInputRef.current?.click()}
                            disabled={farmLandPhotoUploading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium cursor-pointer shrink-0 transition-colors"
                          >
                            {farmLandPhotoUploading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                            <span>Upload</span>
                          </button>
                          <input
                            type="text"
                            placeholder="or paste farmland URL..."
                            value={formData.farmImage}
                            onChange={(e) => setFormData({ ...formData, farmImage: e.target.value })}
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Farm Field Specifications (6 Metrics Grid - 2 cols on mobile, 3 cols on tablet/desktop, 6 cols on wide desktop) */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Farm Field Specifications (6 Metrics)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Shown in customer farm modal</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        🌾 Total Area
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 5.5 Acres"
                        value={formData.farmerDetails?.totalArea || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, totalArea: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        🌱 Cultivation
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 3.0 Acres"
                        value={formData.farmerDetails?.cultivationArea || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, cultivationArea: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        ⏱️ Crop Cycle
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 60 Days"
                        value={formData.farmerDetails?.cropCycle || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, cropCycle: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        🌿 Agri Method
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 100% Organic"
                        value={formData.farmerDetails?.agricultureMethod || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, agricultureMethod: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        🧅 Last Crop
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Onion"
                        value={formData.farmerDetails?.lastCropTaken || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, lastCropTaken: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        💧 Water Source
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Solar Well"
                        value={formData.farmerDetails?.waterSource || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, waterSource: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Farmer Story / Notes */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span>Farmer Story & Agricultural Notes</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {(formData.farmerDetails?.bio || '').length} chars
                    </span>
                  </div>
                  <textarea
                    rows="3"
                    placeholder="Kiran Vitthal Pawar is a registered local farmer practicing sustainable organic agriculture in Niphad with drip irrigation..."
                    value={formData.farmerDetails?.bio || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, bio: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none shadow-2xs"
                  />
                </div>

                {/* Step 4 Footer Action (Responsive buttons) */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormStep(3)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back: Media & Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving Product...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>{editingProduct ? 'Save Changes' : 'Publish Product'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Sticky Live Product Preview (Compact Real Storefront Size) */}
          <div className="lg:col-span-4 flex justify-center lg:justify-start">
            <div className="sticky top-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs space-y-2.5 w-full max-w-[280px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Live Customer Preview
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                  Storefront Card
                </span>
              </div>

              {/* Exact User-Facing Storefront Product Card (Realistic Compact Width) */}
              {(() => {
                const rawGlow = formData.cardGlowColor || '';
                const glowColor = rawGlow ? (String(rawGlow).trim().startsWith('#') ? String(rawGlow).trim() : `#${String(rawGlow).trim()}`) : '';
                const hasGlow = Boolean(glowColor);
                const glowBg = hasGlow ? (glowColor.length === 7 ? `${glowColor}10` : glowColor) : undefined;
                const glowBorder = hasGlow ? (glowColor.length === 7 ? `${glowColor}40` : glowColor) : undefined;
                const glowShadow = hasGlow ? `0 4px 16px -2px ${glowColor.slice(0, 7)}20` : undefined;

                const activeVariant = formData.variantType === 'multi' && formData.variants?.length > 0
                  ? formData.variants.find((v) => v.name === previewSelectedVariant) || formData.variants[0]
                  : null;

                const activeSale = activeVariant ? (parseFloat(activeVariant.discountedPrice) || parseFloat(activeVariant.price) || 0) : previewSelling;
                const activeMrp = activeVariant ? (parseFloat(activeVariant.price) || activeSale) : previewMrp;
                const hasDiscount = activeMrp > activeSale;
                const discountAmt = hasDiscount ? (activeMrp - activeSale) : 0;
                const activeUnitLabel = activeVariant?.name || formData.unit || '1 Piece';

                return (
                  <div className="flex justify-center lg:justify-start">
                    {/* User-facing Product Card Preview */}
                    <div
                      className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden transition-all duration-300 border border-slate-200 dark:border-slate-800 shadow-xs w-full max-w-[260px]"
                      style={{
                        backgroundColor: glowBg,
                        borderColor: glowBorder || undefined,
                        boxShadow: glowShadow || undefined,
                      }}
                    >
                      {/* Top Media Area (Compact) */}
                      <div className="relative h-36 sm:h-40 w-full bg-[#F4FBF7] dark:bg-slate-800/80 overflow-hidden flex items-center justify-center">
                        {formData.videoUrl && previewShowVideo ? (
                          <div className="relative h-full w-full bg-black">
                            <video
                              src={formData.videoUrl}
                              controls
                              autoPlay
                              muted
                              loop
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setPreviewShowVideo(false)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <img
                              src={previewImage}
                              alt={formData.name || 'Product'}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&h=300&q=80';
                              }}
                            />

                            {/* Multiple Images Dots Indicator */}
                            {formData.productImages.length > 1 && (
                              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/40 backdrop-blur-xs px-1.5 py-0.5 rounded-full z-10">
                                {formData.productImages.map((_, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setPreviewImageIdx(i)}
                                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                      previewImageIdx === i ? 'w-2.5 bg-white' : 'w-1.5 bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Video Play Overlay */}
                            {formData.videoUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewShowVideo(true)}
                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 shadow-md backdrop-blur-xs flex items-center gap-1 text-[9px] font-bold px-1.5 cursor-pointer z-10"
                              >
                                <Play className="h-2.5 w-2.5 fill-white" />
                                <span>Video</span>
                              </button>
                            )}

                            {/* Discount Tag */}
                            {formData.discountedPercent > 0 && (
                              <div className="absolute top-1.5 left-1.5 z-10">
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20 shadow-2xs">
                                  {formData.discountedPercent}% OFF
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="p-2.5 flex flex-col flex-1">
                        {/* Farmer Origin Tag */}
                        {formData.farmerName && (
                          <div className="mb-1 flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded self-start border border-emerald-200/60 dark:border-emerald-800/60">
                            <Sprout className="h-2.5 w-2.5 shrink-0 text-emerald-600" />
                            <span className="truncate max-w-[190px]">{formData.farmerName}</span>
                          </div>
                        )}

                        {/* Title */}
                        <h4 className="text-xs font-bold text-[#1C1C1C] dark:text-white line-clamp-2 leading-tight">
                          {formData.name || 'Fresh Organic Produce Item'}
                        </h4>

                        {/* Department & Category */}
                        <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {formData.category || 'Category'} • {formData.brandName || 'GreenGrocc'}
                        </div>

                        {/* Multi-Unit Variant Chips */}
                        {formData.variantType === 'multi' && formData.variants?.length > 0 ? (
                          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <div className="text-[9px] font-semibold text-slate-400 mb-0.5">
                              Size / Option:
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {formData.variants.map((v, i) => {
                                const isCurrent = (previewSelectedVariant || formData.variants[0]?.name) === v.name;
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setPreviewSelectedVariant(v.name)}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                                      isCurrent
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    {v.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {activeUnitLabel}
                          </p>
                        )}

                        {/* Price & Add to Cart Row */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs sm:text-sm font-black text-[#1C1C1C] dark:text-white">
                              ₹{activeSale}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-slate-400 line-through">
                                ₹{activeMrp}
                              </span>
                            )}
                          </div>

                          <div className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold shadow-2xs">
                            Add +
                          </div>
                        </div>

                        {/* Rating & In-Stock */}
                        <div className="mt-1.5 pt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-[10px]">
                          <div className="flex items-center gap-0.5 text-slate-500">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-slate-700 dark:text-slate-300">4.8</span>
                          </div>

                          <span className={`font-semibold ${formData.inStock ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {formData.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </form>

        {/* Fixed / Sticky Bottom Action Bar */}
        <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 -mb-4 sm:-mb-6 lg:-mb-8 px-4 sm:px-6 lg:px-8 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-8px_25px_-5px_rgba(0,0,0,0.12)] transition-all">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Left Info / State */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-md">
                    {formData.name || (editingProduct ? editingProduct.name : 'New Product')}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    formData.inStock 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}>
                    {formData.inStock ? '● In Stock' : '✕ Out of Stock'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {formData.department ? formData.department.toUpperCase() : 'STORE'} • {formData.category || 'Uncategorized'} • {formData.variantType === 'multi' ? `${formData.variants.length} Unit Sizes` : (formData.unit || '1 pc')}
                </p>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel & Return
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>{editingProduct ? 'Save Changes' : 'Publish Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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

        {/* Simple & Professional Metric Stats Strip (No Separate Cards) */}
        <div className="flex flex-wrap items-center gap-y-2.5 gap-x-6 sm:gap-x-8 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Total Products:</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs">
              {metrics.total}
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              In Stock:
            </span>
            <span className="font-bold tabular-nums px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs">
              {metrics.inStockCount}
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${metrics.outOfStockCount > 0 ? 'bg-rose-500' : 'bg-slate-400'}`} />
              Out of Stock:
            </span>
            <span className={`font-bold tabular-nums px-2 py-0.5 rounded-md text-xs ${
              metrics.outOfStockCount > 0
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {metrics.outOfStockCount}
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
              Active in Store:
            </span>
            <span className="font-bold tabular-nums px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300 text-xs">
              {metrics.activeCount}
            </span>
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
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer min-w-[130px]"
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
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer min-w-[130px]"
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
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer min-w-[110px]"
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
                              {(p.unit || (Array.isArray(p.variants) && p.variants.length > 0)) && (
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {p.unit || `${p.variants.length} Units`}
                                </span>
                              )}
                              {(p.farmerName || p.farmerDetails?.name) && (
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <span>👨‍🌾</span>
                                  <span>{p.farmerName || p.farmerDetails?.name}</span>
                                </span>
                              )}
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
                        {Array.isArray(p.variants) && p.variants.length > 1 && (
                          <div className="text-[10px] text-slate-400">
                            {p.variants.length} unit prices
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
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-slate-400 truncate">
                        {primaryCat || 'General'}
                      </span>
                      {(p.unit || (Array.isArray(p.variants) && p.variants.length > 0)) && (
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                          {p.unit || `${p.variants.length} Units`}
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1">
                      {p.name}
                    </h4>

                    {(p.farmerName || p.farmerDetails?.name) && (
                      <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
                        👨‍🌾 {p.farmerName || p.farmerDetails?.name}
                      </p>
                    )}

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
