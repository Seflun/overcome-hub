import { Link } from "@tanstack/react-router";
import { Sparkles, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "../lib/store";

export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-aurora px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground ${className}`}
    >
      <Sparkles className="h-3 w-3" /> Plus
    </span>
  );
}

/** Wraps children with a paywall overlay if user isn't premium. */
export function PremiumGate({
  children,
  title,
  blurb,
}: {
  children: ReactNode;
  title: string;
  blurb: string;
}) {
  const { state } = useStore();
  if (state.isPremium) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xs rounded-3xl border border-primary/40 bg-card/95 p-5 text-center shadow-glow backdrop-blur-xl">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-aurora text-primary-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="mt-3 font-bold">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{blurb}</p>
          <Link
            to="/plus"
            className="mt-4 inline-flex items-center gap-1 rounded-full bg-aurora px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow"
          >
            <Sparkles className="h-3.5 w-3.5" /> Unlock Reclaim+
          </Link>
        </div>
      </div>
    </div>
  );
}
