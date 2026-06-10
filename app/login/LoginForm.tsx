"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeOff, Lock, Mail } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const DEFAULT_REDIRECT_PATH = "/admin";

function getSafeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  return value;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get("redirectTo"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getBrowserSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (isMounted && data.session) {
          router.replace(redirectTo);
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage("Supabase login is not configured yet.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [redirectTo, router]);

  async function handleEmailLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setErrorMessage("Please enter an email and password.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await getBrowserSupabase().auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setErrorMessage(error.message || "Login failed.");
      setIsSubmitting(false);
      return;
    }

    if (!rememberMe) {
      window.sessionStorage.setItem("legacy_roots_session_only", "true");
    }

    router.replace(redirectTo);
    router.refresh();
  }

  async function handleGoogleLogin() {
    setErrorMessage("");
    setIsSubmitting(true);

    const { error } = await getBrowserSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`,
      },
    });

    if (error) {
      setErrorMessage(error.message || "Could not sign in with Google.");
      setIsSubmitting(false);
    }
  }

  const isDisabled = isSubmitting || isCheckingSession;

  return (
    <form onSubmit={handleEmailLogin} className="mt-10 space-y-6">
      <label className="block">
        <span className="text-sm font-bold text-foreground">Email</span>
        <span className="mt-2 flex h-14 items-center gap-4 rounded-[8px] border border-border bg-background px-5 text-gold shadow-[0_8px_22px_rgba(0,0,0,0.12)]">
          <Mail className="h-5 w-5 shrink-0" />
          <input
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={isDisabled}
            className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-70"
          />
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-bold text-foreground">Password</span>
        <span className="mt-2 flex h-14 items-center gap-4 rounded-[8px] border border-border bg-background px-5 text-gold shadow-[0_8px_22px_rgba(0,0,0,0.12)]">
          <Lock className="h-5 w-5 shrink-0" />
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={isDisabled}
            className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-70"
          />
          <EyeOff className="h-5 w-5 shrink-0 text-muted-foreground" />
        </span>
      </label>

      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="flex items-center gap-3 text-muted-foreground">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            disabled={isDisabled}
            className="h-5 w-5 rounded border-border accent-[#d4af37]"
          />
          Remember me
        </label>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-[8px] border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200"
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isDisabled}
        className="h-14 w-full rounded-[8px] bg-gold text-lg font-bold text-background shadow-[0_14px_24px_rgba(212,175,55,0.18)] transition-colors hover:bg-gold-muted disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <div className="flex items-center gap-5 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isDisabled}
        className="flex h-14 w-full items-center justify-center gap-4 rounded-[8px] border border-border bg-background text-base font-bold text-foreground transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span className="text-xl font-bold text-[#4285f4]">G</span>
        Sign in with Google
      </button>
    </form>
  );
}
