function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 py-1">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold/50" />
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-gold" fill="none">
        <path
          d="M12 2 17 12 12 22 7 12Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold/50" />
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="px-6 pt-7 text-center sm:pt-10">
      <h1 className="text-balance font-serif text-[2.6rem] font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
        Welcome to Your Legacy
      </h1>
      <p className="mx-auto mt-2 max-w-xs text-pretty leading-relaxed text-muted-foreground sm:mt-3 sm:max-w-md sm:text-lg">
        Every family has a story.
        <br />
        This is yours.
      </p>
      <div className="mt-4">
        <Divider />
      </div>
    </section>
  )
}
