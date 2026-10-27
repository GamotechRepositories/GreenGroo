import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, ImageIcon, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import apiClient from '../api/client';
import baseProductApi from '../api/baseProductApi';
import categoryApi from '../api/categoryApi';
import sectionApi from '../api/sectionApi';
import { apiErrorMessage, groupRealProductsByBase } from '../utils/baseProducts';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL } from '../utils/ui';

function BaseProductCard({ item, products, sharedSectionName = '', onEdit, onDelete }) {
  return (
    <div className={`${PANEL} relative p-4`}>
      <div className="absolute right-2 top-2 flex gap-0.5">
        <button
          type="button"
          title="Edit base product"
          onClick={onEdit}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        {item.sharedFrom ? null : (
          <button
            type="button"
            title="Delete base product"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-start gap-3 pr-14">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[#f4f8ec]">
          {item.image ? (
            <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-5 w-5 text-slate-300" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {products.length} product{products.length === 1 ? '' : 's'}
          </p>
          {item.sharedFrom ? (
            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
              Shared with {sharedSectionName || item.sharedFrom}
            </p>
          ) : null}
        </div>
      </div>

      {products.length ? (
        <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {products.map((product) => {
            const image = product.productImages?.[0] || product.image || '';
            const price = product.discountedPrice || product.price;
            return (
              <li key={product._id} className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                  {image ? (
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5 text-slate-300" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700" title={product.name}>
                  {product.name}
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-slate-500">
                  {price != null ? `₹${price}` : ''}
                  {product.unit ? `/${product.unit}` : ''}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
          No products yet. Pick “{item.name}” as the base product in Add product.
        </p>
      )}
    </div>
  );
}

const SECTION_ALIASES = {
  greengrocc: 'preorder',
  main: 'preorder',
  'pre-order': 'preorder',
  festive: 'ready2cook',
  'ready-2-cook': 'ready2cook',
  supermall: 'instantorder',
  mall: 'instantorder',
  instant: 'instantorder',
  instantorders: 'instantorder',
};

const canonicalSection = (value) => {
  const key = String(value || '').trim().toLowerCase();
  return SECTION_ALIASES[key] || key || 'preorder';
};

/** `/products/all` returns at most 100 rows per page. */
async function fetchAllProducts() {
  const pageOf = async (page) => {
    const { data } = await apiClient.get('/products/all', { params: { limit: 100, page } });
    return data;
  };
  const first = await pageOf(1);
  const totalPages = Number(first?.pagination?.totalPages) || 1;
  const rest = totalPages > 1
    ? await Promise.all(Array.from({ length: totalPages - 1 }, (_, i) => pageOf(i + 2)))
    : [];
  return [first, ...rest].flatMap((data) => (Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []));
}

/** Base products by section, grouped under each category — mirrors the Category page. */
export default function AllBaseProducts() {
  const navigate = useNavigate();
  const { sectionSlug } = useParams();

  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEmpty, setShowEmpty] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [secRes, catRes, baseRes, productRes] = await Promise.all([
        sectionApi.getActiveSections(),
        categoryApi.getAllCategories({ limit: 500 }),
        baseProductApi.list(),
        fetchAllProducts(),
      ]);
      setSections(secRes.data || []);
      setCategories(catRes.data || []);
      setItems(baseRes.data || []);
      setProducts(productRes);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load base products.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeSection = useMemo(
    () => sections.find((sec) => sec.slug === sectionSlug) || sections[0] || null,
    [sections, sectionSlug]
  );

  const activeSlug = activeSection ? canonicalSection(activeSection.slug) : '';

  const productsByBase = useMemo(
    () => groupRealProductsByBase(products.filter((product) => canonicalSection(product.section) === activeSlug)),
    [products, activeSlug]
  );

  /** This section's own base products, plus ones owned elsewhere whose products are also sold here. */
  const sectionItems = useMemo(
    () =>
      activeSection
        ? items
            .filter((item) => canonicalSection(item.section) === activeSlug || productsByBase.has(item.key))
            .map((item) => {
              const owner = canonicalSection(item.section);
              return owner === activeSlug ? item : { ...item, sharedFrom: owner };
            })
        : [],
    [items, activeSection, activeSlug, productsByBase]
  );

  const emptyCount = useMemo(
    () => sectionItems.filter((item) => !productsByBase.get(item.key)?.length).length,
    [sectionItems, productsByBase]
  );

  const groups = useMemo(() => {
    if (!activeSection) return [];
    const term = search.trim().toLowerCase();
    const visible = sectionItems.filter((item) => {
      const linked = productsByBase.get(item.key) || [];
      if (!showEmpty && !linked.length) return false;
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        linked.some((product) => String(product.name).toLowerCase().includes(term))
      );
    });

    const categoryNames = categories
      .filter((cat) => canonicalSection(cat.section) === activeSlug)
      .map((cat) => cat.categoryName);
    const byCategory = new Map(categoryNames.map((name) => [name.toLowerCase(), { name, items: [] }]));
    visible.forEach((item) => {
      const key = String(item.category || '').toLowerCase();
      if (!byCategory.has(key)) byCategory.set(key, { name: item.category || 'Uncategorised', items: [] });
      byCategory.get(key).items.push(item);
    });

    return [...byCategory.values()]
      .filter((group) => group.items.length)
      .map((group) => ({ ...group, items: group.items.sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeSection, activeSlug, sectionItems, productsByBase, categories, search, showEmpty]);

  const totals = useMemo(
    () =>
      groups.reduce(
        (acc, group) => {
          acc.base += group.items.length;
          group.items.forEach((item) => {
            acc.products += productsByBase.get(item.key)?.length || 0;
          });
          return acc;
        },
        { base: 0, products: 0 }
      ),
    [groups, productsByBase]
  );

  const addUrl = (category = '') => {
    const params = new URLSearchParams();
    if (activeSection) params.set('section', activeSection.slug);
    if (category) params.set('category', category);
    return `/products/base-products/add?${params}`;
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete base product "${item.name}"?`)) return;
    try {
      setError('');
      await baseProductApi.remove(item._id);
      setItems((prev) => prev.filter((row) => row._id !== item._id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete base product.'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={PAGE_KICKER}>Catalog · Product</p>
          <h1 className={PAGE_TITLE}>All base products</h1>
          <p className={PAGE_SUB}>
            Base products per section and category, with the real products available under each.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={fetchData} disabled={loading} className={BTN}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button type="button" onClick={() => navigate(addUrl())} className={BTN_PRIMARY}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add base product
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {sections.length > 0 ? (
          <div className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
            {sections.map((sec) => (
              <button
                key={sec._id || sec.slug}
                type="button"
                onClick={() => navigate(`/products/base-products/${sec.slug}`)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  activeSection?.slug === sec.slug
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {sec.sectionName}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search base or product name"
              className={`${INPUT} pl-9`}
            />
          </div>
          {emptyCount > 0 ? (
            <button type="button" onClick={() => setShowEmpty((v) => !v)} className={`${BTN} text-xs`}>
              {showEmpty ? 'Hide empty' : `Show ${emptyCount} empty`}
            </button>
          ) : null}
        </div>
      </div>

      {loading && !items.length ? (
        <div className={`${PANEL} px-6 py-12 text-center text-sm text-slate-500`}>Loading base products…</div>
      ) : groups.length === 0 ? (
        <div className={`${PANEL} px-6 py-12 text-center`}>
          <p className="text-sm text-slate-500">
            No base products in {activeSection?.sectionName || 'this section'} yet.
          </p>
          <button type="button" onClick={() => navigate(addUrl())} className={`${BTN_PRIMARY} mt-4`}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add base product
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            {totals.base} base product{totals.base === 1 ? '' : 's'} · {totals.products} product
            {totals.products === 1 ? '' : 's'} in {activeSection?.sectionName}
          </p>
          {groups.map((group) => (
            <section key={group.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">
                  {group.name} <span className="font-medium text-slate-400">({group.items.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => navigate(addUrl(group.name))}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <Plus className="h-3.5 w-3.5" /> Add in {group.name}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <BaseProductCard
                    key={item._id}
                    item={item}
                    products={productsByBase.get(item.key) || []}
                    sharedSectionName={
                      item.sharedFrom
                        ? sections.find((sec) => canonicalSection(sec.slug) === item.sharedFrom)?.sectionName
                        : ''
                    }
                    onEdit={() => navigate(`/products/base-products/add?id=${item._id}`)}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
