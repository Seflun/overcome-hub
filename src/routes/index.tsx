import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  Sparkles,
  Flame,
  Target,
  Bot,
  Compass,
  ShieldCheck,
  Quote,
  Check,
} from "lucide-react";

import { LOGO_URL as logo } from "@/lib/brand";
import { useStore } from "../lib/store";
import { CATEGORIES } from "../lib/addiction-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Addiblock — Break the loop, rebuild yourself" },
      {
        name: "description",
        content:
          "A calm, structured recovery companion. Pick an addiction, follow a daily plan, and rebuild the version of you that's underneath. Free to start.",
      },
      { property: "og:title", content: "Addiblock — Break the loop, rebuild yourself" },
      {
        property: "og:description",
        content:
          "Daily missions, streaks, XP and an AI Coach to help you quit nicotine, alcohol, gambling, drugs, porn, sugar, video games and social media.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { userId, authChecked } = useStore();
  const navigate = useNavigate();

  // If already signed in, land straight in the app
  useEffect(() => {
    if (authChecked && userId) navigate({ to: "/today" });
  }, [authChecked, userId, navigate]);

  return (
    <div className="min-h-dvh bg-background">
      <TopNav />
      <Hero />
      <Method />
      <Categories />
      <Testimonials />
      <FinalCta />
      <Footer />
    </div>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Addiblock logo" className="h-8 w-8 rounded-xl object-contain" />
          <span className="font-black tracking-tight">Addiblock</span>
        </Link>

        <nav className="flex items-center gap-2">
          <SoundControls className="mr-1" />
          <Link
            to="/auth"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-0 h-[36rem] w-[36rem] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-aurora, radial-gradient(closest-side, hsl(var(--primary)/0.5), transparent))" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-40 h-[32rem] w-[32rem] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gradient-aurora, radial-gradient(closest-side, hsl(var(--primary)/0.4), transparent))" }}
      />

      <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-20 text-center md:px-8 md:pt-24 md:pb-28">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Flame className="h-3 w-3 text-primary" /> A calmer way to quit
        </div>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
          Break the loop.
          <br />
          Rebuild the <span className="text-aurora">you</span> underneath.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          A structured recovery companion for the addictions that shape your day.
          Pick one to work on, follow a small daily plan, and stack real wins —
          without the shame, the lectures, or the toxic positivity.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-aurora px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-6 py-3 text-sm font-semibold text-foreground hover:border-primary/40"
          >
            I already have an account
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> Free to start</span>
          <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-primary" /> No credit card</span>
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary" /> Private & synced</span>
        </div>
      </div>
    </section>
  );
}

const METHOD = [
  {
    icon: Target,
    title: "1. Pick your addiction",
    body: "Choose one thing to work on first — nicotine, alcohol, porn, drugs, sugar, gambling, video games, or social media. You can add more later.",
  },
  {
    icon: Flame,
    title: "2. Do the daily plan",
    body: "Every day, five tiny missions: two targeted at your addiction, three that rebuild the you underneath — sleep, movement, focus, connection.",
  },
  {
    icon: Sparkles,
    title: "3. Stack XP and streaks",
    body: "Every check-in earns XP and a level. Milestones from 24 hours to 1 year get unlocked as your body and brain recover.",
  },
  {
    icon: Bot,
    title: "4. Talk to Coach",
    body: "An AI companion for the hard nights — cravings, slips, or spirals. Not a therapist. Just something between you and the next choice.",
  },
];

function Method() {
  return (
    <section className="border-t border-border/40">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            The method
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            Small daily wins.<br className="hidden md:block" /> Compounded into a new <span className="text-aurora">identity</span>.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            Recovery isn't willpower — it's structure. Addiblock gives you a
            tiny, evidence-informed plan you can follow on your worst day, not just
            your best one.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {METHOD.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="rounded-3xl border border-border/60 bg-card/60 p-6 shadow-soft transition hover:border-primary/40"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {m.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="border-t border-border/40">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            What we help with
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            Eight loops.<br className="hidden md:block" /> One <span className="text-aurora">calm</span> way out.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            Each category has its own daily missions, health recovery timeline,
            and craving toolkit — designed around what actually works for that
            specific loop.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <div
              key={c.id}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 shadow-soft transition hover:border-primary/40"
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-30 blur-2xl transition group-hover:opacity-50"
                style={{ backgroundColor: c.color }}
              />
              <div className="text-3xl">{c.emoji}</div>
              <div className="mt-3 font-bold">{c.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.tagline}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-5 py-2.5 text-sm font-semibold hover:border-primary/40"
          >
            <Compass className="h-4 w-4 text-primary" /> Pick your first journey
          </Link>
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote:
      "The tasks are small enough that I actually do them. Today is day 47 of no vape and it's the first time I've made it past a week in three years.",
    who: "M., 28 · quitting nicotine",
  },
  {
    quote:
      "Talking to Coach at 11pm when the urge hit is the whole reason I didn't drink last Friday. This AI doesn't lecture you, it actually gives real advice.",
    who: "R., 34 · quitting alcohol",
  },
  {
    quote:
      "The daily plan replaced doomscrolling with something that actually feels good. I sleep now.",
    who: "A., 22 · quitting social media",
  },
];

function Testimonials() {
  return (
    <section className="border-t border-border/40">
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            From the people using it
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            You're not the <span className="text-aurora">first</span> to try again.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.who}
              className="flex h-full flex-col rounded-3xl border border-border/60 bg-card/60 p-6 shadow-soft"
            >
              <Quote className="h-6 w-6 text-primary/70" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t.who}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-border/40">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center md:px-8 md:py-28">
        <h2 className="text-4xl font-black tracking-tight md:text-6xl">
          The next choice is the <span className="text-aurora">only</span> one that matters.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm text-muted-foreground md:text-base">
          Create a free account. Start your first journey in under a minute.
          Your progress syncs across every device you sign in on.
        </p>
        <Link
          to="/auth"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-aurora px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          Create my free account <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-xs text-muted-foreground md:px-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Addiblock logo" className="h-5 w-5 object-contain" />

            <span>Addiblock © {new Date().getFullYear()}</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/refund" className="hover:text-foreground">Refunds</Link>
          </nav>
        </div>
        <div className="text-center md:text-left">
          Not a therapist, doctor, or medical service. In a crisis, contact
          local emergency services.
        </div>
      </div>
    </footer>
  );
}
