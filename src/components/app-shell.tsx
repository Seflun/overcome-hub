import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, Trophy, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const nav: NavItem[] = [
  { to: "/", label: "Today", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/progress", label: "Progress", icon: Trophy },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex-1 pb-28">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-4">
        <div className="flex items-center justify-around rounded-full border border-border/60 bg-card/80 px-2 py-2 shadow-soft backdrop-blur-xl">
          {nav.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-full px-3 py-2 text-xs transition ${
                  active
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
  );
}
