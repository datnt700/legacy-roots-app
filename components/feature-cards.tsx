import { Clock, Landmark, Lock, ChevronRight } from 'lucide-react'

const features = [
  {
    icon: Clock,
    image: '/hallway.png',
    title: 'EXPLORE TIMELINE',
    desc: "Walk through time and discover our family's journey.",
  },
  {
    icon: Landmark,
    image: '/gallery.png',
    title: 'VISIT GALLERIES',
    desc: 'Explore collections of photos, documents, and keepsakes.',
  },
  {
    icon: Lock,
    image: '/vault.png',
    title: 'OPEN VAULT',
    desc: 'Access private and secure family archives.',
  },
]

export function FeatureCards() {
  return (
    <section className="mt-4 grid grid-cols-3 gap-3 px-4 sm:gap-5 sm:px-6 lg:gap-8">
      {features.map(({ icon: Icon, image, title, desc }) => (
        <article
          key={title}
          className="relative overflow-hidden rounded-2xl border border-gold/20 lg:rounded-3xl"
        >
          <img
            src={image || '/placeholder.svg'}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background/95" />
          <div className="relative flex flex-col items-center px-2.5 pb-4 pt-5 text-center sm:px-4 sm:pb-6 sm:pt-8 lg:pb-8 lg:pt-10">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-background/60 backdrop-blur-sm sm:h-14 sm:w-14 lg:h-16 lg:w-16">
              <Icon className="h-5 w-5 text-gold sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
            </span>
            <h3 className="mt-3 font-serif text-[12px] font-semibold tracking-wide text-foreground sm:mt-4 sm:text-base lg:text-lg">
              {title}
            </h3>
            <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground sm:mt-2 sm:text-sm">
              {desc}
            </p>
            <span className="mt-3 flex h-7 w-7 items-center justify-center rounded-full border border-gold/40 sm:mt-4 sm:h-9 sm:w-9">
              <ChevronRight className="h-3.5 w-3.5 text-gold sm:h-4 sm:w-4" />
            </span>
          </div>
        </article>
      ))}
    </section>
  )
}
