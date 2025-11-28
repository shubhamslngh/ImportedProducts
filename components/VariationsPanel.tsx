'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@apollo/client';
import { GET_PRODUCT_VARIATIONS } from '@/lib/queries';
import { LiquidLoader } from './LiquidLoader';

type VariationSelection = {
  variationId: number | null;
  image?: string | null;
  priceHtml?: string | null;
};

interface VariationsPanelProps {
  productId: number;
  productType?: string | null;
  onVariationSelected?: (selection: VariationSelection | null) => void;
}

export function VariationsPanel({ productId, productType, onVariationSelected }: VariationsPanelProps) {
  const expectsVariations = productType?.toUpperCase() === 'VARIABLE';
  const { data, loading } = useQuery(GET_PRODUCT_VARIATIONS, {
    variables: { id: productId },
    skip: !productId || !expectsVariations,
  });

  const variations = useMemo(() => data?.variableProduct?.variations?.nodes ?? [], [data]);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    setActiveId(null);
  }, [productId]);

  const handleSelect = (variation: any) => {
    const nextId = variation.databaseId;

    if (activeId === nextId) {
      setActiveId(null);
      onVariationSelected?.(null);
      return;
    }

    setActiveId(nextId);
    onVariationSelected?.({
      variationId: nextId,
      image: variation.image?.sourceUrl ?? null,
      priceHtml: variation.price ?? null,
    });
  };

  if (!expectsVariations) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600">
        This drop ships as a single curated product. Add it to cart directly.
      </div>
    );
  }

  if (loading) {
    return <LiquidLoader message="Loading variations…" className="border-dashed" size={140} />;
  }

  if (!variations.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600">
        Variations are not available right now. Ping the concierge team for restock ETA.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {variations.map((variation: any) => (
        <button
          key={variation.databaseId}
          type="button"
          onClick={() => handleSelect(variation)}
          className={`rounded-2xl border p-4 text-left transition hover:-translate-y-1 ${
            activeId === variation.databaseId
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            {variation.image?.sourceUrl ? (
              <Image
                src={variation.image.sourceUrl}
                alt={variation.name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-xl object-contain"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                No img
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">{variation.name}</p>
              {variation.price && (
                <p
                  className={`text-xs ${activeId === variation.databaseId ? 'text-white/80' : 'text-slate-500'}`}
                  dangerouslySetInnerHTML={{ __html: variation.price }}
                />
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
