import { Home, Clock, Landmark, Lock } from 'lucide-react'

function QuoteSection() {
  return (
    <section className="px-8 py-8 text-center sm:py-12">
      <p className="font-serif text-lg italic leading-relaxed text-gold sm:text-2xl lg:text-3xl">
        &ldquo;What we preserve today, inspires tomorrow.&rdquo;
      </p>
      <div className="mt-4 flex items-center justify-center gap-3">
        <span className="h-px w-20 bg-gradient-to-r from-transparent to-gold/40" />
        <svg viewBox="0 0 24 24" className="h-3 w-3 text-gold/70" fill="none">
          <path
            d="M12 2 17 12 12 22 7 12Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        <span className="h-px w-20 bg-gradient-to-l from-transparent to-gold/40" />
      </div>
    </section>
  )
}

const navItems = [
  { icon: Home, label: 'Home', active: true },
  { icon: Clock, label: 'Timeline', active: false },
  { icon: Landmark, label: 'Galleries', active: false },
  { icon: Lock, label: 'Vault', active: false },
]

function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-5 pb-5">
      <div className="mx-auto flex max-w-md items-center justify-around rounded-full border border-gold/25 bg-card/80 px-4 py-3 backdrop-blur-xl sm:max-w-md sm:py-3.5">
        {navItems.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            type="button"
            className={`flex flex-col items-center gap-1 ${
              active ? 'text-gold' : 'text-muted-foreground'
            }`}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-[11px] font-medium sm:text-xs">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export function QuoteAndNav() {
  return (
    <>
      <QuoteSection />
      <BottomNav />
    </>
  )
}
