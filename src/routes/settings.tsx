import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  Download,
  Bell,
  LineChart,
  ShieldAlert,
  ShieldCheck,
  BookHeart,
  BookOpen,
  ClipboardCheck,
  ArrowLeft,
  LogIn,
  LogOut,
  User,
  Sun,
  Moon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { LANGUAGES } from "../lib/languages";
import { useStore } from "../lib/store";
import { useConfirm } from "../components/confirm-dialog";
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
  const { state, exportAll, userId, userEmail, signOut, syncing, setTheme, updateProfile, deleteAccountData } = useStore();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const download = () => {
    if (!state.isPremium) return;
    const blob = new Blob([exportAll()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `addiblock-export-${new Date().toISOString().slice(0, 10)}.json`;
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
          <Row to="/profile" icon={User} label="Profile & achievements" />
          <Row to="/checkin" icon={ClipboardCheck} label="Daily check-in" />
          <Row to="/cravings" icon={ShieldCheck} label="Craving tracker" />
          <Row to="/journal" icon={BookHeart} label="Journal & mood" />
          <Row to="/library" icon={BookOpen} label="Educational library" />
          <Row to="/analytics" icon={LineChart} label="Progress analytics" />
          <Row to="/insights" icon={LineChart} label="Health & money insights" premium={!state.isPremium} />
          <Row to="/reminders" icon={Bell} label="Reminders" />
          <Row to="/sos" icon={ShieldAlert} label="Craving SOS toolkit" />
        </div>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="flex items-center gap-3">
            {state.theme === "light" ? (
              <Sun className="h-5 w-5 text-primary" />
            ) : (
              <Moon className="h-5 w-5 text-primary" />
            )}
            <div className="flex-1">
              <div className="font-semibold">Appearance</div>
              <div className="text-xs text-muted-foreground">Dark mode is the default.</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 rounded-xl border py-2 text-sm font-semibold capitalize transition ${
                  state.theme === t
                    ? "border-primary/60 bg-primary/15 text-foreground"
                    : "border-border/60 bg-background/40 text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border/60 bg-card/70 p-4">
          <div className="font-semibold">Language</div>
          <div className="text-xs text-muted-foreground">
            The app and the Coach speak this language.
          </div>
          <select
            value={state.profile.language || "en"}
            onChange={(e) => updateProfile({ language: e.target.value })}
            data-no-translate
            className="mt-3 w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
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

        <button
          onClick={async () => {
            const ok = await confirm({
              title: "Delete all my recovery data?",
              description:
                "Journeys, streaks, journal entries, check-ins, cravings and badges will be permanently deleted from this account.",
              confirmLabel: "Delete everything",
              tone: "destructive",
            });
            if (!ok) return;
            await deleteAccountData();
            toast.success("All recovery data deleted.");
            navigate({ to: "/today" });
          }}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-left"
        >
          <Trash2 className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <div className="font-semibold text-destructive">Delete my data</div>
            <div className="text-xs text-muted-foreground">Wipes every journey, log and badge. Can't be undone.</div>
          </div>
        </button>

        <div className="mt-6 mb-4 flex flex-wrap justify-center gap-3 text-[11px] text-muted-foreground">
          <Link to="/privacy" className="underline">Privacy</Link>
          <Link to="/terms" className="underline">Terms</Link>
          <Link to="/refund" className="underline">Refunds</Link>
        </div>

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
