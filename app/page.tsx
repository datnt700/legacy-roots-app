import { AppHeader } from '@/components/app-header'
import { HeroSection } from '@/components/hero-section'
import { FamilyTreeShowcase } from '@/components/family-tree-showcase'
import { FeatureCards } from '@/components/feature-cards'
import { QuoteAndNav } from '@/components/quote-and-nav'

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-40 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/10 blur-[100px]"
      />

      <div className="relative mx-auto w-full max-w-md pb-28 sm:max-w-2xl lg:max-w-5xl">
        <AppHeader />
        <HeroSection />
        <FamilyTreeShowcase />
        <FeatureCards />
        <QuoteAndNav />
      </div>
    </main>
  )
}
