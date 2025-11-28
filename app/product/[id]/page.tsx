import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProductDetailClient } from '@/components/ProductDetailClient';
import { PageWrapper } from '@/components/PageWrapper';
import { PageSection } from '@/components/PageSection';
import { LiquidLoader } from '@/components/LiquidLoader';

interface ProductPageProps {
  params: { id: string };
}

export default function ProductPage({ params }: ProductPageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    notFound();
  }

  return (
    <main className="flex flex-col gap-8 py-6">
      <PageWrapper>
        <PageSection>
          <Suspense fallback={<LiquidLoader message="Loading product…" />}>
            <ProductDetailClient productId={id} />
          </Suspense>
        </PageSection>
      </PageWrapper>
    </main>
  );
}
