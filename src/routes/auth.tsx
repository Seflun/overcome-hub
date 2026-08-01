import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Addiblock" },
      { name: "description", content: "Sign in to sync your recovery journey across devices." },
      { property: "og:title", content: "Sign in — Addiblock" },
      { property: "og:description", content: "Sync your streaks, XP, journal and reminders across devices." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/today" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      navigate({ to: "/today" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Couldn't sign in with Google");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/today" });
  };

  return (
    <div className="min-h-dvh bg-background px-5 pt-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="mx-auto max-w-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {mode === "signin" ? "Welcome back" : "Get started"}
        </div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {mode === "signin" ? (
            <>Sign in to <span className="text-aurora">sync</span></>
          ) : (
            <>Save your <span className="text-aurora">progress</span></>
          )}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your streaks, XP, journal and reminders travel with you across devices.
        </p>

        <button
          onClick={google}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-card/70 py-3 text-sm font-semibold disabled:opacity-60"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border/60" /> or <div className="h-px flex-1 bg-border/60" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm outline-none focus:border-primary/60"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm outline-none focus:border-primary/60"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-aurora px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-xs text-muted-foreground"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
