import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Compass,
  Trophy,
  ShieldAlert,
  Sparkles,
  Settings,
  BookHeart,
  BookOpen,
  ClipboardCheck,
  LineChart,
  ShieldCheck,
  User,
  HeartHandshake,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { LOGO_URL as logo } from "@/lib/brand";
import { SoundControls } from "./sound-controls";
import { useStore } from "../lib/store";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const nav: NavItem[] = [
  { to: "/today", label: "Today", icon: Home },
  { to: "/checkin", label: "Check-in", icon: ClipboardCheck },
  { to: "/coach", label: "Coach", icon: Sparkles },
  { to: "/sos", label: "SOS", icon: ShieldAlert },
  { to: "/cravings", label: "Cravings", icon: ShieldCheck },
  { to: "/journal", label: "Journal", icon: BookHeart },
  { to: "/library", label: "Library", icon: BookOpen },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/progress", label: "Progress", icon: Trophy },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/plus", label: "Plus Demo", icon: Sparkles },
  { to: "/fun-fact", label: "Fun fact", icon: HeartHandshake },
];

const mobileNav: NavItem[] = [
  { to: "/today", label: "Home", icon: Home },
  { to: "/coach", label: "Coach", icon: Sparkles },
  { to: "/sos", label: "SOS", icon: ShieldAlert },
  { to: "/progress", label: "Progress", icon: Trophy },
  { to: "/profile", label: "Profile", icon: User },
];

const moreNav: NavItem[] = nav.filter(
  (n) => !mobileNav.find((m) => m.to === n.to) && n.to !== "/settings",
);

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const isSos = item.to === "/sos";
  const isCoach = item.to === "/coach";
  return (
    <Link
      key={item.to}
      to={item.to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        isSos
          ? active
            ? "bg-destructive/15 text-destructive"
            : "text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
          : isCoach
            ? active
              ? "bg-accent text-accent-foreground shadow-glow"
              : "bg-accent/20 text-accent ring-1 ring-accent/40 hover:bg-accent/30"
            : active
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={active || isCoach ? 2.4 : 1.8} />
      {item.label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { userId, authChecked, state } = useStore();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  // Route guard: unauthenticated users are sent to the landing page
  useEffect(() => {
    if (authChecked && !userId) navigate({ to: "/" });
  }, [authChecked, userId, navigate]);

  // Close the mobile drawer on route changes
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // While the session is still being checked (or the redirect is queued),
  // render a minimal placeholder to avoid flashing gated UI.
  if (!authChecked || !userId) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const isOnSettings = pathname === "/settings";

  return (
    <div className="min-h-dvh bg-background lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/50 bg-card/40 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <Link to="/today" className="flex items-center gap-2 px-6 pt-6 pb-8">
          <img src={logo} alt="Addiblock logo" className="h-9 w-9 rounded-xl object-contain" />

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-black tracking-tight">Addiblock</span>
              {state.isPremium && (
                <span className="rounded-full border border-primary/40 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-widest text-primary/90">
                  Plus
                </span>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Break the loop
            </div>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active =
              item.to === "/today" ? pathname === "/today" : pathname.startsWith(item.to);
            return <NavLink key={item.to} item={item} active={active} />;
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
        {/* Mobile top bar: keeps sound + settings off the main content surface */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background/70 px-4 py-2 backdrop-blur-xl lg:hidden">
          <Link to="/today" className="flex min-w-0 items-center gap-2">
            <img
              src={logo}
              alt="Addiblock logo"
              className="h-7 w-7 shrink-0 rounded-xl object-contain"
            />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-black tracking-tight">Addiblock</span>
                {state.isPremium && (
                  <span className="rounded-full border border-primary/40 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-widest text-primary/90">
                    Plus
                  </span>
                )}
              </div>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <SoundControls compact />
            {!isOnSettings && (
              <Link
                to="/settings"
                aria-label="Settings"
                className="rounded-full border border-border/60 bg-card/80 p-2 text-muted-foreground shadow-soft backdrop-blur-xl hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Link>
            )}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
              className="rounded-full border border-border/60 bg-card/80 p-2 text-muted-foreground shadow-soft backdrop-blur-xl hover:text-foreground"
            >
              {moreOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Floating sound controls (desktop only) */}
        <div className="fixed right-4 top-4 z-50 hidden items-center gap-2 lg:flex">
          <SoundControls />
        </div>

        <main className="flex-1 pb-28 lg:pb-12">
          <div className="mx-auto w-full max-w-md lg:max-w-3xl xl:max-w-4xl">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-4 lg:hidden">
          <div className="flex items-center justify-around rounded-full border border-border/60 bg-card/80 px-1.5 py-2 shadow-soft backdrop-blur-xl">
            {mobileNav.map((item) => {
              const active =
                item.to === "/today" ? pathname === "/today" : pathname.startsWith(item.to);
              const Icon = item.icon;
              const isSos = item.to === "/sos";
              const isCoach = item.to === "/coach";
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[10px] transition ${
                    isSos
                      ? active
                        ? "bg-destructive/20 text-destructive"
                        : "text-destructive/80 hover:text-destructive"
                      : isCoach
                        ? active
                          ? "bg-accent text-accent-foreground shadow-glow"
                          : "bg-accent/20 text-accent ring-1 ring-accent/40"
                        : active
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active || isCoach ? 2.4 : 1.8} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile "more" drawer */}
        {moreOpen && (
          <div className="fixed inset-x-0 top-[3.25rem] z-30 lg:hidden">
            <div className="mx-auto max-w-md px-4 pb-4">
              <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-border/60 bg-card/95 p-3 shadow-soft backdrop-blur-xl">
                <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  More
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {moreNav.map((item) => {
                    const active =
                      item.to === "/today" ? pathname === "/today" : pathname.startsWith(item.to);
                    return (
                      <NavLink
                        key={item.to}
                        item={item}
                        active={active}
                        onClick={() => setMoreOpen(false)}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 border-t border-border/40 pt-2">
                  <NavLink
                    item={{ to: "/settings", label: "Settings", icon: Settings }}
                    active={isOnSettings}
                    onClick={() => setMoreOpen(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
