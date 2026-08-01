import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "../components/app-shell";
import { useStore } from "../lib/store";
import { CATEGORIES, daysBetween } from "../lib/addiction-data";
import { ACHIEVEMENTS, levelFromRp } from "../lib/recovery-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Addiblock" },
      { name: "description", content: "Your recovery score, streaks, achievements and lifetime statistics." },
      { property: "og:title", content: "Profile — Addiblock" },
      { property: "og:description", content: "Recovery score, badges and streak statistics in one place." },
    ],
  }),
  component: ProfilePage,
});

const AVATARS = ["🌱", "🔥", "🛡️", "🦉", "🌊", "⛰️", "🧭", "🌟", "🐺", "☀️"];

function ProfilePage() {
  const { state, userEmail, updateProfile, totalRp } = useStore();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(state.profile.username);
  const [bio, setBio] = useState(state.profile.bio);

  const { level, into, needed, progress } = levelFromRp(totalRp);
  const longest = state.journeys.reduce((m, j) => Math.max(m, daysBetween(j.startedAt)), 0);
  const totalCleanDays = state.journeys.reduce((a, j) => a + daysBetween(j.startedAt), 0);
  const unlocked = new Set(state.unlocked);

  return (
    <AppShell>
      <div className="px-5 pt-6 pb-6">
        <Link to="/today" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <div className="rounded-3xl border border-border/50 bg-card-grad p-5 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/15 text-3xl">
              {state.profile.avatar}
            </div>
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A line about why you're doing this"
                    rows={2}
                    className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {AVATARS.map((a) => (
                      <button
                        key={a}
                        onClick={() => updateProfile({ avatar: a })}
                        className={`h-8 w-8 rounded-lg border text-lg ${
                          state.profile.avatar === a ? "border-primary/60 bg-primary/15" : "border-border/60"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      updateProfile({ username: username.trim(), bio: bio.trim() });
                      setEditing(false);
                      toast.success("Profile saved.");
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-aurora px-3 py-1.5 text-xs font-bold text-primary-foreground"
                  >
                    <Check className="h-3.5 w-3.5" /> Save
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="truncate text-xl font-black">
                      {state.profile.username || userEmail?.split("@")[0] || "You"}
                    </div>
                    <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {state.profile.bio || "No bio yet — tap the pencil to add one."}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Joined {new Date(state.profile.joinedAt).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Recovery score
              </div>
              <div className="text-4xl font-black tracking-tight">{totalRp} <span className="text-base font-bold text-muted-foreground">RP</span></div>
            </div>
            <div className="rounded-2xl bg-primary/15 px-4 py-2 text-center text-primary">
              <div className="text-[10px] font-semibold uppercase tracking-widest">Level</div>
              <div className="text-2xl font-black leading-tight">{level}</div>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/60">
            <div className="h-full rounded-full bg-aurora" style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
          <div className="mt-1.5 text-xs text-muted-foreground">{into} / {needed} RP to level {level + 1}</div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Clean days", value: totalCleanDays },
            { label: "Longest streak", value: longest },
            { label: "Cravings resisted", value: state.cravings.length },
            { label: "Journal entries", value: state.journal.length },
            { label: "Check-ins", value: state.checkins.length },
            { label: "Relapses logged", value: state.relapses.length },
            { label: "Journeys", value: state.journeys.length },
            { label: "Badges", value: state.unlocked.length },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/60 bg-card/70 p-3">
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Current streaks</h2>
          {state.journeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No journeys yet.</p>
          ) : (
            <div className="space-y-2">
              {state.journeys.map((j) => {
                const meta = CATEGORIES.find((c) => c.id === j.category)!;
                return (
                  <div key={j.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3">
                    <span className="text-2xl">{meta.emoji}</span>
                    <div className="flex-1 font-semibold">{meta.name}</div>
                    <div className="text-right">
                      <div className="text-xl font-black leading-none">{daysBetween(j.startedAt)}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">days</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="mb-1 text-lg font-bold">Achievements</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            {state.unlocked.length} of {ACHIEVEMENTS.length} unlocked
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ACHIEVEMENTS.map((a) => {
              const got = unlocked.has(a.id);
              return (
                <div
                  key={a.id}
                  className={`rounded-2xl border p-3 ${
                    got ? "border-primary/40 bg-primary/10" : "border-border/60 bg-card/50 opacity-60"
                  }`}
                >
                  <div className="text-2xl">{got ? a.emoji : "🔒"}</div>
                  <div className="mt-1 text-sm font-bold">{a.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{a.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
