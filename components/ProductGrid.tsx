'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@apollo/client';
import { GET_PRODUCTS_BY_CATEGORY } from '@/lib/queries';
import { LiquidLoader } from './LiquidLoader';

interface ProductGridProps {
  category: string;
  headline?: string;
}

export function ProductGrid({ category, headline = 'Ready-to-export edits' }: ProductGridProps) {
  const { data, loading, error } = useQuery(GET_PRODUCTS_BY_CATEGORY, {
    variables: { category },
    skip: !category,
  });

  const edges = data?.products?.edges ?? [];

  return (
    <section id="spotlight" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-500">Trade lane spotlight</p>
          <h2 className="text-3xl font-bold">{headline}</h2>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-900 hover:text-white"
        >
          View all
          <span aria-hidden>↗</span>
        </Link>
      </div>
      {loading && <LiquidLoader message="Fetching drops…" />}
      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm text-rose-700">
          {error.message}
        </div>
      )}
      {!loading && !error && edges.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          No drops in this category yet. Check back soon!
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
        {edges.map(({ node }: any) => (
          <article
            key={node.databaseId}
            className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 text-xs shadow-lg transition hover:-translate-y-1 hover:shadow-2xl sm:rounded-3xl sm:p-6 sm:text-sm"
          >
            <span className="absolute right-3 top-3 rounded-full bg-slate-900/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white sm:right-4 sm:top-4 sm:px-3 sm:text-xs">
              {node.type === 'VARIABLE' ? 'Configurable' : 'Single'}
            </span>
            {node.image?.sourceUrl ? (
              <Image
                src={node.image.sourceUrl}
                alt={node.image.altText || node.name}
                width={240}
                height={240}
                className="h-32 w-full object-contain sm:h-48"
              />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 sm:h-48">
                Image coming soon
              </div>
            )}
            <div className="mt-3 flex flex-col gap-1 sm:mt-4 sm:gap-2">
              <p className="text-sm font-semibold sm:text-lg">{node.name}</p>
              {node.price && (
                <p className="text-[11px] text-slate-500 sm:text-sm" dangerouslySetInnerHTML={{ __html: node.price }} />
              )}
            </div>
            <div className="mt-auto flex items-center justify-between pt-3 text-[11px] sm:pt-4 sm:text-sm">
              <p className="text-slate-500">
                {node.stockStatus === 'IN_STOCK' ? 'Ready to ship' : 'Backorder'}
              </p>
              <Link
                href={`/product/${node.databaseId}`}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 sm:gap-2 sm:px-4 sm:text-xs"
              >
                View
                <span aria-hidden>→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
