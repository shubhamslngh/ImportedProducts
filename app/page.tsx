import { HeroSection } from '@/components/HeroSection';
import { CategoryExplorer } from '@/components/CategoryExplorer';
import { PageWrapper } from '@/components/PageWrapper';
import { PageSection } from '@/components/PageSection';
import { PostsSpotlight } from '@/components/PostsSpotlight';

export default function HomePage() {
  return (
    <main className="flex flex-col gap-10 py-6">
      <PageWrapper>
        <PageSection>
          <HeroSection />
        </PageSection>
        <PageSection>
          <CategoryExplorer />
        </PageSection>
        <PageSection>
          <PostsSpotlight />
        </PageSection>
      </PageWrapper>
    </main>
  );
}
