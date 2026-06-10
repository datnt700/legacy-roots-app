import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Crown, Lock, ShieldCheck } from "lucide-react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Crown className="h-9 w-9 text-gold" />
          <div className="leading-none">
            <p className="font-serif text-xs tracking-[0.35em] text-gold-muted">
              LEGACY
            </p>
            <p className="font-serif text-xl font-semibold tracking-[0.18em] text-gold">
              ROOTS
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>

      <section className="mx-auto grid min-h-[calc(100vh-120px)] w-full max-w-5xl items-center py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="hidden min-h-[560px] overflow-hidden rounded-l-[18px] border border-border bg-card/60 p-10 shadow-[0_26px_80px_rgba(0,0,0,0.26)] lg:block">
          <div className="flex items-center gap-4 text-gold">
            <ShieldCheck className="h-10 w-10" />
            <span className="text-sm font-bold uppercase tracking-[0.18em]">
              Admin Area
            </span>
          </div>

          <h1 className="mt-12 max-w-sm font-serif text-5xl font-bold leading-tight text-foreground">
            Manage your family legacy.
          </h1>
          <p className="mt-7 max-w-sm text-lg leading-8 text-muted-foreground">
            Sign in to edit generations, members, photos, timeline content, and
            private archive information.
          </p>

          <div className="mt-16 rounded-[12px] border border-gold/25 bg-background/50 p-6">
            <p className="font-serif text-2xl text-gold">Admin tools</p>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li>Family tree structure and hierarchy</li>
              <li>Member names, roles, and portraits</li>
              <li>Supabase-backed media and timeline APIs</li>
            </ul>
          </div>
        </aside>

        <section className="mx-auto flex w-full max-w-md items-center justify-center rounded-[18px] border border-border bg-card/80 px-6 py-10 shadow-[0_26px_80px_rgba(0,0,0,0.26)] lg:mx-0 lg:min-h-[560px] lg:rounded-l-none lg:px-12">
          <div className="w-full">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-background text-gold">
              <Lock className="h-10 w-10" />
            </div>
            <h2 className="mt-8 text-center font-serif text-3xl font-bold text-foreground">
              Admin Login
            </h2>

            <Suspense
              fallback={
                <div className="mt-10 rounded-[8px] border border-border bg-background/60 px-5 py-4 text-sm text-muted-foreground">
                  Preparing login form...
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </section>
    </main>
  );
}
