import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, Download, Bell, LineChart, ShieldAlert, BookHeart, ArrowLeft, LogIn, LogOut, User } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { useStore } from "../lib/store";
import { PremiumBadge } from "../components/premium-badge";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Addiblock" },
      { name: "description", content: "Manage your account, plan, reminders, insights and data export." },
      { property: "og:title", content: "Settings — Addiblock" },
      { property: "og:description", content: "Manage your account and data." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { state, exportAll, userId, userEmail, signOut, syncing } = useStore();
  const navigate = useNavigate();

  const download = () => {
    if (!state.isPremium) return;
    const blob = new Blob([exportAll()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reclaim-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported.");
  };

  return (
    <AppShell>
      <div className="px-5 pt-6">
        <Link to="/today" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <h1 className="text-3xl font-black tracking-tight">Settings</h1>

        <div className="mt-5 rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                {userId ? userEmail ?? "Signed in" : "Not signed in"}
              </div>
              <div className="text-xs text-muted-foreground">
                {userId
                  ? syncing ? "Syncing…" : "Progress syncs across devices"
                  : "Sign in to sync across devices"}
              </div>
            </div>
            {userId ? (
              <button
                onClick={async () => {
                  await signOut();
                  toast("Signed out");
                }}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-semibold"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            ) : (
              <button
                onClick={() => navigate({ to: "/auth" })}
                className="inline-flex items-center gap-1 rounded-full bg-aurora px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign in
              </button>
            )}
          </div>
        </div>


        <div className="mt-5 rounded-3xl border border-primary/40 bg-card-grad p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Addiblock+</div>
          </div>
          <div className="mt-1 text-lg font-bold">
            {state.isPremium ? "Active — thanks for supporting the work." : "Unlock the full toolkit."}
          </div>
          <Link
            to="/plus"
            className="mt-3 inline-flex rounded-full bg-aurora px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow"
          >
            {state.isPremium ? "Manage plan" : "See plans"}
          </Link>
        </div>

        <div className="mt-6 space-y-2">
          <Row to="/journal" icon={BookHeart} label="Journal & mood" />
          <Row to="/insights" icon={LineChart} label="Health & money insights" premium={!state.isPremium} />
          <Row to="/reminders" icon={Bell} label="Reminders" />
          <Row to="/sos" icon={ShieldAlert} label="Craving SOS toolkit" />
        </div>

        <button
          onClick={download}
          disabled={!state.isPremium}
          className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 text-left disabled:opacity-60"
        >
          <Download className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="flex items-center gap-2 font-semibold">
              Export my data <span className="text-xs text-muted-foreground">(JSON)</span>
              {!state.isPremium && <PremiumBadge />}
            </div>
            <div className="text-xs text-muted-foreground">For your therapist, doctor, or you.</div>
          </div>
        </button>

      </div>
    </AppShell>
  );
}

function Row({ to, icon: Icon, label, premium }: { to: string; icon: any; label: string; premium?: boolean }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-4"
    >
      <Icon className="h-5 w-5 text-primary" />
      <div className="flex flex-1 items-center gap-2 font-semibold">
        {label}
        {premium && <PremiumBadge />}
      </div>
      <span className="text-muted-foreground">›</span>
    </Link>
  );
}
