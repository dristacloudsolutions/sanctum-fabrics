'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Search,
  Check,
  RotateCcw,
  Tag,
  CircleDot,
} from 'lucide-react';
import type { CategoryGroup, AttributeFacet, AttributeFacetValue } from '@/lib/dristaService';
import { toTitleCase } from '@/lib/dristaService';
import { colorSwatchHex, splitColorList } from '@/lib/colorSwatches';
import { formatINR } from '@/lib/format';

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A–Z' },
] as const;

const PRICE_PRESETS = [
  { label: 'Under ₹1,500', min: '', max: '1500' },
  { label: '₹1,500 – ₹3,000', min: '1500', max: '3000' },
  { label: '₹3,000 – ₹5,000', min: '3000', max: '5000' },
  { label: 'Above ₹5,000', min: '5000', max: '' },
];

export default function ProductFiltersTopBar({
  categories = [],
  attributeFacets = [],
  totalCount,
  categoryFallback,
  usingSample,
}: {
  categories?: CategoryGroup[];
  attributeFacets?: AttributeFacet[];
  totalCount: number;
  categoryFallback?: boolean;
  usingSample?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active open dropdown/popover: 'category' | 'price' | 'color' | 'sort' | `attr_${key}` | null
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Local draft states for popovers that have "Apply"
  const [localSearch, setLocalSearch] = useState(searchParams.get('q') || '');
  const [localMinPrice, setLocalMinPrice] = useState(searchParams.get('min_price') || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(searchParams.get('max_price') || '');
  const [localSelectedAttrs, setLocalSelectedAttrs] = useState<Record<string, string[]>>({});

  // Sync search input if URL changes
  useEffect(() => {
    setLocalSearch(searchParams.get('q') || '');
    setLocalMinPrice(searchParams.get('min_price') || '');
    setLocalMaxPrice(searchParams.get('max_price') || '');
  }, [searchParams]);

  // Click outside listener to dismiss open popovers
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileDrawerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  // Read current filters
  const currentCategory = searchParams.get('category') || '';
  const currentSort = searchParams.get('sort') || '';
  const currentMinPrice = searchParams.get('min_price') || '';
  const currentMaxPrice = searchParams.get('max_price') || '';
  const currentDiscount = searchParams.get('discount') || '';
  const currentQ = searchParams.get('q') || '';

  // Separate color facet from other dynamic facets
  const colorFacet = attributeFacets.find((f) => f.label.toLowerCase() === 'color');
  const otherFacets = attributeFacets.filter((f) => f.label.toLowerCase() !== 'color');

  // Count active filter conditions
  const activeAttrKeys = Array.from(searchParams.keys()).filter((k) => k.startsWith('attr_'));
  const hasActiveFilters = Boolean(
    currentCategory ||
    currentMinPrice ||
    currentMaxPrice ||
    currentDiscount === '1' ||
    currentQ ||
    activeAttrKeys.length > 0
  );

  let activeFiltersCount = 0;
  if (currentCategory) activeFiltersCount++;
  if (currentMinPrice || currentMaxPrice) activeFiltersCount++;
  if (currentDiscount === '1') activeFiltersCount++;
  if (currentQ) activeFiltersCount++;
  for (const k of activeAttrKeys) {
    activeFiltersCount += searchParams.getAll(k).length;
  }

  // Push new query parameters without scrolling back to the top of page
  const updateParams = (updater: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString());
    updater(next);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    setOpenDropdown(null);
    setMobileDrawerOpen(false);
    router.push(pathname, { scroll: false });
  };

  // Category helpers
  const selectedCategoryName = (() => {
    if (!currentCategory) return null;
    for (const cat of categories) {
      if (cat.id === currentCategory) return cat.name;
      for (const child of cat.children || []) {
        if (child.id === currentCategory) return child.name;
      }
    }
    return 'Category';
  })();

  const handleSelectCategory = (catId: string) => {
    updateParams((params) => {
      if (catId) {
        params.set('category', catId);
      } else {
        params.delete('category');
      }
    });
    setOpenDropdown(null);
  };

  // Price helpers
  const handleApplyPrice = (min?: string, max?: string) => {
    const minVal = min !== undefined ? min : localMinPrice;
    const maxVal = max !== undefined ? max : localMaxPrice;
    updateParams((params) => {
      if (minVal) params.set('min_price', minVal);
      else params.delete('min_price');
      if (maxVal) params.set('max_price', maxVal);
      else params.delete('max_price');
    });
    setOpenDropdown(null);
  };

  const handleClearPrice = () => {
    setLocalMinPrice('');
    setLocalMaxPrice('');
    updateParams((params) => {
      params.delete('min_price');
      params.delete('max_price');
    });
    setOpenDropdown(null);
  };

  // Search helper
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams((params) => {
      const trimmed = localSearch.trim();
      if (trimmed) params.set('q', trimmed);
      else params.delete('q');
    });
  };

  // Toggle discount
  const handleToggleDiscount = () => {
    updateParams((params) => {
      if (currentDiscount === '1') {
        params.delete('discount');
      } else {
        params.set('discount', '1');
      }
    });
  };

  // Sort helper
  const handleSelectSort = (val: string) => {
    updateParams((params) => {
      if (val) params.set('sort', val);
      else params.delete('sort');
    });
    setOpenDropdown(null);
  };

  // Attribute facet multi-select helpers
  const isAttrSelected = (facetKey: string, val: string) => {
    return searchParams.getAll(`attr_${facetKey}`).includes(val);
  };

  const handleToggleAttr = (facetKey: string, val: string) => {
    updateParams((params) => {
      const key = `attr_${facetKey}`;
      const existing = params.getAll(key);
      params.delete(key);
      if (existing.includes(val)) {
        existing.filter((v) => v !== val).forEach((v) => params.append(key, v));
      } else {
        [...existing, val].forEach((v) => params.append(key, v));
      }
    });
  };

  const handleClearAttr = (facetKey: string) => {
    updateParams((params) => {
      params.delete(`attr_${facetKey}`);
    });
    setOpenDropdown(null);
  };

  return (
    <>
      {/* ─── Sticky Top Filter Bar ─────────────────────────────────────────── */}
      <div
        ref={barRef}
        className="sticky top-[73px] sm:top-[105px] z-40 w-full border-b border-[color:var(--border)] bg-[color:var(--cream)]/95 backdrop-blur-md transition-shadow"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Filter Buttons & Pills (Horizontal scrolling container on small screens) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
              {/* Mobile "All Filters" drawer trigger */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                  activeFiltersCount > 0
                    ? 'border-[color:var(--primary)] bg-[color:var(--primary)] text-white shadow-xs'
                    : 'border-[color:var(--border)] bg-white text-[color:var(--ink)] hover:border-[color:var(--ink)]/30'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[color:var(--primary)]">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="h-4 w-px bg-[color:var(--border)] shrink-0 hidden sm:block" />

              {/* Category Pill Dropdown */}
              {categories.length > 0 && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                    className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      currentCategory
                        ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)] font-semibold'
                        : 'border-[color:var(--border)] bg-white text-[color:var(--ink)]/80 hover:border-[color:var(--ink)]/30'
                    }`}
                  >
                    <span>{selectedCategoryName || 'Category'}</span>
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${openDropdown === 'category' ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {openDropdown === 'category' && (
                    <div className="absolute left-0 top-full mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl border border-[color:var(--border)] bg-white p-2.5 shadow-xl z-50">
                      <div className="border-b border-[color:var(--border)] pb-1.5 mb-1.5">
                        <button
                          type="button"
                          onClick={() => handleSelectCategory('')}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                            !currentCategory ? 'bg-[color:var(--cream)] font-bold text-[color:var(--accent)]' : 'text-[color:var(--ink)]/80 hover:bg-[color:var(--cream)]'
                          }`}
                        >
                          <span>All Categories</span>
                          {!currentCategory && <Check size={13} />}
                        </button>
                      </div>

                      <div className="space-y-1">
                        {categories.map((cat) => (
                          <div key={cat.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectCategory(cat.id)}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                                currentCategory === cat.id
                                  ? 'bg-[color:var(--cream)] font-bold text-[color:var(--accent)]'
                                  : 'font-medium text-[color:var(--ink)] hover:bg-[color:var(--cream)]'
                              }`}
                            >
                              <span>{cat.name}</span>
                              {currentCategory === cat.id && <Check size={13} />}
                            </button>

                            {(cat.children || []).map((child) => (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => handleSelectCategory(child.id)}
                                className={`flex w-full items-center justify-between rounded-lg pl-6 pr-2.5 py-1 text-xs ${
                                  currentCategory === child.id
                                    ? 'bg-[color:var(--cream)] font-bold text-[color:var(--accent)]'
                                    : 'text-[color:var(--ink)]/70 hover:bg-[color:var(--cream)]'
                                }`}
                              >
                                <span>{child.name}</span>
                                {currentCategory === child.id && <Check size={13} />}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Price Pill Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    currentMinPrice || currentMaxPrice
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)] font-semibold'
                      : 'border-[color:var(--border)] bg-white text-[color:var(--ink)]/80 hover:border-[color:var(--ink)]/30'
                  }`}
                >
                  <span>
                    {currentMinPrice && currentMaxPrice
                      ? `₹${currentMinPrice} – ₹${currentMaxPrice}`
                      : currentMinPrice
                      ? `> ₹${currentMinPrice}`
                      : currentMaxPrice
                      ? `< ₹${currentMaxPrice}`
                      : 'Price'}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${openDropdown === 'price' ? 'rotate-180' : ''}`}
                  />
                </button>

                {openDropdown === 'price' && (
                  <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-xl z-50">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink)]/60 mb-2.5">
                      Price Range
                    </span>

                    {/* Quick Presets */}
                    <div className="grid grid-cols-2 gap-1.5 mb-3.5">
                      {PRICE_PRESETS.map((preset) => {
                        const isPresetActive = currentMinPrice === preset.min && currentMaxPrice === preset.max;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setLocalMinPrice(preset.min);
                              setLocalMaxPrice(preset.max);
                              handleApplyPrice(preset.min, preset.max);
                            }}
                            className={`rounded-lg border px-2 py-1.5 text-[11px] text-center transition-colors ${
                              isPresetActive
                                ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white font-semibold'
                                : 'border-[color:var(--border)] bg-white text-[color:var(--ink)]/80 hover:border-[color:var(--ink)]/40'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Min / Max inputs */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[color:var(--ink)]/40">₹</span>
                        <input
                          type="number"
                          placeholder="Min"
                          value={localMinPrice}
                          onChange={(e) => setLocalMinPrice(e.target.value)}
                          className="w-full rounded-lg border border-[color:var(--border)] py-1.5 pl-6 pr-2 text-xs focus:border-[color:var(--accent)] focus:outline-hidden"
                        />
                      </div>
                      <span className="text-xs text-[color:var(--ink)]/30">–</span>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[color:var(--ink)]/40">₹</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={localMaxPrice}
                          onChange={(e) => setLocalMaxPrice(e.target.value)}
                          className="w-full rounded-lg border border-[color:var(--border)] py-1.5 pl-6 pr-2 text-xs focus:border-[color:var(--accent)] focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-[color:var(--border)] pt-2.5">
                      <button
                        type="button"
                        onClick={handleClearPrice}
                        className="text-xs font-medium text-[color:var(--ink)]/60 hover:text-[color:var(--ink)]"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPrice()}
                        className="rounded-full bg-[color:var(--primary)] px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-95"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Color Pill Dropdown */}
              {colorFacet && colorFacet.values.length > 0 && (
                <div className="relative shrink-0">
                  {(() => {
                    const selectedColors = searchParams.getAll(`attr_${colorFacet.key}`);
                    const isActive = selectedColors.length > 0;
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(openDropdown === 'color' ? null : 'color')}
                          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                            isActive
                              ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)] font-semibold'
                              : 'border-[color:var(--border)] bg-white text-[color:var(--ink)]/80 hover:border-[color:var(--ink)]/30'
                          }`}
                        >
                          {isActive && selectedColors.length === 1 ? (
                            <span
                              className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10 inline-block"
                              style={{ backgroundColor: colorSwatchHex(selectedColors[0]) || '#888' }}
                            />
                          ) : null}
                          <span>{isActive ? `Color (${selectedColors.length})` : 'Color'}</span>
                          <ChevronDown
                            size={12}
                            className={`transition-transform duration-200 ${openDropdown === 'color' ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {openDropdown === 'color' && (
                          <div className="absolute left-0 top-full mt-2 w-72 max-h-80 overflow-y-auto rounded-2xl border border-[color:var(--border)] bg-white p-3.5 shadow-xl z-50">
                            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-2 mb-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink)]/60">
                                Colors
                              </span>
                              {isActive && (
                                <button
                                  type="button"
                                  onClick={() => handleClearAttr(colorFacet.key)}
                                  className="text-[11px] font-medium text-[color:var(--accent)] hover:underline"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                              {colorFacet.values.map((v) => {
                                const checked = isAttrSelected(colorFacet.key, v.value);
                                const names = splitColorList(v.value);
                                const hexes = v.hex ? splitColorList(v.hex) : [];
                                return (
                                  <label
                                    key={v.value}
                                    className={`flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors ${
                                      checked ? 'bg-[color:var(--cream)] font-medium' : 'hover:bg-black/5'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleToggleAttr(colorFacet.key, v.value)}
                                        className="h-3.5 w-3.5 rounded text-[color:var(--accent)] accent-[color:var(--accent)]"
                                      />
                                      <span className="flex items-center shrink-0">
                                        {names.map((name, i) => {
                                          const swatch = hexes[i] || colorSwatchHex(name);
                                          return swatch ? (
                                            <span
                                              key={i}
                                              className="h-4 w-4 rounded-full ring-1 ring-black/10"
                                              style={{ backgroundColor: swatch, marginLeft: i > 0 ? '-6px' : 0 }}
                                            />
                                          ) : (
                                            <span
                                              key={i}
                                              className="h-4 w-4 rounded-full bg-[color:var(--cream)] ring-1 ring-black/10"
                                              style={{ marginLeft: i > 0 ? '-6px' : 0 }}
                                            />
                                          );
                                        })}
                                      </span>
                                      <span className="truncate text-[color:var(--ink)]">{toTitleCase(v.value)}</span>
                                    </div>
                                    <span className="text-[11px] text-[color:var(--ink)]/40 shrink-0 ml-2">({v.count})</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Dynamic Facet Pills (e.g. Size, Material, etc.) */}
              {otherFacets.map((facet) => {
                const selectedVals = searchParams.getAll(`attr_${facet.key}`);
                const isActive = selectedVals.length > 0;
                const dropdownKey = `attr_${facet.key}`;

                return (
                  <div key={facet.key} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey)}
                      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)] font-semibold'
                          : 'border-[color:var(--border)] bg-white text-[color:var(--ink)]/80 hover:border-[color:var(--ink)]/30'
                      }`}
                    >
                      <span>{isActive ? `${facet.label} (${selectedVals.length})` : facet.label}</span>
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-200 ${openDropdown === dropdownKey ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {openDropdown === dropdownKey && (
                      <div className="absolute left-0 top-full mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl border border-[color:var(--border)] bg-white p-3.5 shadow-xl z-50">
                        <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-2 mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink)]/60">
                            {facet.label}
                          </span>
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => handleClearAttr(facet.key)}
                              className="text-[11px] font-medium text-[color:var(--accent)] hover:underline"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                          {facet.values.map(({ value, count }) => {
                            const checked = isAttrSelected(facet.key, value);
                            return (
                              <label
                                key={value}
                                className={`flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors ${
                                  checked ? 'bg-[color:var(--cream)] font-medium' : 'hover:bg-black/5'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleToggleAttr(facet.key, value)}
                                    className="h-3.5 w-3.5 rounded text-[color:var(--accent)] accent-[color:var(--accent)]"
                                  />
                                  <span className="truncate text-[color:var(--ink)]">{value}</span>
                                </div>
                                <span className="text-[11px] text-[color:var(--ink)]/40 shrink-0 ml-2">({count})</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* On Sale Pill */}
              <button
                type="button"
                onClick={handleToggleDiscount}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  currentDiscount === '1'
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white shadow-xs font-semibold'
                    : 'border-[color:var(--border)] bg-white text-[color:var(--ink)]/80 hover:border-[color:var(--accent)]'
                }`}
              >
                <Tag size={12} />
                <span>On Sale</span>
              </button>
            </div>

            {/* Right: Search & Sort Dropdowns */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Search fabric, saree…"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-44 lg:w-56 rounded-full border border-[color:var(--border)] bg-white py-1.5 pl-8 pr-7 text-xs text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/40 focus:w-64 focus:border-[color:var(--accent)] focus:outline-hidden transition-all"
                />
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--ink)]/40" />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch('');
                      updateParams((p) => p.delete('q'));
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--ink)]/40 hover:text-[color:var(--ink)]"
                  >
                    <X size={12} />
                  </button>
                )}
              </form>

              {/* Sort By Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    currentSort
                      ? 'border-[color:var(--primary)] bg-[color:var(--primary)]/10 text-[color:var(--primary)] font-semibold'
                      : 'border-[color:var(--border)] bg-white text-[color:var(--ink)]/80 hover:border-[color:var(--ink)]/30'
                  }`}
                >
                  <span className="hidden sm:inline text-[color:var(--ink)]/50 font-normal">Sort:</span>
                  <span>{SORT_OPTIONS.find((o) => o.value === currentSort)?.label || 'Relevance'}</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${openDropdown === 'sort' ? 'rotate-180' : ''}`}
                  />
                </button>

                {openDropdown === 'sort' && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-[color:var(--border)] bg-white p-2 shadow-xl z-50">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectSort(opt.value)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs transition-colors ${
                          currentSort === opt.value
                            ? 'bg-[color:var(--cream)] font-bold text-[color:var(--primary)]'
                            : 'text-[color:var(--ink)]/80 hover:bg-[color:var(--cream)]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {currentSort === opt.value && <Check size={13} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Chips & Piece Count Row */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--border)]/60 pt-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-medium text-[color:var(--ink)]/60 mr-1">
                {totalCount} piece{totalCount === 1 ? '' : 's'}
              </span>

              {/* Active Chip: Category */}
              {currentCategory && selectedCategoryName && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-white px-2.5 py-0.5 text-[11px] text-[color:var(--ink)] shadow-2xs">
                  <span>Category: <strong>{selectedCategoryName}</strong></span>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('')}
                    className="text-[color:var(--ink)]/40 hover:text-[color:var(--accent)]"
                    aria-label="Remove category filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {/* Active Chip: Price */}
              {(currentMinPrice || currentMaxPrice) && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-white px-2.5 py-0.5 text-[11px] text-[color:var(--ink)] shadow-2xs">
                  <span>
                    Price: <strong>
                      {currentMinPrice && currentMaxPrice
                        ? `₹${currentMinPrice}–₹${currentMaxPrice}`
                        : currentMinPrice
                        ? `> ₹${currentMinPrice}`
                        : `< ₹${currentMaxPrice}`}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleClearPrice}
                    className="text-[color:var(--ink)]/40 hover:text-[color:var(--accent)]"
                    aria-label="Remove price filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {/* Active Chip: On Sale */}
              {currentDiscount === '1' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 px-2.5 py-0.5 text-[11px] text-[color:var(--accent)] font-medium shadow-2xs">
                  <span>On Sale</span>
                  <button
                    type="button"
                    onClick={handleToggleDiscount}
                    className="text-[color:var(--accent)] hover:opacity-80"
                    aria-label="Remove on sale filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {/* Active Chip: Search */}
              {currentQ && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-white px-2.5 py-0.5 text-[11px] text-[color:var(--ink)] shadow-2xs">
                  <span>Query: &ldquo;{currentQ}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch('');
                      updateParams((p) => p.delete('q'));
                    }}
                    className="text-[color:var(--ink)]/40 hover:text-[color:var(--accent)]"
                    aria-label="Remove search query"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {/* Active Chips: Dynamic Attribute Facets & Colors */}
              {attributeFacets.map((facet) => {
                const values = searchParams.getAll(`attr_${facet.key}`);
                return values.map((val) => (
                  <span
                    key={`${facet.key}-${val}`}
                    className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-white px-2.5 py-0.5 text-[11px] text-[color:var(--ink)] shadow-2xs"
                  >
                    <span>
                      {facet.label}: <strong>{facet.label.toLowerCase() === 'color' ? toTitleCase(val) : val}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleAttr(facet.key, val)}
                      className="text-[color:var(--ink)]/40 hover:text-[color:var(--accent)]"
                      aria-label={`Remove ${facet.label} filter`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ));
              })}

              {/* Clear All Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 ml-1 text-[11px] font-semibold text-[color:var(--accent)] hover:underline"
                >
                  <RotateCcw size={10} />
                  <span>Clear all</span>
                </button>
              )}
            </div>

            {/* Fallback / sample notes */}
            {categoryFallback && (
              <span className="text-[11px] text-[color:var(--ink)]/50 italic">
                Category has no pieces yet — showing other products.
              </span>
            )}
            {usingSample && (
              <span className="text-[11px] text-[color:var(--ink)]/40">
                Sample catalog preview
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mobile All Filters Drawer ─────────────────────────────────────── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} />
                <span className="text-sm font-bold uppercase tracking-wider text-[color:var(--ink)]">
                  Filter &amp; Sort
                </span>
                {activeFiltersCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--accent)] px-1.5 text-[11px] font-bold text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-semibold text-[color:var(--accent)] underline"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-full p-1 text-[color:var(--ink)]/50 hover:text-[color:var(--ink)]"
                  aria-label="Close filters"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 divide-y divide-[color:var(--border)]">
              {/* Mobile Search */}
              <div className="py-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/50 mb-2">
                  Search
                </label>
                <form
                  onSubmit={(e) => {
                    handleSearchSubmit(e);
                    setMobileDrawerOpen(false);
                  }}
                  className="relative"
                >
                  <input
                    type="text"
                    placeholder="Search saree, fabric…"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full rounded-xl border border-[color:var(--border)] py-2 pl-9 pr-3 text-sm focus:border-[color:var(--accent)] focus:outline-hidden"
                  />
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink)]/40" />
                </form>
              </div>

              {/* Sort by */}
              <div className="py-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/50 mb-2">
                  Sort By
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectSort(opt.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium text-left transition-colors ${
                        currentSort === opt.value
                          ? 'border-[color:var(--primary)] bg-[color:var(--primary)] text-white'
                          : 'border-[color:var(--border)] bg-white text-[color:var(--ink)]/80 hover:border-[color:var(--ink)]/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discounts */}
              <div className="py-4">
                <label className="flex items-center justify-between text-sm font-medium text-[color:var(--ink)]">
                  <span>Only On Sale</span>
                  <input
                    type="checkbox"
                    checked={currentDiscount === '1'}
                    onChange={handleToggleDiscount}
                    className="h-4 w-4 rounded text-[color:var(--accent)] accent-[color:var(--accent)]"
                  />
                </label>
              </div>

              {/* Price */}
              <div className="py-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/50 mb-2">
                  Price
                </label>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[color:var(--ink)]/40">₹</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={localMinPrice}
                      onChange={(e) => setLocalMinPrice(e.target.value)}
                      className="w-full rounded-lg border border-[color:var(--border)] py-1.5 pl-6 pr-2 text-xs"
                    />
                  </div>
                  <span className="text-xs text-[color:var(--ink)]/30">–</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[color:var(--ink)]/40">₹</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={localMaxPrice}
                      onChange={(e) => setLocalMaxPrice(e.target.value)}
                      className="w-full rounded-lg border border-[color:var(--border)] py-1.5 pl-6 pr-2 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {PRICE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setLocalMinPrice(preset.min);
                        setLocalMaxPrice(preset.max);
                        handleApplyPrice(preset.min, preset.max);
                      }}
                      className="rounded-lg border border-[color:var(--border)] px-2 py-1 text-[11px] text-center text-[color:var(--ink)]/80 hover:border-[color:var(--ink)]/40"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="py-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/50 mb-2">
                    Categories
                  </label>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => handleSelectCategory('')}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                        !currentCategory ? 'bg-[color:var(--cream)] font-bold text-[color:var(--accent)]' : 'text-[color:var(--ink)]/80'
                      }`}
                    >
                      <span>All Categories</span>
                      {!currentCategory && <Check size={13} />}
                    </button>
                    {categories.map((cat) => (
                      <div key={cat.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectCategory(cat.id)}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                            currentCategory === cat.id ? 'bg-[color:var(--cream)] font-bold text-[color:var(--accent)]' : 'font-medium text-[color:var(--ink)]'
                          }`}
                        >
                          <span>{cat.name}</span>
                          {currentCategory === cat.id && <Check size={13} />}
                        </button>
                        {(cat.children || []).map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleSelectCategory(child.id)}
                            className={`flex w-full items-center justify-between rounded-lg pl-6 pr-2.5 py-1 text-xs ${
                              currentCategory === child.id ? 'bg-[color:var(--cream)] font-bold text-[color:var(--accent)]' : 'text-[color:var(--ink)]/70'
                            }`}
                          >
                            <span>{child.name}</span>
                            {currentCategory === child.id && <Check size={13} />}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {colorFacet && colorFacet.values.length > 0 && (
                <div className="py-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/50 mb-2">
                    Colors
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {colorFacet.values.map((v) => {
                      const checked = isAttrSelected(colorFacet.key, v.value);
                      const names = splitColorList(v.value);
                      const hexes = v.hex ? splitColorList(v.hex) : [];
                      return (
                        <label
                          key={v.value}
                          className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleAttr(colorFacet.key, v.value)}
                              className="h-3.5 w-3.5 rounded text-[color:var(--accent)] accent-[color:var(--accent)]"
                            />
                            <span className="flex items-center shrink-0">
                              {names.map((name, i) => {
                                const swatch = hexes[i] || colorSwatchHex(name);
                                return swatch ? (
                                  <span
                                    key={i}
                                    className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
                                    style={{ backgroundColor: swatch, marginLeft: i > 0 ? '-4px' : 0 }}
                                  />
                                ) : null;
                              })}
                            </span>
                            <span>{toTitleCase(v.value)}</span>
                          </div>
                          <span className="text-[11px] text-[color:var(--ink)]/40">({v.count})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Other dynamic facets */}
              {otherFacets.map((facet) => (
                <div key={facet.key} className="py-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--ink)]/50 mb-2">
                    {facet.label}
                  </label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {facet.values.map(({ value, count }) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isAttrSelected(facet.key, value)}
                            onChange={() => handleToggleAttr(facet.key, value)}
                            className="h-3.5 w-3.5 rounded text-[color:var(--accent)] accent-[color:var(--accent)]"
                          />
                          <span>{value}</span>
                        </div>
                        <span className="text-[11px] text-[color:var(--ink)]/40">({count})</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-[color:var(--border)] p-4">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full rounded-full bg-[color:var(--primary)] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md"
              >
                Show {totalCount} piece{totalCount === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
