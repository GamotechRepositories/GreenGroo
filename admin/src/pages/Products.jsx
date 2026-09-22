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
  Copy,
} from 'lucide-react';
import axios from 'axios';
import apiClient from '../api/client';
import categoryApi from '../api/categoryApi';
import sectionApi from '../api/sectionApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../utils/ui';

const API_BASE = 'http://localhost:5001';

const DEPARTMENT_OPTIONS = [
  { slug: 'greengrocc', name: 'GreenGrocc', color: 'emerald', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { slug: 'ready2cook', name: 'Ready2Cook', color: 'amber', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { slug: 'supermall', name: 'SuperMall', color: 'sky', dot: 'bg-sky-500', bg: 'bg-sky-50 text-sky-700 ring-sky-200' },
];

const SECTION_SLUG_ALIASES = {
  greengrocc: ['greengrocc', 'preorder'],
  preorder: ['preorder', 'greengrocc'],
  supermall: ['supermall', 'instantorder'],
  instantorder: ['instantorder', 'supermall'],
  ready2cook: ['ready2cook'],
};

const slugifyName = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const sectionMatches = (productSection, selectedSlug) => {
  const a = String(productSection || '').toLowerCase();
  const b = String(selectedSlug || '').toLowerCase();
  if (!b) return true;
  if (a === b) return true;
  const aliases = SECTION_SLUG_ALIASES[b] || [b];
  return aliases.includes(a);
};

const getSectionTheme = (slug, name) => {
  const s = String(slug || '').toLowerCase();
  const known =
    DEPARTMENT_OPTIONS.find((d) => d.slug === s) ||
    (s === 'preorder' ? DEPARTMENT_OPTIONS[0] : null) ||
    (s === 'instantorder' ? DEPARTMENT_OPTIONS[2] : null);
  if (known) return known;
  return {
    slug: s,
    name: name || slug || 'Section',
    color: 'slate',
    dot: 'bg-slate-500',
    bg: 'bg-slate-50 text-slate-700 ring-slate-200',
  };
};

export const RETAIL_FORM_STEPS = [
  { id: 1, title: 'Basic Details', subtitle: 'Category & SKU', icon: Package },
  { id: 2, title: 'Pricing & Units', subtitle: 'Unit, MRP & Stock', icon: Tag },
  { id: 3, title: 'Media & Details', subtitle: 'Photos & Highlights', icon: ImageIcon },
  { id: 4, title: 'Farmer Traceability', subtitle: 'Farmer & Land Specs', icon: Tractor },
];

export const BULK_FORM_STEPS = [
  { id: 1, title: 'Basic Details', subtitle: 'Category & SKU', icon: Package },
  { id: 2, title: 'Grade Pricing', subtitle: 'A / B / C grades', icon: Boxes },
  { id: 3, title: 'Media & Details', subtitle: 'Photos & Highlights', icon: ImageIcon },
  { id: 4, title: 'Farmer Traceability', subtitle: 'Farmer & Land Specs', icon: Tractor },
];

/** @deprecated use RETAIL_FORM_STEPS / BULK_FORM_STEPS */
export const FORM_STEPS = RETAIL_FORM_STEPS;

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

export const DEFAULT_BULK_GRADES = [
  { grade: 'A', variety: '', price: '', mrp: '', stock: 0, unit: '1 Kg', isAvailable: false, minOrderQuantity: 1 },
  { grade: 'B', variety: '', price: '', mrp: '', stock: 0, unit: '1 Kg', isAvailable: false, minOrderQuantity: 1 },
  { grade: 'C', variety: '', price: '', mrp: '', stock: 0, unit: '1 Kg', isAvailable: false, minOrderQuantity: 1 },
];

export const GRADE_META = {
  A: { title: 'Grade A', hint: 'Premium / export quality', tone: 'border-emerald-200 bg-emerald-50/70' },
  B: { title: 'Grade B', hint: 'Standard retail quality', tone: 'border-amber-200 bg-amber-50/70' },
  C: { title: 'Grade C', hint: 'Economy / processing quality', tone: 'border-slate-200 bg-slate-50' },
};

function normalizeFormBulkGrades(grades = []) {
  const byGrade = new Map(
    (Array.isArray(grades) ? grades : []).map((g) => [String(g.grade || '').toUpperCase(), g])
  );

  return DEFAULT_BULK_GRADES.map((fallback) => {
    const existing = byGrade.get(fallback.grade);
    if (!existing) return { ...fallback };
    return {
      grade: fallback.grade,
      variety: existing.variety || '',
      price: existing.price != null && existing.price !== '' ? String(existing.price) : '',
      mrp: existing.mrp != null && existing.mrp !== '' ? String(existing.mrp) : '',
      stock: existing.stock != null ? existing.stock : 0,
      unit: existing.unit || '1 Kg',
      isAvailable: Boolean(existing.isAvailable),
      minOrderQuantity: existing.minOrderQuantity || 1,
    };
  });
}

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
  { name: 'Leaf Green', hex: '#217346', borderHex: '#217346' },
  { name: 'Soft Rose', hex: '#E11D48', borderHex: '#E11D48' },
  { name: 'Citrus Gold', hex: '#CA8A04', borderHex: '#CA8A04' },
  { name: 'Teal', hex: '#0D9488', borderHex: '#0D9488' },
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
  const [selectedDepartment, setSelectedDepartment] = useState(null); // null | slug
  const [selectedCategory, setSelectedCategory] = useState(null); // null | name
  const [selectedSubcategory, setSelectedSubcategory] = useState(null); // null | name
  const [stockFilter, setStockFilter] = useState('all'); // all, in_stock, out_of_stock
  const [viewMode, setViewMode] = useState('table'); // table or grid

  // Drill-down: audience → sections → categories → subcategories → products
  const [navLevel, setNavLevel] = useState('audience'); // audience | sections | categories | subcategories | products
  const [listAudience, setListAudience] = useState(null); // null | retail | bulk

  // Taxonomy CRUD (section / category / subcategory)
  const [taxModal, setTaxModal] = useState(null);
  // { kind: 'section'|'category'|'subcategory', mode: 'create'|'edit'|'delete', item?: any }
  const [taxForm, setTaxForm] = useState({ name: '', slug: '', description: '', categoryImage: '' });
  const [taxBusy, setTaxBusy] = useState(false);
  const [taxImageUploading, setTaxImageUploading] = useState(false);
  const catTaxImageInputRef = useRef(null);

  // Full-page Add/Edit Mode
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [catalogMode, setCatalogMode] = useState(null); // null | 'retail' | 'bulk'
  const [formStep, setFormStep] = useState(0);
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
    enableBulkGrades: false,
    bulkGrades: normalizeFormBulkGrades(),
    varietyGroupId: '',
    varietyName: '',
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

  // Media video preview toggle
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
      // Use /products/all for true catalog stock (not dark-store overlay)
      const [prodRes, catRes, secRes] = await Promise.allSettled([
        apiClient.get('/products/all', { params: { limit: 500 } }),
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
      } else {
        try {
          const fallback = await sectionApi.getActiveSections({ includeInactive: true });
          if (fallback?.success && Array.isArray(fallback.data)) setSections(fallback.data);
        } catch (_) {
          /* ignore */
        }
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
    return categories.filter((c) => sectionMatches(c.section, formData.department));
  }, [categories, formData.department]);

  const formDepartmentOptions = useMemo(() => {
    if (sections.length > 0) {
      return sections.map((s) => {
        const theme = getSectionTheme(s.slug, s.sectionName);
        return { ...theme, slug: s.slug, name: s.sectionName || theme.name };
      });
    }
    return DEPARTMENT_OPTIONS;
  }, [sections]);

  // Available subcategories for the selected category
  const availableSubcategoriesForForm = useMemo(() => {
    if (!formData.category) return [];
    const found = categories.find(
      (c) => c.categoryName.toLowerCase() === formData.category.toLowerCase()
    );
    return Array.isArray(found?.subcategories) ? found.subcategories : [];
  }, [categories, formData.category]);

  // Open Create Form — prefill from drill-down path when available
  const handleOpenCreate = (options = {}) => {
    const defaultCat =
      options.category ||
      selectedCategory ||
      categories[0]?.categoryName ||
      '';
    const defaultSub =
      options.subcategory ||
      selectedSubcategory ||
      (categories.find((c) => c.categoryName === defaultCat)?.subcategories?.[0]) ||
      'General';
    const defaultSec =
      options.department ||
      selectedDepartment ||
      categories[0]?.section ||
      'greengrocc';
    const mode =
      options.catalogMode ||
      listAudience ||
      null;
    const isBulk = mode === 'bulk';

    setEditingProduct(null);
    setCatalogMode(mode);
    setFormData({
      name: options.name || '',
      sku: `GRN-${Date.now().toString().slice(-6)}`,
      department: defaultSec,
      category: defaultCat,
      subcategory: defaultSub,
      brandName: options.brandName || 'GreenGrocc',
      unitQuantity: 1,
      unitType: 'Piece',
      unit: '1 Piece',
      variantType: options.variantType || 'single',
      variants: Array.isArray(options.variants) ? options.variants : [],
      enableBulkGrades: isBulk,
      bulkGrades: isBulk
        ? normalizeFormBulkGrades(options.bulkGrades).map((g, idx) => ({
            ...g,
            isAvailable: options.bulkGrades ? g.isAvailable : true,
            unit: g.unit || '1 Kg',
          }))
        : normalizeFormBulkGrades(),
      varietyGroupId: options.varietyGroupId || '',
      varietyName: options.varietyName || '',
      price: options.price != null ? String(options.price) : '',
      discountedPrice: options.discountedPrice != null ? String(options.discountedPrice) : '',
      discountedPercent: options.discountedPercent || 0,
      stock: options.stock != null ? options.stock : 100,
      inStock: options.inStock !== undefined ? options.inStock : true,
      minOrderQuantity: options.minOrderQuantity ?? 1,
      maxOrderQuantity: options.maxOrderQuantity ?? '',
      stepByQuantity: options.stepByQuantity || 1,
      cardGlowColor: options.cardGlowColor || '',
      badge: options.badge || '',
      productImages: Array.isArray(options.productImages) ? [...options.productImages] : [],
      videoUrl: options.videoUrl || '',
      description: options.description || '',
      features: Array.isArray(options.features) ? [...options.features] : [],
      specifications: Array.isArray(options.specifications) ? [...options.specifications] : [],
      isActive: true,
      farmerName: options.farmerName || '',
      farmerLocation: options.farmerLocation || '',
      farmerImage: options.farmerImage || '',
      farmImage: options.farmImage || '',
      harvestingDate: options.harvestingDate || 'Today (Fresh Morning Harvest)',
      farmerDetails: {
        totalArea: options.farmerDetails?.totalArea || '',
        cultivationArea: options.farmerDetails?.cultivationArea || '',
        cropCycle: options.farmerDetails?.cropCycle || '',
        agricultureMethod: options.farmerDetails?.agricultureMethod || '',
        lastCropTaken: options.farmerDetails?.lastCropTaken || '',
        currentCrop: options.farmerDetails?.currentCrop || '',
        waterSource: options.farmerDetails?.waterSource || '',
        soilType: options.farmerDetails?.soilType || '',
        farmTools: options.farmerDetails?.farmTools || '',
        bio: options.farmerDetails?.bio || '',
      },
    });
    setImageUrlInput('');
    setVideoUrlInput('');
    setFeatureInput('');
    setSpecKeyInput('');
    setSpecValInput('');
    setError('');
    // Skip type picker when we already know audience from drill-down / variety clone
    setFormStep(mode ? 1 : 0);
    setIsEditorOpen(true);
  };

  /** Clone product as a new variety — keeps category/media/farmer, new SKU & editable pricing */
  const handleAddVariety = (product) => {
    const isBulk = Boolean(product.enableBulkGrades);
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    const groupId = product.varietyGroupId || product._id;
    handleOpenCreate({
      catalogMode: isBulk ? 'bulk' : 'retail',
      name: product.name || '',
      varietyGroupId: String(groupId),
      varietyName: '',
      department: product.section || selectedDepartment || 'greengrocc',
      category: Array.isArray(product.categories) ? product.categories[0] : product.category,
      subcategory: product.subcategory || selectedSubcategory || 'General',
      brandName: product.brandName || 'GreenGrocc',
      variantType: isBulk ? 'single' : hasVariants ? 'multi' : 'single',
      variants: hasVariants
        ? product.variants.map((v) => ({
            quantity: v.quantity || 1,
            unitType: v.unitType || 'Piece',
            name: v.name || '',
            price: '',
            discountedPrice: '',
            discountedPercent: 0,
            stock: 100,
            inStock: true,
          }))
        : [],
      enableBulkGrades: isBulk,
      bulkGrades: isBulk
        ? (Array.isArray(product.bulkGrades) ? product.bulkGrades : []).map((g) => ({
            ...g,
            price: '',
            discountedPrice: '',
            discountedPercent: 0,
            stock: g.stock ?? 100,
            inStock: g.inStock !== false,
          }))
        : undefined,
      productImages: product.productImages,
      videoUrl: product.videoUrl,
      description: product.description,
      features: product.features,
      specifications: product.specifications,
      farmerName: product.farmerName,
      farmerLocation: product.farmerLocation,
      farmerImage: product.farmerImage,
      farmImage: product.farmImage,
      harvestingDate: product.harvestingDate,
      farmerDetails: product.farmerDetails,
      cardGlowColor: product.cardGlowColor,
      badge: product.badge,
      minOrderQuantity: product.minOrderQuantity,
      maxOrderQuantity: product.maxOrderQuantity,
      stepByQuantity: product.stepByQuantity,
      price: '',
      discountedPrice: '',
      stock: 100,
    });
  };

  const startCatalogMode = (mode) => {
    const isBulk = mode === 'bulk';
    setCatalogMode(mode);
    setFormData((prev) => ({
      ...prev,
      enableBulkGrades: isBulk,
      bulkGrades: isBulk
        ? normalizeFormBulkGrades().map((g) => ({
            ...g,
            isAvailable: true,
            unit: '1 Kg',
          }))
        : normalizeFormBulkGrades(),
      variantType: isBulk ? 'single' : prev.variantType,
      variants: isBulk ? [] : prev.variants,
    }));
    setError('');
    setFormStep(1);
  };

  // Open Edit Form
  const handleOpenEdit = (product) => {
    const primaryCat = Array.isArray(product.categories) ? product.categories[0] : product.category || '';
    const foundCat = categories.find((c) => c.categoryName.toLowerCase() === primaryCat.toLowerCase());
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    const parsedSingle = parseUnitInfo(product.unit || product.sub || product.weight || '1 Piece');

    setEditingProduct(product);
    const isBulkProduct = Boolean(product.enableBulkGrades);
    setCatalogMode(isBulkProduct ? 'bulk' : 'retail');
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
      enableBulkGrades: Boolean(product.enableBulkGrades),
      bulkGrades: normalizeFormBulkGrades(product.bulkGrades),
      varietyGroupId: product.varietyGroupId || '',
      varietyName: product.varietyName || '',
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

  const handleBulkGradeChange = (grade, field, value) => {
    setFormData((prev) => ({
      ...prev,
      bulkGrades: prev.bulkGrades.map((entry) =>
        entry.grade === grade ? { ...entry, [field]: value } : entry
      ),
    }));
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

      const res = await apiClient.post('/upload', uploadData);
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

      const res = await apiClient.post('/upload', uploadData);
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

      const res = await apiClient.post('/upload', uploadData);
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
    } else if (catalogMode !== 'bulk' && !formData.enableBulkGrades) {
      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        setError('Please enter a valid regular price');
        return;
      }
    }

    if (catalogMode === 'bulk' || formData.enableBulkGrades) {
      const availableGrades = formData.bulkGrades.filter((g) => g.isAvailable);
      if (!availableGrades.length) {
        setError('Enable at least one Grade (A, B or C) with pricing for bulk users');
        return;
      }
      for (const g of availableGrades) {
        const gradePrice = parseFloat(g.price);
        if (isNaN(gradePrice) || gradePrice < 0) {
          setError(`${GRADE_META[g.grade]?.title || `Grade ${g.grade}`} needs a valid selling price`);
          return;
        }
      }
    }

    const isBulkSave = catalogMode === 'bulk' || formData.enableBulkGrades;
    const firstVar = formData.variants[0];
    let priceNum =
      formData.variantType === 'multi' && firstVar
        ? parseFloat(firstVar.price) || 0
        : parseFloat(formData.price) || 0;
    let discNum =
      formData.variantType === 'multi' && firstVar
        ? parseFloat(firstVar.discountedPrice) || priceNum
        : parseFloat(formData.discountedPrice) || priceNum;

    if (isBulkSave) {
      const gradePrices = formData.bulkGrades
        .filter((g) => g.isAvailable)
        .map((g) => parseFloat(g.price) || 0);
      if (gradePrices.length) {
        priceNum = Math.max(...gradePrices.map((p) => p || 0), priceNum || 0) || gradePrices[0] || 1;
        discNum = Math.min(...gradePrices.filter((p) => p >= 0));
        if (!Number.isFinite(discNum)) discNum = priceNum;
      }
    }

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
        varietyGroupId: formData.varietyGroupId?.trim() || '',
        varietyName: formData.varietyName?.trim() || '',
        variantType: formData.variantType === 'multi' ? 'multi' : 'single',
        variants: resolvedVariants,
        enableBulkGrades: isBulkSave,
        bulkGrades: isBulkSave
          ? formData.bulkGrades.map((g) => ({
              grade: g.grade,
              variety: String(g.variety || '').trim(),
              price: parseFloat(g.price) || 0,
              mrp: parseFloat(g.mrp) || 0,
              stock: parseInt(g.stock, 10) || 0,
              unit: String(g.unit || '1 Kg').trim() || '1 Kg',
              isAvailable: Boolean(g.isAvailable),
              minOrderQuantity: parseInt(g.minOrderQuantity, 10) || 1,
            }))
          : [],
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
        await apiClient.put(`/products/${editingProduct._id}`, payload);
        setSuccessMsg(`Product "${formData.name}" updated successfully!`);
      } else {
        await apiClient.post(`/products`, payload);
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
      await apiClient.delete(`/products/${productToDelete._id}`);
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
      await apiClient.put(`/products/${product._id}`, {
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

  // Filtered Products (strict drill-down path)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (listAudience === 'bulk' && !p.enableBulkGrades) return false;
      if (listAudience === 'retail' && p.enableBulkGrades) return false;

      if (selectedDepartment) {
        if (!sectionMatches(p.section, selectedDepartment)) return false;
      }

      if (selectedCategory) {
        const pCats = Array.isArray(p.categories) ? p.categories : [p.category];
        const hasCat = pCats.some(
          (c) => String(c || '').toLowerCase() === selectedCategory.toLowerCase()
        );
        if (!hasCat) return false;
      }

      if (selectedSubcategory) {
        const sub = String(p.subcategory || 'General').toLowerCase();
        if (sub !== selectedSubcategory.toLowerCase()) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(query);
        const matchesSku = (p.sku || '').toLowerCase().includes(query);
        const matchesBrand = (p.brandName || '').toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesBrand) return false;
      }

      if (stockFilter === 'in_stock' && !p.inStock) return false;
      if (stockFilter === 'out_of_stock' && p.inStock) return false;

      return true;
    });
  }, [
    products,
    searchQuery,
    selectedDepartment,
    selectedCategory,
    selectedSubcategory,
    stockFilter,
    listAudience,
  ]);

  const audienceProducts = useMemo(() => {
    if (listAudience === 'bulk') return products.filter((p) => p.enableBulkGrades);
    if (listAudience === 'retail') return products.filter((p) => !p.enableBulkGrades);
    return products;
  }, [products, listAudience]);

  const metrics = useMemo(() => {
    const scoped = audienceProducts.filter((p) => {
      if (selectedDepartment && !sectionMatches(p.section, selectedDepartment)) {
        return false;
      }
      if (selectedCategory) {
        const pCats = Array.isArray(p.categories) ? p.categories : [p.category];
        if (!pCats.some((c) => String(c || '').toLowerCase() === selectedCategory.toLowerCase())) {
          return false;
        }
      }
      if (selectedSubcategory) {
        if (String(p.subcategory || 'General').toLowerCase() !== selectedSubcategory.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
    const total = scoped.length;
    const inStockCount = scoped.filter((p) => p.inStock).length;
    const outOfStockCount = total - inStockCount;
    const activeCount = scoped.filter((p) => p.isActive).length;
    return { total, inStockCount, outOfStockCount, activeCount };
  }, [audienceProducts, selectedDepartment, selectedCategory, selectedSubcategory]);

  const drillCategories = useMemo(() => {
    if (!selectedDepartment) return [];
    const fromTaxonomy = categories.filter((c) => sectionMatches(c.section, selectedDepartment));
    const known = new Set(fromTaxonomy.map((c) => c.categoryName.toLowerCase()));
    const extras = [];
    audienceProducts.forEach((p) => {
      if (!sectionMatches(p.section, selectedDepartment)) return;
      const names = Array.isArray(p.categories) ? p.categories : [p.category];
      names.forEach((name) => {
        const n = String(name || '').trim();
        if (!n || known.has(n.toLowerCase())) return;
        known.add(n.toLowerCase());
        extras.push({ categoryName: n, section: selectedDepartment, subcategories: [] });
      });
    });
    return [...fromTaxonomy, ...extras];
  }, [categories, selectedDepartment, audienceProducts]);

  const drillSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    const found = categories.find(
      (c) => c.categoryName.toLowerCase() === selectedCategory.toLowerCase()
    );
    const fromTaxonomy = Array.isArray(found?.subcategories) ? found.subcategories : [];
    const fromProducts = audienceProducts
      .filter((p) => {
        if (selectedDepartment && !sectionMatches(p.section, selectedDepartment)) {
          return false;
        }
        const pCats = Array.isArray(p.categories) ? p.categories : [p.category];
        return pCats.some(
          (c) => String(c || '').toLowerCase() === selectedCategory.toLowerCase()
        );
      })
      .map((p) => p.subcategory || 'General');
    const merged = [...new Set([...fromTaxonomy, ...fromProducts].map((s) => String(s || 'General')))];
    return merged.length ? merged : ['General'];
  }, [categories, selectedCategory, selectedDepartment, audienceProducts]);

  const countInPath = (overrides = {}) => {
    const aud = overrides.audience ?? listAudience;
    const dept = overrides.department ?? selectedDepartment;
    const cat = overrides.category ?? selectedCategory;
    const sub = overrides.subcategory ?? selectedSubcategory;
    return products.filter((p) => {
      if (aud === 'bulk' && !p.enableBulkGrades) return false;
      if (aud === 'retail' && p.enableBulkGrades) return false;
      if (dept && !sectionMatches(p.section, dept)) return false;
      if (cat) {
        const pCats = Array.isArray(p.categories) ? p.categories : [p.category];
        if (!pCats.some((c) => String(c || '').toLowerCase() === String(cat).toLowerCase())) {
          return false;
        }
      }
      if (sub && String(p.subcategory || 'General').toLowerCase() !== String(sub).toLowerCase()) {
        return false;
      }
      return true;
    }).length;
  };

  const enterAudience = (audience) => {
    setListAudience(audience);
    setSelectedDepartment(null);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSearchQuery('');
    setNavLevel('sections');
  };

  const enterSection = (slug) => {
    setSelectedDepartment(slug);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setNavLevel('categories');
  };

  const enterCategory = (name) => {
    setSelectedCategory(name);
    setSelectedSubcategory(null);
    setSearchQuery('');
    setNavLevel('products');
  };

  const enterSubcategory = (name) => {
    setSelectedSubcategory(name);
    setNavLevel('products');
  };

  const goBreadcrumb = (level) => {
    if (level === 'audience') {
      setListAudience(null);
      setSelectedDepartment(null);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setNavLevel('audience');
      return;
    }
    if (level === 'sections') {
      setSelectedDepartment(null);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setNavLevel('sections');
      return;
    }
    if (level === 'categories') {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setNavLevel('categories');
      return;
    }
    if (level === 'subcategories' || level === 'products') {
      // Category opens products directly — keep optional subcategory filter only
      setSelectedSubcategory(null);
      setNavLevel(selectedCategory ? 'products' : 'categories');
    }
  };

  const refreshTaxonomy = async () => {
    try {
      const [catRes, secRes] = await Promise.all([
        categoryApi.getAllCategories({ limit: 200 }),
        sectionApi.getActiveSections({ includeInactive: true }),
      ]);
      if (catRes?.success && Array.isArray(catRes.data)) setCategories(catRes.data);
      if (secRes?.success && Array.isArray(secRes.data)) setSections(secRes.data);
    } catch (err) {
      console.error('Failed to refresh taxonomy:', err);
    }
  };

  const findCategoryDoc = (categoryName, sectionSlug = selectedDepartment) => {
    return categories.find((c) => {
      const nameOk = String(c.categoryName || '').toLowerCase() === String(categoryName || '').toLowerCase();
      if (!nameOk) return false;
      if (!sectionSlug) return true;
      return sectionMatches(c.section, sectionSlug);
    });
  };

  const openTaxModal = (kind, mode, item = null) => {
    setError('');
    if (kind === 'section') {
      setTaxForm({
        name: item?.sectionName || '',
        slug: item?.slug || '',
        description: item?.description || '',
        categoryImage: '',
      });
    } else if (kind === 'category') {
      setTaxForm({
        name: item?.categoryName || '',
        slug: item?.slug || '',
        description: '',
        categoryImage: item?.categoryImage || '',
      });
    } else {
      setTaxForm({
        name: typeof item === 'string' ? item : item?.name || '',
        slug: '',
        description: '',
        categoryImage: '',
      });
    }
    setTaxModal({ kind, mode, item });
  };

  const closeTaxModal = () => {
    if (taxBusy || taxImageUploading) return;
    setTaxModal(null);
    setTaxForm({ name: '', slug: '', description: '', categoryImage: '' });
    if (catTaxImageInputRef.current) catTaxImageInputRef.current.value = '';
  };

  const handleCategoryTaxImageUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WebP…)');
      return;
    }
    try {
      setTaxImageUploading(true);
      setError('');
      const uploadData = new FormData();
      uploadData.append('image', file);
      uploadData.append('folder', 'categories');

      let uploadedUrl = '';
      try {
        const res = await apiClient.post('/upload/image', uploadData);
        const data = res.data;
        uploadedUrl = data?.data?.url || data?.url || '';
        if (!data?.success) throw new Error(data?.message || 'Upload failed');
      } catch (primaryErr) {
        // Fallback to multi-file upload route used by product media
        const fallback = new FormData();
        fallback.append('files', file);
        fallback.append('folder', 'categories');
        const res2 = await apiClient.post('/upload', fallback);
        const data2 = res2.data;
        uploadedUrl = Array.isArray(data2?.urls) ? data2.urls[0] : data2?.url || '';
        if (!data2?.success || !uploadedUrl) {
          throw primaryErr;
        }
      }

      if (!uploadedUrl) throw new Error('Upload returned no URL');
      setTaxForm((prev) => ({ ...prev, categoryImage: uploadedUrl }));
      setSuccessMsg('Category image uploaded');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      console.error('Category image upload failed:', err);
      setError(err.response?.data?.message || err.message || 'Image upload failed');
    } finally {
      setTaxImageUploading(false);
      if (catTaxImageInputRef.current) catTaxImageInputRef.current.value = '';
    }
  };

  const handleTaxSubmit = async () => {
    if (!taxModal) return;
    const { kind, mode, item } = taxModal;
    const name = taxForm.name.trim();

    if (mode !== 'delete' && !name) {
      setError('Name is required.');
      return;
    }

    setTaxBusy(true);
    setError('');
    try {
      if (kind === 'section') {
        if (mode === 'delete') {
          await sectionApi.deleteSection(item._id || item.slug);
          if (selectedDepartment && sectionMatches(selectedDepartment, item.slug)) {
            setSelectedDepartment(null);
            setSelectedCategory(null);
            setSelectedSubcategory(null);
            setNavLevel('sections');
          }
          setSuccessMsg(`Deleted section "${item.sectionName || item.slug}"`);
        } else {
          const payload = {
            sectionName: name,
            slug: taxForm.slug.trim() || slugifyName(name),
            description: taxForm.description.trim(),
            isActive: true,
          };
          if (mode === 'edit') {
            await sectionApi.updateSection(item._id || item.slug, payload);
            if (selectedDepartment === item.slug && payload.slug !== item.slug) {
              setSelectedDepartment(payload.slug);
            }
            setSuccessMsg(`Updated section "${name}"`);
          } else {
            await sectionApi.createSection(payload);
            setSuccessMsg(`Created section "${name}"`);
          }
        }
      } else if (kind === 'category') {
        if (mode === 'delete') {
          await categoryApi.deleteCategory(item._id);
          if (selectedCategory === item.categoryName) {
            setSelectedCategory(null);
            setSelectedSubcategory(null);
            setNavLevel('categories');
          }
          setSuccessMsg(`Deleted category "${item.categoryName}"`);
        } else {
          const sectionObj =
            sections.find((s) => sectionMatches(s.slug, selectedDepartment)) ||
            sections.find((s) => s.slug === selectedDepartment);
          const sectionSlug = sectionObj?.slug || selectedDepartment || 'preorder';
          const sectionName =
            sectionObj?.sectionName || getSectionTheme(sectionSlug).name || sectionSlug;
          const payload = {
            categoryName: name,
            slug: taxForm.slug.trim() || slugifyName(name),
            section: sectionSlug,
            sectionName,
            categoryImage: taxForm.categoryImage?.trim() || '',
            subcategories: mode === 'edit' && Array.isArray(item?.subcategories) ? item.subcategories : [],
            isActive: true,
          };
          if (mode === 'edit') {
            await categoryApi.updateCategory(item._id, payload);
            if (selectedCategory === item.categoryName && name !== item.categoryName) {
              setSelectedCategory(name);
            }
            setSuccessMsg(`Updated category "${name}"`);
          } else {
            await categoryApi.createCategory(payload);
            setSuccessMsg(`Created category "${name}"`);
          }
        }
      } else if (kind === 'subcategory') {
        const parent = findCategoryDoc(selectedCategory);
        if (!parent?._id) {
          throw new Error('Parent category not found. Create the category first.');
        }
        const current = Array.isArray(parent.subcategories) ? [...parent.subcategories] : [];
        let next = current;

        if (mode === 'delete') {
          const oldName = typeof item === 'string' ? item : item?.name;
          next = current.filter((s) => s !== oldName);
          if (selectedSubcategory === oldName) {
            setSelectedSubcategory(null);
            setNavLevel('subcategories');
          }
          setSuccessMsg(`Deleted subcategory "${oldName}"`);
        } else if (mode === 'edit') {
          const oldName = typeof item === 'string' ? item : item?.name;
          if (current.some((s) => s.toLowerCase() === name.toLowerCase() && s !== oldName)) {
            throw new Error('That subcategory already exists.');
          }
          next = current.map((s) => (s === oldName ? name : s));
          if (selectedSubcategory === oldName) setSelectedSubcategory(name);
          setSuccessMsg(`Renamed subcategory to "${name}"`);
        } else {
          if (current.some((s) => s.toLowerCase() === name.toLowerCase())) {
            throw new Error('That subcategory already exists.');
          }
          next = [...current, name];
          setSuccessMsg(`Added subcategory "${name}"`);
        }

        await categoryApi.updateCategory(parent._id, {
          categoryName: parent.categoryName,
          section: parent.section,
          sectionName: parent.sectionName,
          subcategories: next,
        });
      }

      await refreshTaxonomy();
      setTaxModal(null);
      setTaxForm({ name: '', slug: '', description: '', categoryImage: '' });
      if (catTaxImageInputRef.current) catTaxImageInputRef.current.value = '';
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      console.error('Taxonomy save failed:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Could not save. Please try again.'
      );
    } finally {
      setTaxBusy(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER: FULL-PAGE PRODUCT EDITOR
  // -------------------------------------------------------------
  if (isEditorOpen) {
    const activeSteps = catalogMode === 'bulk' ? BULK_FORM_STEPS : RETAIL_FORM_STEPS;
    const isBulkEditor = catalogMode === 'bulk';

    return (
      <div className="space-y-5 pb-12">
        <button
          type="button"
          onClick={() => {
            if (formStep === 0 || !editingProduct) {
              if (formStep > 0 && !editingProduct) {
                setFormStep(0);
                setCatalogMode(null);
                setError('');
                return;
              }
              setIsEditorOpen(false);
              return;
            }
            setIsEditorOpen(false);
          }}
          className={BTN}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {formStep === 0
            ? 'Back to products'
            : !editingProduct
              ? 'Change catalog type'
              : 'Back to products'}
        </button>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 0 — choose Normal vs Bulk (create only) */}
        {formStep === 0 && (
          <div className={`${PANEL} p-6 sm:p-8`}>
            <div className="max-w-2xl mx-auto text-center mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                New product
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">
                Who is this product for?
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Pick one catalog. Normal and bulk products stay separate — pricing fields will not be mixed.
              </p>
            </div>

            <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => startCatalogMode('retail')}
                className="group rounded-2xl border-2 border-slate-200 bg-white p-5 text-left transition hover:border-emerald-500 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">Normal users (B2C)</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  Everyday grocery pricing — single or multi-unit packs, MRP, discount, and stock for retail shoppers.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  Continue <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => startCatalogMode('bulk')}
                className="group rounded-2xl border-2 border-slate-200 bg-white p-5 text-left transition hover:border-amber-500 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white">
                  <Boxes className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">Bulk users (B2B)</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  Wholesale catalog — Grade A, B and C with separate varieties, prices, and minimum order quantities.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                  Continue <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>
          </div>
        )}

        {formStep > 0 && catalogMode ? (
          <>
        {/* Stepper Navigation Bar */}
        <div className={`${PANEL} p-2 sm:p-2.5`}>
          <div className="mb-2 flex items-center justify-between px-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                isBulkEditor
                  ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                  : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
              }`}
            >
              {isBulkEditor ? <Boxes className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              {isBulkEditor ? 'Bulk users catalog' : 'Normal users catalog'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {activeSteps.map((step) => {
              const isCurrent = formStep === step.id;
              const isPassed = formStep > step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setFormStep(step.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-sm ring-1 ring-emerald-700/20'
                      : isPassed
                      ? 'bg-slate-50/80 border-slate-200 text-slate-800 hover:bg-slate-100'
                      : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : isPassed
                        ? 'bg-emerald-100 text-[#217346]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isPassed ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : step.id}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight truncate flex items-center gap-1.5">
                      <span>{step.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                      {step.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">

            {/* STEP 1: Basic Information & Categorization */}
            {formStep === 1 && (
              <div className={`${PANEL} p-5 space-y-4`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-[#217346] text-xs font-bold">
                        1
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Product Details & Categorization
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 ml-7">
                      Basic product name, department mapping, and category organization
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Step 1 of 4
                  </span>
                </div>

                {/* Department Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Store Department <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {formDepartmentOptions.map((dept) => {
                      const isSelected = formData.department === dept.slug;
                      return (
                        <button
                          key={dept.slug}
                          type="button"
                          onClick={() => {
                            const matchingCats = categories.filter((c) =>
                              sectionMatches(c.section, dept.slug)
                            );
                            setFormData((prev) => ({
                              ...prev,
                              department: dept.slug,
                              category: matchingCats[0]?.categoryName || '',
                              subcategory: matchingCats[0]?.subcategories?.[0] || 'General',
                            }));
                          }}
                          className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center ${ isSelected ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' }`}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Product Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fresh Palak / Spinach (250g)"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      SKU Code Identifier
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PALAK-001"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                    />
                  </div>
                </div>

                {/* Variety label — shown under Select Unit on product details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Variety name
                      {formData.varietyGroupId ? (
                        <span className="ml-1 font-medium text-amber-700">(linked variety)</span>
                      ) : null}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alphonso, Organic, Premium Cut"
                      value={formData.varietyName}
                      onChange={(e) => setFormData({ ...formData, varietyName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      Shown under Select Unit on the product page. Use Admin → Add variety to create siblings with full pricing, images & stock.
                    </p>
                  </div>
                </div>

                {/* Category, Subcategory & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 cursor-pointer shadow-sm"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Subcategory / Filter
                    </label>
                    {availableSubcategoriesForForm.length > 0 ? (
                      <select
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 cursor-pointer shadow-sm"
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
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GreenGrocc"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                    />
                  </div>
                </div>

                {/* Step 1 Footer Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className={BTN}
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
                    className={BTN_PRIMARY}
                  >
                    <span>Next: {isBulkEditor ? 'Grade Pricing' : 'Pricing & Units'}</span>
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Retail pricing OR Bulk grades (never mixed) */}
            {formStep === 2 && isBulkEditor && (
              <div className={`${PANEL} p-5 space-y-4`}>
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-800 text-xs font-bold">
                        2
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Bulk Grade Pricing (A / B / C)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 ml-7">
                      Set variety, selling price, MRP, unit and stock for each grade. Only bulk buyers see this.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Bulk catalog
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {formData.bulkGrades.map((gradeRow) => {
                    const meta = GRADE_META[gradeRow.grade] || GRADE_META.A;
                    return (
                      <div
                        key={gradeRow.grade}
                        className={`rounded-xl border p-3 space-y-2.5 ${meta.tone}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{meta.title}</p>
                            <p className="text-[11px] text-slate-500">{meta.hint}</p>
                          </div>
                          <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(gradeRow.isAvailable)}
                              onChange={(e) =>
                                handleBulkGradeChange(gradeRow.grade, 'isAvailable', e.target.checked)
                              }
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            Available
                          </label>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Variety / Type
                          </label>
                          <input
                            type="text"
                            disabled={!gradeRow.isAvailable}
                            placeholder="e.g. Premium Alphonso"
                            value={gradeRow.variety}
                            onChange={(e) =>
                              handleBulkGradeChange(gradeRow.grade, 'variety', e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 disabled:opacity-50"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Selling Price (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={!gradeRow.isAvailable}
                              value={gradeRow.price}
                              onChange={(e) =>
                                handleBulkGradeChange(gradeRow.grade, 'price', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900 disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              MRP (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              disabled={!gradeRow.isAvailable}
                              value={gradeRow.mrp}
                              onChange={(e) =>
                                handleBulkGradeChange(gradeRow.grade, 'mrp', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Unit
                            </label>
                            <input
                              type="text"
                              disabled={!gradeRow.isAvailable}
                              value={gradeRow.unit}
                              onChange={(e) =>
                                handleBulkGradeChange(gradeRow.grade, 'unit', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Stock
                            </label>
                            <input
                              type="number"
                              min="0"
                              disabled={!gradeRow.isAvailable}
                              value={gradeRow.stock}
                              onChange={(e) =>
                                handleBulkGradeChange(
                                  gradeRow.grade,
                                  'stock',
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 disabled:opacity-50"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Min order qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            disabled={!gradeRow.isAvailable}
                            value={gradeRow.minOrderQuantity}
                            onChange={(e) =>
                              handleBulkGradeChange(
                                gradeRow.grade,
                                'minOrderQuantity',
                                parseInt(e.target.value, 10) || 1
                              )
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setIsEditorOpen(false)} className={BTN}>
                      Cancel
                    </button>
                    <button type="button" onClick={() => setFormStep(1)} className={BTN}>
                      <ChevronLeft className="mr-1.5 h-4 w-4" />
                      Back
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const available = formData.bulkGrades.filter((g) => g.isAvailable);
                      if (!available.length) {
                        setError('Mark at least one grade as available');
                        return;
                      }
                      const missingPrice = available.find((g) => {
                        const p = parseFloat(g.price);
                        return isNaN(p) || p < 0;
                      });
                      if (missingPrice) {
                        setError(`${GRADE_META[missingPrice.grade]?.title} needs a valid selling price`);
                        return;
                      }
                      setError('');
                      setFormStep(3);
                    }}
                    className={BTN_PRIMARY}
                  >
                    <span>Next: Media & Details</span>
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {formStep === 2 && !isBulkEditor && (
              <div className={`${PANEL} p-5 space-y-4`}>
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-[#217346] text-xs font-bold">
                        2
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Pricing & Inventory Units
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 ml-7">
                      Retail B2C pricing only — unit, MRP, discount and stock for normal shoppers
                    </p>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, variantType: 'single' }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${ formData.variantType !== 'multi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 ' }`}
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${ formData.variantType === 'multi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 ' }`}
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
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                        />
                      </div>

                      <div className="sm:col-span-8">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Unit Measurement <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Display: {formData.unit || '1 Piece'}
                          </span>
                        </div>
                        <select
                          value={formData.unitType || 'Piece'}
                          onChange={(e) => handleSingleUnitChange(formData.unitQuantity, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 cursor-pointer shadow-sm"
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
                      <span className="text-xs text-slate-500 font-medium mr-1">Presets:</span>
                      {PRESET_UNIT_OPTIONS.map((p) => {
                        const isSel = String(formData.unitQuantity) === String(p.qty) && formData.unitType === p.type;
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => handleApplyPresetUnit(p)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                              isSel
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                            className="w-full pl-7 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Selling Price (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#217346] text-xs font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="28"
                            value={formData.discountedPrice}
                            onChange={(e) => handlePriceChange(formData.price, e.target.value)}
                            className="w-full pl-7 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#217346] focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Discount % Off
                        </label>
                        <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-[#217346] flex items-center justify-between">
                          <span>{formData.discountedPercent}% OFF</span>
                          <span className="text-[10px] font-normal text-slate-400">Calculated</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock & Limits Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Stock Quantity
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="100"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Min Order Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={formData.minOrderQuantity}
                          onChange={(e) => setFormData({ ...formData, minOrderQuantity: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 1 })}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Max Order Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="50 (Optional)"
                          value={formData.maxOrderQuantity}
                          onChange={(e) => setFormData({ ...formData, maxOrderQuantity: e.target.value === '' ? '' : parseInt(e.target.value, 10) || '' })}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1 sm:pt-6">
                        <input
                          type="checkbox"
                          id="productInStock"
                          checked={formData.inStock}
                          onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                          className="h-4 w-4 rounded text-[#217346] focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                        />
                        <label htmlFor="productInStock" className="text-xs font-semibold text-slate-800 cursor-pointer">
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
                            className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
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
                          className="p-3 rounded-lg bg-slate-50/50 /40 border border-slate-200 space-y-2"
                        >
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                              <span className="text-xs font-semibold text-slate-900">
                                {variant.name || `${variant.quantity || 1} ${variant.unitType || 'Piece'}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={variant.inStock !== false}
                                  onChange={(e) => handleVariantFieldChange(idx, 'inStock', e.target.checked)}
                                  className="h-3.5 w-3.5 rounded text-[#217346] focus:ring-emerald-500 accent-emerald-700 cursor-pointer"
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
                              <label className="block text-[11px] text-slate-500 mb-0.5">Qty</label>
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={variant.quantity != null ? variant.quantity : ''}
                                onChange={(e) => handleVariantFieldChange(idx, 'quantity', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-medium text-slate-900"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 mb-0.5">Unit</label>
                              <select
                                value={variant.unitType || 'Piece'}
                                onChange={(e) => handleVariantFieldChange(idx, 'unitType', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-medium text-slate-900 cursor-pointer"
                              >
                                {STANDARD_UNIT_TYPES.map((u) => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 mb-0.5">MRP (₹)</label>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={variant.price}
                                onChange={(e) => handleVariantFieldChange(idx, 'price', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-medium text-slate-900"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 mb-0.5">Selling (₹)</label>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={variant.discountedPrice}
                                onChange={(e) => handleVariantFieldChange(idx, 'discountedPrice', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs font-bold text-[#217346]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 mb-0.5">Discount</label>
                              <div className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-bold text-[#217346] text-center">
                                {variant.discountedPercent || 0}% OFF
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-500 mb-0.5">Stock</label>
                              <input
                                type="number"
                                min="0"
                                value={variant.stock}
                                onChange={(e) => handleVariantFieldChange(idx, 'stock', e.target.value)}
                                className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-900"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddVariantOption(1, 'Piece')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Another Variant</span>
                    </button>
                  </div>
                )}

                {/* Step 2 Footer Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(false)}
                      className={BTN}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStep(1)}
                      className={BTN}
                    >
                      <ChevronLeft className="mr-1.5 h-4 w-4" />
                      Back
                    </button>
                  </div>

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
                    className={BTN_PRIMARY}
                  >
                    <span>Next: Media & Details</span>
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Media Assets & Description */}
            {formStep === 3 && (
              <div className={`${PANEL} p-5 space-y-4`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-[#217346] text-xs font-bold">
                        3
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Media & Product Content
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 ml-7">
                      Upload product photography, promotional video, and bullet point highlights
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Step 3 of 4
                  </span>
                </div>

                {/* Product Photos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Product Images ({formData.productImages.length}) <span className="text-slate-400 font-normal">• First image is Cover</span>
                    </label>

                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setImageMode('upload')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${ imageMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 ' }`}
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageMode('url')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${ imageMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 ' }`}
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
                        className="flex items-center justify-between px-4 py-3 rounded-lg border border-dashed border-slate-200 hover:border-emerald-600 bg-slate-50/50 /40 hover:bg-slate-50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
                            {imageUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800">
                              {imageUploading ? (
                                <span className="text-[#217346]">{uploadProgressText || 'Uploading to Cloud...'}</span>
                              ) : (
                                'Click to browse or drag photos here'
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              JPG, PNG, WebP supported
                            </div>
                          </div>
                        </div>

                        <span className="px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-sm">
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
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium cursor-pointer transition-colors shadow-sm"
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
                          className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-square shadow-sm"
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
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[9px] font-bold shadow-xs">
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
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Product Video <span className="text-slate-400 font-normal">(Optional clip)</span>
                    </label>

                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setVideoMode('upload')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${ videoMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 ' }`}
                      >
                        Upload Video
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoMode('url')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${ videoMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 ' }`}
                      >
                        Video URL
                      </button>
                    </div>
                  </div>

                  {formData.videoUrl ? (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-[#217346]" />
                        <span className="text-xs font-medium text-slate-800">Video clip attached</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewShowVideo((p) => !p)}
                          className="px-2.5 py-1 rounded bg-slate-200 text-xs font-medium text-slate-800 cursor-pointer"
                        >
                          {previewShowVideo ? 'Hide' : 'Preview'}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveVideo}
                          className="px-2.5 py-1 rounded bg-rose-50 text-rose-600 text-xs font-medium cursor-pointer"
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
                            className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-dashed border-slate-200 hover:border-emerald-600 bg-slate-50/50 /40 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <Video className="h-4 w-4 text-slate-400" />
                              <span className="text-xs text-slate-600">
                                {videoUploading ? (uploadProgressText || 'Uploading video...') : 'Select video file (MP4, WebM)'}
                              </span>
                            </div>
                            <span className="px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-medium text-slate-700">
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
                            className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={handleAddVideoUrl}
                            className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium cursor-pointer"
                          >
                            Attach
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Description & Features */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Product Description
                      </label>
                      <span className="text-[11px] text-slate-400">{formData.description.length} characters</span>
                    </div>
                    <textarea
                      rows="3"
                      placeholder="Provide detailed description of product quality, freshness, and usage..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 resize-none shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        disabled={!featureInput.trim()}
                        className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium cursor-pointer transition-colors disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>

                    {formData.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {formData.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
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
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <label htmlFor="productIsActive" className="text-xs font-semibold text-slate-800 cursor-pointer block">
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
                    className="h-4 w-4 rounded text-[#217346] focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                  />
                </div>

                {/* Step 3 Footer Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(false)}
                      className={BTN}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      className={BTN}
                    >
                      <ChevronLeft className="mr-1.5 h-4 w-4" />
                      Back
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormStep(4)}
                    className={BTN_PRIMARY}
                  >
                    <span>Next: Farmer Traceability</span>
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Direct Farmer & Farm Traceability (Fully Responsive) */}
            {formStep === 4 && (
              <div className={`${PANEL} p-4 sm:p-5 space-y-4`}>
                {/* Step Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-[#217346] text-xs font-bold shrink-0">
                        4
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        Farmer Profile & Farm Traceability
                      </h3>
                      <span className="text-[10px] font-bold text-[#217346] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                        Direct Farmer Connect
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 sm:ml-7 leading-relaxed">
                      Farmer origin, harvest timestamp, and land specifications displayed on customer app
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoFillFarmer}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Auto Fill Example</span>
                  </button>
                </div>

                {/* 1. Farmer Basic Info Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Farmer Full Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kiran Vitthal Pawar"
                      value={formData.farmerName}
                      onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>Farm Location / District</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Niphad, Nashik, Maharashtra"
                      value={formData.farmerLocation}
                      onChange={(e) => setFormData({ ...formData, farmerLocation: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Harvest Date / Status</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Today (Fresh Harvest)"
                      value={formData.harvestingDate}
                      onChange={(e) => setFormData({ ...formData, harvestingDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 shadow-sm"
                    />
                  </div>
                </div>

                {/* 2. Photo Uploaders (Responsive Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                  {/* Farmer Portrait Photo */}
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
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
                      <div className="relative h-12 w-12 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0 shadow-sm">
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium cursor-pointer shrink-0 transition-colors"
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
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Farmland Photo */}
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
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
                      <div className="relative h-12 w-12 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0 shadow-sm">
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium cursor-pointer shrink-0 transition-colors"
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
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Farm Field Specifications (6 Metrics Grid - 2 cols on mobile, 3 cols on tablet/desktop, 6 cols on wide desktop) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sprout className="h-3.5 w-3.5 text-[#217346]" />
                      <span>Farm Field Specifications (6 Metrics)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Shown in customer farm modal</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-50 /40 border border-slate-200 /70">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        🌾 Total Area
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 5.5 Acres"
                        value={formData.farmerDetails?.totalArea || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, totalArea: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 /40 border border-slate-200 /70">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        🌱 Cultivation
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 3.0 Acres"
                        value={formData.farmerDetails?.cultivationArea || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, cultivationArea: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 /40 border border-slate-200 /70">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        ⏱️ Crop Cycle
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 60 Days"
                        value={formData.farmerDetails?.cropCycle || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, cropCycle: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 /40 border border-slate-200 /70">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        🌿 Agri Method
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 100% Organic"
                        value={formData.farmerDetails?.agricultureMethod || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, agricultureMethod: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 /40 border border-slate-200 /70">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        🧅 Last Crop
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Onion"
                        value={formData.farmerDetails?.lastCropTaken || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, lastCropTaken: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 /40 border border-slate-200 /70">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        💧 Water Source
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Solar Well"
                        value={formData.farmerDetails?.waterSource || ''}
                        onChange={(e) => setFormData((p) => ({ ...p, farmerDetails: { ...p.farmerDetails, waterSource: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Farmer Story / Notes */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
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
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600 resize-none shadow-sm"
                  />
                </div>

                {/* Step 4 Footer Action — Publish only on last screen */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditorOpen(false)}
                      className={BTN}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStep(3)}
                      className={BTN}
                    >
                      <ChevronLeft className="mr-1.5 h-4 w-4" />
                      Back
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={BTN_PRIMARY}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Check className="mr-1.5 h-4 w-4" />
                        {editingProduct ? 'Save changes' : 'Publish product'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </form>
          </>
        ) : null}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: MAIN PRODUCT CATALOG (DRILL-DOWN)
  // -------------------------------------------------------------
  const activeSectionObj = sections.find((s) => sectionMatches(s.slug, selectedDepartment));
  const deptLabel =
    activeSectionObj?.sectionName ||
    getSectionTheme(selectedDepartment).name ||
    selectedDepartment;
  const isBulkAudience = listAudience === 'bulk';
  const displaySections =
    sections.length > 0
      ? sections
      : DEPARTMENT_OPTIONS.map((d) => ({
          _id: d.slug,
          slug: d.slug,
          sectionName: d.name,
          description: '',
        }));

  return (
    <div className="space-y-5 pb-10">
      {successMsg ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Catalog</p>
          <h1 className={PAGE_TITLE}>Product Management</h1>
          <p className={PAGE_SUB}>
            User type → Section → Category → Products (add products &amp; varieties here)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={fetchData} disabled={loading} className={BTN}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {navLevel === 'products' ? (
            <>
              <button type="button" onClick={() => handleOpenCreate()} className={BTN_PRIMARY}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add product
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Breadcrumb */}
      {navLevel !== 'audience' ? (
        <nav className="flex flex-wrap items-center gap-1.5 text-xs">
          <button type="button" onClick={() => goBreadcrumb('audience')} className="font-semibold text-emerald-700 hover:underline">
            User type
          </button>
          {listAudience ? (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <button type="button" onClick={() => goBreadcrumb('sections')} className="font-semibold text-slate-700 hover:underline">
                {isBulkAudience ? 'Bulk users' : 'Normal users'}
              </button>
            </>
          ) : null}
          {selectedDepartment ? (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <button type="button" onClick={() => goBreadcrumb('categories')} className="font-semibold text-slate-700 hover:underline">
                {deptLabel || selectedDepartment}
              </button>
            </>
          ) : null}
          {selectedCategory ? (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <span className="font-semibold text-slate-900">{selectedCategory}</span>
            </>
          ) : null}
        </nav>
      ) : null}

      {/* LEVEL 1 — User type */}
      {navLevel === 'audience' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => enterAudience('retail')}
            className="group rounded-2xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-emerald-500 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white">
              <User className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Normal users (B2C)</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Everyday grocery products with unit pricing for retail shoppers.
            </p>
            <p className="mt-4 text-xs font-semibold text-emerald-700">
              {countInPath({ audience: 'retail', department: null, category: null, subcategory: null })} products →
            </p>
          </button>
          <button
            type="button"
            onClick={() => enterAudience('bulk')}
            className="group rounded-2xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-amber-500 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white">
              <Boxes className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Bulk users (B2B)</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Wholesale catalog with Grade A / B / C pricing and varieties.
            </p>
            <p className="mt-4 text-xs font-semibold text-amber-700">
              {countInPath({ audience: 'bulk', department: null, category: null, subcategory: null })} products →
            </p>
          </button>
        </div>
      ) : null}

      {/* LEVEL 2 — Sections + stats */}
      {navLevel === 'sections' ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total products', value: metrics.total, hint: isBulkAudience ? 'Bulk catalog' : 'Retail catalog' },
              { label: 'In stock', value: metrics.inStockCount, hint: 'Available to sell' },
              { label: 'Out of stock', value: metrics.outOfStockCount, hint: 'Needs restock' },
              { label: 'Active in store', value: metrics.activeCount, hint: 'Visible to customers' },
            ].map((item) => (
              <div key={item.label} className={`${PANEL} p-4`}>
                <p className="text-xs font-medium text-slate-500">{item.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{item.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{item.hint}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800">Sections</h3>
              <button type="button" onClick={() => openTaxModal('section', 'create')} className={BTN_PRIMARY}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add section
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {displaySections.map((sec) => {
                const theme = getSectionTheme(sec.slug, sec.sectionName);
                const count = countInPath({
                  department: sec.slug,
                  category: null,
                  subcategory: null,
                });
                return (
                  <div
                    key={sec._id || sec.slug}
                    className={`${PANEL} relative p-5 transition hover:border-emerald-400 hover:shadow-md`}
                  >
                    <div className="absolute right-2 top-2 flex gap-0.5">
                      {sections.length > 0 ? (
                        <>
                          <button
                            type="button"
                            title="Edit section"
                            onClick={() => openTaxModal('section', 'edit', sec)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete section"
                            onClick={() => openTaxModal('section', 'delete', sec)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => enterSection(sec.slug)}
                      className="w-full pr-12 text-left"
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${theme.bg}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                        {sec.sectionName}
                      </span>
                      <p className="mt-3 text-base font-bold text-slate-900">{sec.sectionName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        /{sec.slug} · {count} products
                      </p>
                      <p className="mt-3 text-xs font-semibold text-emerald-700">Open categories →</p>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* LEVEL 3 — Categories */}
      {navLevel === 'categories' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">
              Categories in {deptLabel}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => openTaxModal('category', 'create')} className={BTN_PRIMARY}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add category
              </button>
              <button type="button" onClick={() => goBreadcrumb('sections')} className={BTN}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </button>
            </div>
          </div>
          {drillCategories.length === 0 ? (
            <div className={`${PANEL} px-6 py-12 text-center`}>
              <p className="text-sm text-slate-500">No categories in this section yet.</p>
              <button
                type="button"
                onClick={() => openTaxModal('category', 'create')}
                className={`${BTN_PRIMARY} mt-4`}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add category
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {drillCategories.map((cat) => {
                const count = countInPath({
                  category: cat.categoryName,
                  subcategory: null,
                });
                const canEdit = Boolean(cat._id);
                return (
                  <div
                    key={cat._id || cat.categoryName}
                    className={`${PANEL} relative p-4 transition hover:border-emerald-400 hover:shadow-md`}
                  >
                    {canEdit ? (
                      <div className="absolute right-2 top-2 flex gap-0.5">
                        <button
                          type="button"
                          title="Edit category"
                          onClick={() => openTaxModal('category', 'edit', cat)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Delete category"
                          onClick={() => openTaxModal('category', 'delete', cat)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => enterCategory(cat.categoryName)}
                      className="w-full pr-12 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          {cat.categoryImage ? (
                            <img
                              src={cat.categoryImage}
                              alt={cat.categoryName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FolderTree className="h-5 w-5 text-emerald-600" />
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">{count} products</span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-slate-900">{cat.categoryName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {count} product{count === 1 ? '' : 's'} · add &amp; manage varieties here
                      </p>
                      <p className="mt-3 text-xs font-semibold text-emerald-700">Open products →</p>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* LEVEL 4 — Products (directly under category) */}
      {navLevel === 'products' ? (
        <div className="space-y-4">
          <div className={`${PANEL} space-y-3 p-4`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {selectedCategory}
                  {isBulkAudience ? (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">
                      Bulk
                    </span>
                  ) : (
                    <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                      Normal
                    </span>
                  )}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Add products or clone a variety (keeps category, media &amp; farmer info).
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleOpenCreate()} className={BTN_PRIMARY}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add product
                </button>
                <button type="button" onClick={() => goBreadcrumb('categories')} className={BTN}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative max-w-md flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title, SKU, or brand…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${INPUT} pl-9`}
                />
              </div>
              {drillSubcategories.length > 0 ? (
                <select
                  value={selectedSubcategory || 'all'}
                  onChange={(e) =>
                    setSelectedSubcategory(e.target.value === 'all' ? null : e.target.value)
                  }
                  className={`${INPUT} min-w-[140px]`}
                >
                  <option value="all">All subcategories</option>
                  {drillSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              ) : null}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className={`${INPUT} min-w-[120px]`}
              >
                <option value="all">All stock</option>
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`rounded-lg p-2 transition ${
                    viewMode === 'table' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg p-2 transition ${
                    viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
              {findCategoryDoc(selectedCategory)?._id ? (
                <button
                  type="button"
                  onClick={() => openTaxModal('subcategory', 'create')}
                  className={BTN}
                  title="Add subcategory tag for this category"
                >
                  <Layers className="mr-1.5 h-4 w-4" />
                  Add subcategory
                </button>
              ) : null}
            </div>
          </div>

      {loading ? (
        <div className={`${PANEL} flex justify-center py-20 text-slate-400`}>
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={`${PANEL} px-6 py-16 text-center`}>
          <Package className="mx-auto h-10 w-10 text-emerald-600/30" />
          <p className="mt-3 text-base font-semibold text-slate-800">No products in {selectedCategory}</p>
          <p className="mt-1 text-sm text-slate-400">
            {searchQuery || stockFilter !== 'all' || selectedSubcategory
              ? 'Try clearing search or filters.'
              : 'Add the first product here, or add a variety after the first one exists.'}
          </p>
          <button type="button" onClick={() => handleOpenCreate()} className={`${BTN_PRIMARY} mt-4`}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add product
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className={`${PANEL} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  {['Product', 'Department', 'Category', 'Price', 'Stock', 'Status', ''].map((h) => (
                    <th
                      key={h || 'actions'}
                      className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const img = Array.isArray(p.productImages) && p.productImages[0] ? p.productImages[0] : '';
                  const dept = getSectionTheme(p.section);
                  const primaryCat = Array.isArray(p.categories) ? p.categories[0] : p.category;

                  return (
                    <tr
                      key={p._id}
                      onClick={() => handleOpenEdit(p)}
                      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            {img ? (
                              <img src={img} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-semibold text-slate-900">{p.name}</p>
                              <span
                                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                  p.enableBulkGrades
                                    ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                                }`}
                              >
                                {p.enableBulkGrades ? 'Bulk' : 'Normal'}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              <span className="font-mono">SKU {p.sku || '—'}</span>
                              {p.brandName ? ` · ${p.brandName}` : ''}
                              {p.unit ? ` · ${p.unit}` : ''}
                              {p.videoUrl ? ' · Video' : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${dept.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${dept.dot}`} />
                          {dept.name}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-slate-800">{primaryCat || '—'}</p>
                        <p className="text-[11px] text-slate-400">{p.subcategory || 'General'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold tabular-nums text-slate-900">
                          ₹{p.discountedPrice != null ? p.discountedPrice : p.price}
                        </p>
                        {p.price > p.discountedPrice ? (
                          <p className="text-[11px] text-slate-400">
                            <span className="line-through">₹{p.price}</span>
                            {p.discountedPercent ? (
                              <span className="ml-1 font-medium text-emerald-700">{p.discountedPercent}% off</span>
                            ) : null}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleStock(p)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition ${
                            p.inStock
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${p.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {p.inStock ? `${p.stock ?? 0} in stock` : 'Out of stock'}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                            p.isActive ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          />
                          {p.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleAddVariety(p)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 transition hover:bg-amber-100"
                            title="Clone as new variety (new SKU, same info)"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Add variety
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(p)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Delete"
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((p) => {
            const img = Array.isArray(p.productImages) && p.productImages[0] ? p.productImages[0] : '';
            const dept = getSectionTheme(p.section);
            const primaryCat = Array.isArray(p.categories) ? p.categories[0] : p.category;

            return (
              <button
                key={p._id}
                type="button"
                onClick={() => handleOpenEdit(p)}
                className={`${PANEL} group overflow-hidden text-left transition hover:border-emerald-300 hover:shadow-md`}
              >
                <div className="relative flex h-36 items-center justify-center bg-slate-50 p-3">
                  {img ? (
                    <img
                      src={img}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain transition group-hover:scale-[1.03]"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-slate-300" />
                  )}
                  <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
                    {p.discountedPercent > 0 ? (
                      <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white">
                        {p.discountedPercent}% off
                      </span>
                    ) : null}
                  </div>
                  <div className="absolute right-2.5 top-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${dept.bg}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${dept.dot}`} />
                      {dept.name}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 p-3.5">
                  <p className="text-[11px] font-medium text-slate-400">{primaryCat || 'General'}</p>
                  <h4 className="line-clamp-1 text-sm font-semibold text-slate-900">{p.name}</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold tabular-nums text-slate-900">
                      ₹{p.discountedPrice != null ? p.discountedPrice : p.price}
                    </span>
                    {p.price > p.discountedPrice ? (
                      <span className="text-xs text-slate-400 line-through">₹{p.price}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-3.5 py-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      p.inStock ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${p.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {p.inStock ? `${p.stock ?? 0} in stock` : 'Out of stock'}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleAddVariety(p)}
                      className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-1 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                      title="Add variety"
                    >
                      <Copy className="h-3 w-3" />
                      Variety
                    </button>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenEdit(p)}
                      onKeyDown={(e) => e.key === 'Enter' && handleOpenEdit(p)}
                      className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-emerald-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={() => confirmDelete(p)}
                      onKeyDown={(e) => e.key === 'Enter' && confirmDelete(p)}
                      className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

        </div>
      ) : null}

      {taxModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className={`w-full max-w-md ${PANEL} space-y-4 p-5 shadow-xl`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {taxModal.mode === 'delete'
                    ? `Delete ${taxModal.kind}`
                    : taxModal.mode === 'edit'
                      ? `Edit ${taxModal.kind}`
                      : `Add ${taxModal.kind}`}
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  {taxModal.kind === 'section'
                    ? 'Store departments like GreenGrocc, Ready2Cook…'
                    : taxModal.kind === 'category'
                      ? `Under section: ${deptLabel || selectedDepartment}`
                      : `Under category: ${selectedCategory}`}
                </p>
              </div>
              <button type="button" onClick={closeTaxModal} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {taxModal.mode === 'delete' ? (
              <p className="text-sm text-slate-600">
                Remove{' '}
                <strong className="text-slate-900">
                  &quot;
                  {taxModal.kind === 'section'
                    ? taxModal.item?.sectionName
                    : taxModal.kind === 'category'
                      ? taxModal.item?.categoryName
                      : typeof taxModal.item === 'string'
                        ? taxModal.item
                        : taxModal.item?.name}
                  &quot;
                </strong>
                ?{' '}
                {taxModal.kind === 'subcategory'
                  ? 'Products keep their current subcategory label until you reassign them.'
                  : taxModal.kind === 'section'
                    ? 'Linked categories are not deleted automatically.'
                    : 'This cannot be undone.'}
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Name</label>
                  <input
                    type="text"
                    value={taxForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setTaxForm((prev) => ({
                        ...prev,
                        name,
                        slug:
                          taxModal.kind === 'subcategory' || taxModal.mode === 'edit'
                            ? prev.slug
                            : slugifyName(name),
                      }));
                    }}
                    className={INPUT}
                    placeholder={
                      taxModal.kind === 'section'
                        ? 'e.g. GreenGrocc'
                        : taxModal.kind === 'category'
                          ? 'e.g. Fresh Vegetables'
                          : 'e.g. Leafy Greens'
                    }
                    autoFocus
                  />
                </div>
                {taxModal.kind !== 'subcategory' ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Slug</label>
                    <input
                      type="text"
                      value={taxForm.slug}
                      onChange={(e) =>
                        setTaxForm((prev) => ({ ...prev, slug: slugifyName(e.target.value) }))
                      }
                      className={INPUT}
                      placeholder="auto-from-name"
                    />
                  </div>
                ) : null}
                {taxModal.kind === 'section' ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={taxForm.description}
                      onChange={(e) =>
                        setTaxForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className={INPUT}
                      placeholder="Short note for admins"
                    />
                  </div>
                ) : null}
                {taxModal.kind === 'category' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600">
                      Category image
                    </label>
                    <input
                      ref={catTaxImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCategoryTaxImageUpload(e.target.files?.[0])}
                    />
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => !taxImageUploading && catTaxImageInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (!taxImageUploading) catTaxImageInputRef.current?.click();
                        }
                      }}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40"
                    >
                      {taxImageUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                      ) : taxForm.categoryImage ? (
                        <img
                          src={taxForm.categoryImage}
                          alt="Category"
                          className="mb-2 h-24 w-24 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <ImageIcon className="mb-2 h-7 w-7 text-slate-400" />
                      )}
                      <p className="text-xs font-semibold text-slate-700">
                        {taxForm.categoryImage ? 'Change image' : 'Upload category image'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">JPG, PNG or WebP</p>
                    </div>
                    <input
                      type="url"
                      value={taxForm.categoryImage}
                      onChange={(e) =>
                        setTaxForm((prev) => ({ ...prev, categoryImage: e.target.value.trim() }))
                      }
                      className={INPUT}
                      placeholder="Or paste image URL"
                    />
                    {taxForm.categoryImage ? (
                      <button
                        type="button"
                        onClick={() => setTaxForm((prev) => ({ ...prev, categoryImage: '' }))}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Remove image
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={closeTaxModal} disabled={taxBusy} className={BTN}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTaxSubmit}
                disabled={taxBusy}
                className={
                  taxModal.mode === 'delete'
                    ? 'inline-flex min-h-10 items-center justify-center rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60'
                    : BTN_PRIMARY
                }
              >
                {taxBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                {taxModal.mode === 'delete' ? 'Delete' : taxModal.mode === 'edit' ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteModalOpen && productToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className={`w-full max-w-md ${PANEL} space-y-4 p-5 shadow-xl`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete product</h3>
                <p className="text-xs text-slate-400">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Remove <strong className="text-slate-900">&quot;{productToDelete.name}&quot;</strong> from the
              catalog?
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
                className={BTN}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {isDeleting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
