import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Compass,
  Trophy,
  ShieldAlert,
  Sparkles,
  Settings,
  BookHeart,
  type LucideIcon,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useStore } from "../lib/store";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const nav: NavItem[] = [
  { to: "/today", label: "Today", icon: Home },
  { to: "/coach", label: "Coach", icon: Sparkles },
  { to: "/sos", label: "SOS", icon: ShieldAlert },
  { to: "/journal", label: "Journal", icon: BookHeart },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/progress", label: "Progress", icon: Trophy },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { userId, authChecked } = useStore();
  const navigate = useNavigate();

  // Route guard: unauthenticated users are sent to the landing page
  useEffect(() => {
    if (authChecked && !userId) navigate({ to: "/" });
  }, [authChecked, userId, navigate]);

  // While the session is still being checked (or the redirect is queued),
  // render a minimal placeholder to avoid flashing gated UI.
  if (!authChecked || !userId) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  const isOnSettings = pathname === "/settings";

  return (
    <div className="min-h-dvh bg-background lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/50 bg-card/40 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <Link to="/today" className="flex items-center gap-2 px-6 pt-6 pb-8">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-aurora shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-black tracking-tight">Addiction Blocker</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Break the loop
            </div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active =
              item.to === "/today"
                ? pathname === "/today"
                : pathname.startsWith(item.to);
            const Icon = item.icon;
            const isSos = item.to === "/sos";
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isSos
                    ? active
                      ? "bg-destructive/15 text-destructive"
                      : "text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                    : active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-6">
          <Link
            to="/settings"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isOnSettings
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile settings button (floating, top-right) */}
        {!isOnSettings && (
          <Link
            to="/settings"
            aria-label="Settings"
            className="fixed right-4 top-4 z-50 rounded-full border border-border/60 bg-card/80 p-2 text-muted-foreground shadow-soft backdrop-blur-xl hover:text-foreground lg:hidden"
          >
            <Settings className="h-4 w-4" />
          </Link>
        )}

        <main className="flex-1 pb-28 lg:pb-12">
          <div className="mx-auto w-full max-w-md lg:max-w-3xl xl:max-w-4xl">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-4 lg:hidden">
          <div className="flex items-center justify-around rounded-full border border-border/60 bg-card/80 px-1.5 py-2 shadow-soft backdrop-blur-xl">
            {nav.map((item) => {
              const active =
                item.to === "/today"
                  ? pathname === "/today"
                  : pathname.startsWith(item.to);
              const Icon = item.icon;
              const isSos = item.to === "/sos";
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[10px] transition ${
                    isSos
                      ? active
                        ? "bg-destructive/20 text-destructive"
                        : "text-destructive/80 hover:text-destructive"
                      : active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
