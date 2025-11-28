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
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {edges.map(({ node }: any) => (
          <article
            key={node.databaseId}
            className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <span className="absolute right-4 top-4 rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {node.type === 'VARIABLE' ? 'Configurable' : 'Single'}
            </span>
            {node.image?.sourceUrl ? (
              <Image
                src={node.image.sourceUrl}
                alt={node.image.altText || node.name}
                width={240}
                height={240}
                className="h-48 w-full object-contain"
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                Image coming soon
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-lg font-semibold">{node.name}</p>
              {node.price && (
                <p className="text-sm text-slate-500" dangerouslySetInnerHTML={{ __html: node.price }} />
              )}
            </div>
            <div className="mt-auto flex items-center justify-between pt-4 text-sm">
              <p className="text-slate-500">
                {node.stockStatus === 'IN_STOCK' ? 'Ready to ship' : 'Backorder'}
              </p>
              <Link
                href={`/product/${node.databaseId}`}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800"
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
