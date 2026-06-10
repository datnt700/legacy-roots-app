import Link from 'next/link'
import { Search, Bell, ShieldCheck } from 'lucide-react'

function TreeLogo() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-9 w-9 text-gold"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 4c-3 0-5.5 2.4-5.5 5.4 0 1 .3 2 .8 2.8-2.6.3-4.6 2.5-4.6 5.2 0 1.2.4 2.3 1.1 3.2-2.4.6-4.2 2.7-4.2 5.3 0 3 2.5 5.5 5.6 5.5.7 0 1.4-.1 2-.4V44h5.6V31c.6.3 1.3.4 2 .4 3.1 0 5.6-2.5 5.6-5.5 0-2.6-1.8-4.7-4.2-5.3.7-.9 1.1-2 1.1-3.2 0-2.7-2-4.9-4.6-5.2.5-.8.8-1.8.8-2.8C29.5 6.4 27 4 24 4Z"
        fill="currentColor"
        opacity="0.92"
      />
    </svg>
  )
}

export function AppHeader() {
  return (
    <header className="flex items-center justify-between px-5 pt-3">
      <div className="flex items-center gap-2.5">
        <TreeLogo />
        <div className="leading-none">
          <p className="font-serif text-xs tracking-[0.35em] text-gold-muted">
            LEGACY
          </p>
          <p className="font-serif text-xl font-semibold tracking-[0.18em] text-gold">
            ROOTS
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Search"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/40 backdrop-blur-md transition-colors hover:bg-card/70"
        >
          <Search className="h-[18px] w-[18px] text-gold" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/40 backdrop-blur-md transition-colors hover:bg-card/70"
        >
          <Bell className="h-[18px] w-[18px] text-gold" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>
        <Link
          href="/login"
          aria-label="Admin login"
          className="h-11 w-11 overflow-hidden rounded-full border border-gold/40"
        >
          <span className="flex h-full w-full items-center justify-center bg-card/60">
            <ShieldCheck className="h-[18px] w-[18px] text-gold" />
          </span>
        </Link>
      </div>
    </header>
  )
}
