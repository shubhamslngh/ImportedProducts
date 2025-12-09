import { CategoryExplorer } from '@/components/CategoryExplorer';
import { PageWrapper } from '@/components/PageWrapper';
import { PageSection } from '@/components/PageSection';

export default function ProductsPage() {
  return (
    <main className="flex flex-col gap-8 py-6">
      <PageWrapper>
        <PageSection>
          <div className="space-y-4 text-center">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Shop the catalog</p>
            <h1 className="text-4xl font-bold">IMPORTED PRODUCTS</h1>
            <p className="text-base text-slate-600">
              Browse the best quality products which are export grade.
            </p>
          </div>
        </PageSection>
        <PageSection>
          <CategoryExplorer />
        </PageSection>
      </PageWrapper>
    </main>
  );
}
