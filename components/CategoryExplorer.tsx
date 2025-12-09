'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import clsx from 'clsx';
import { GET_CATEGORIES } from '@/lib/queries';
import { ProductGrid } from './ProductGrid';
import { LiquidLoader } from './LiquidLoader';

const CATEGORY_COPY = [
  { slugIncludes: 'case', title: 'Retail-ready device kits', note: 'Foam-packed accessories aggregated per store drop.' },
  { slugIncludes: 'iphone', title: 'Flagship handset sourcing', note: 'Launch-day iPhones with IMEI manifests & insurance.' },
  { slugIncludes: 'strap', title: 'Boutique strap assortments', note: 'MOQ-friendly color mixes for watch studios.' },
  { slugIncludes: 'vape', title: 'Regulated vape programs', note: 'Duty-paid pods with HS codes + temperature logs.' },
];

const defaultCopy = {
  title: 'Export merch staging',
  note: 'We palletize lifestyle hardware & FMCG edits for overseas distributors.',
};

const pickCopy = (slug: string | undefined) => {
  if (!slug) return defaultCopy;
  const found = CATEGORY_COPY.find((item) => slug.toLowerCase().includes(item.slugIncludes));
  return found ?? defaultCopy;
};

export function CategoryExplorer() {
  const { data, loading, error } = useQuery(GET_CATEGORIES, {
    variables: { perPage: 50 },
  });
  const categories = useMemo(() => data?.productCategories?.edges ?? [], [data]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const gridAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeCategory && categories.length) {
      const first = categories[0]?.node?.name;
      if (first) setActiveCategory(first);
    }
  }, [categories, activeCategory]);

  const handleSelect = (cat: any) => {
    const name = cat?.node?.name;
    if (!name) return;
    setActiveCategory(name);
    const anchor = gridAnchorRef.current;
    if (anchor) {
      const top = window.scrollY + anchor.getBoundingClientRect().top - 210;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section id="categories" className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Export verticals</p>
          <h2 className="text-3xl font-bold">Build mixed containers that clear customs without hassle.</h2>
          <p className="text-sm text-slate-500">
            Tap a vertical to preview ready-to-ship assortments, packing formats, and paperwork stacks we handle every
            week for foreign retail partners.
          </p>
        </div>
      </div>
      {loading && <LiquidLoader message="Loading categories…" />}
      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">{error.message}</div>
      )}
      <div className="sticky top-32 z-10 -mx-4 rounded-3xl border border-slate-100 bg-white/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-none sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category: any) => {
            const isActive = activeCategory === category?.node?.name;
            const copy = pickCopy(category?.node?.slug);
            return (
              <button
                key={category?.node?.slug}
                type="button"
                onClick={() => handleSelect(category)}
                className={clsx(
                  'group min-w-[9.5rem] shrink-0 rounded-2xl border px-4 py-3 text-left text-sm shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  isActive
                    ? 'border-transparent bg-gradient-to-br from-indigo-800 to-black text-white shadow-lg focus-visible:ring-white/70'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus-visible:ring-slate-500/30'
                )}
              >
                <span
                  className={clsx(
                    'rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em]',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {category?.node?.count ?? 0} Items
                </span>
                <p className={clsx('mt-2 text-base font-semibold leading-tight', isActive ? 'text-white' : 'text-slate-900')}>
                  {category?.node?.name}
                </p>
                <p className={clsx('text-xs leading-snug', isActive ? 'text-white/80' : 'text-slate-500')}>{copy.title}</p>
                <span
                  className={clsx(
                    'mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.4em]',
                    isActive ? 'text-white' : 'text-indigo-500 group-hover:text-indigo-700'
                  )}
                >
                  Tap
                  <span aria-hidden>→</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div ref={gridAnchorRef} aria-hidden />
      {activeCategory && <ProductGrid category={activeCategory} />}
    </section>
  );
}
