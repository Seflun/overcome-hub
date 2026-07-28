import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { AppShell } from "../components/app-shell";

export const Route = createFileRoute("/checkout/success")({
  head: () => ({
    meta: [
      { title: "Welcome to Addiction Blocker+" },
      { name: "description", content: "Your Addiction Blocker+ subscription is active." },
      { property: "og:title", content: "Welcome to Addiction Blocker+" },
      { property: "og:description", content: "Your Addiction Blocker+ subscription is active." },
    ],
  }),
  component: Success,
});

function Success() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/today" }), 4000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-aurora text-primary-foreground shadow-glow">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight">You're in.</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Addiction Blocker+ is active. Your subscription unlocks unlimited journeys, unlimited AI Coach, and the full toolkit.
        </p>
        <button
          onClick={() => navigate({ to: "/today" })}
          className="mt-6 rounded-full bg-aurora px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow"
        >
          Go to Today
        </button>
      </div>
    </AppShell>
  );
}
