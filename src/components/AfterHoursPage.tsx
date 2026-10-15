import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { config } from "../config";

const ADMIN_TAP_COUNT = 7;
const ADMIN_TAP_WINDOW_MS = 3000;

type SocialKey = keyof typeof config.brand.socials;
const SOCIAL_ORDER: SocialKey[] = ["facebook", "instagram", "youtube", "tiktok"];

type Particle = {
  id: number;
  emoji: string;
  left: number;
  size: number;
  delay: number;
  duration: number;
  sway: number;
};

// Deterministic pseudo-random keeps particles anchored across re-renders so
// the one-per-second clock tick doesn't jitter the ambient layer.
const seeded = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

function buildParticles(emojis: string[], count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: emojis[i % emojis.length]!,
    left: seeded(i + 1) * 100,
    size: 0.9 + seeded(i + 100) * 1.4,
    delay: seeded(i + 200) * 22,
    duration: 16 + seeded(i + 300) * 14,
    sway: 20 + seeded(i + 400) * 60,
  }));
}

export function AfterHoursPage({ onAdminGesture }: { onAdminGesture: () => void }) {
  const { brand } = config;
  const [now, setNow] = useState(() => new Date());
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const onAdminTap = useCallback(() => {
    const t = Date.now();
    tapsRef.current = tapsRef.current.filter((x) => t - x < ADMIN_TAP_WINDOW_MS);
    tapsRef.current.push(t);
    if (tapsRef.current.length >= ADMIN_TAP_COUNT) {
      tapsRef.current = [];
      onAdminGesture();
    }
  }, [onAdminGesture]);

  const nextShow = useMemo(() => computeNextShowStart(now), [now]);
  const countdown = formatCountdown(nextShow.getTime() - now.getTime());
  const currentTime = formatClock(now);
  const nextLabel = describeNextShow(now, nextShow);
  const startLabel = formatMinutes(config.showStartMinutes);
  const endLabel = formatMinutes(config.showEndMinutes);

  const particles = useMemo<Particle[]>(() => {
    return brand.season === "halloween"
      ? buildParticles(["🦇", "✨", "👻"], 14)
      : buildParticles(["❄", "✨"], 18);
  }, [brand.season]);

  return (
    <div className="afterhours-root relative flex h-dvh w-full overflow-hidden text-neutral-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgb(var(--cool-rgb) / 0.45), transparent 55%), " +
            "radial-gradient(ellipse at 80% 90%, rgb(var(--accent-rgb) / 0.5), transparent 60%), " +
            "radial-gradient(circle at 50% 50%, transparent 35%, rgba(0,0,0,0.75)), " +
            "#040406",
        }}
      />
      <div aria-hidden className="fog fog-a" />
      <div aria-hidden className="fog fog-b" />

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="afterhours-particle"
            style={{
              left: `${p.left}%`,
              fontSize: `${p.size}rem`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              ["--sway" as string]: `${p.sway}px`,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* Hidden admin gesture — 7 taps in 3s in the top-left corner. */}
      <button
        type="button"
        onClick={onAdminTap}
        aria-label="Admin"
        className="absolute left-0 top-0 z-10 h-28 w-28 cursor-default bg-transparent"
      />

      <div className="relative z-0 mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-8 py-10 text-center">
        <div className="flex flex-col items-center gap-5">
          <span className="afterhours-emoji text-7xl leading-none" aria-hidden>
            {brand.seasonEmoji}
          </span>
          <h1 className="brand-title text-[clamp(3rem,8vw,6.5rem)] font-black uppercase leading-none tracking-[0.08em]">
            That's a wrap
          </h1>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.5em] text-accent-300/80">
            {brand.name} · {brand.seasonLabel} {brand.seasonYear}
          </p>
          <p className="max-w-xl text-lg font-medium text-neutral-200">
            Thanks for stopping by tonight. The lights are resting until tomorrow.
          </p>
        </div>

        <div className="afterhours-hours-card relative w-full rounded-[2rem] border border-accent-500/40 bg-gradient-to-b from-accent-500/10 via-black/60 to-black/70 px-10 py-9">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.6em] text-accent-300/80">
            Show hours
          </p>
          <p className="afterhours-hours mt-4 bg-gradient-to-b from-accent-200 via-accent-400 to-accent-700 bg-clip-text text-[clamp(2.75rem,9vw,5.25rem)] font-black leading-none tracking-tight text-transparent">
            {startLabel} — {endLabel}
          </p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.4em] text-neutral-300">
            Nightly
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-neutral-500">
              Right now
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-white">{currentTime}</p>
          </div>
          <div className="rounded-3xl border border-cool-500/25 bg-cool-950/30 px-5 py-4 text-left">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-cool-300/80">
              Next show
            </p>
            <p className="mt-1 text-base font-bold text-white">{nextLabel}</p>
            <p className="font-mono text-xs text-neutral-400">in {countdown}</p>
          </div>
        </div>

        <div className="w-full rounded-3xl border border-white/10 bg-black/40 px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-accent-500/40 bg-accent-500/15 px-5 py-1.5 text-[0.7rem] font-black uppercase tracking-[0.4em] text-accent-100">
              Tune in · {brand.fmFrequency}
            </span>
            <span className="rounded-full border border-cool-500/35 bg-cool-500/10 px-5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.35em] text-cool-100">
              {brand.siteUrl.replace(/^https?:\/\//, "")}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-neutral-300">
            {SOCIAL_ORDER.map((key) => {
              const s = brand.socials[key];
              return (
                <span key={key} className="flex items-center gap-2">
                  <span className="text-base leading-none" aria-hidden>
                    {s.emoji}
                  </span>
                  <span className="text-xs tracking-wide text-neutral-200">{s.handle}</span>
                </span>
              );
            })}
          </div>
        </div>

        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-neutral-500">
          {brand.motto}
        </p>
      </div>
    </div>
  );
}

function computeNextShowStart(now: Date): Date {
  const h = Math.floor(config.showStartMinutes / 60);
  const m = config.showStartMinutes % 60;
  const todayStart = new Date(now);
  todayStart.setHours(h, m, 0, 0);
  if (todayStart.getTime() > now.getTime()) return todayStart;
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

function formatClock(d: Date): string {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function describeNextShow(now: Date, next: Date): string {
  const sameDay = now.toDateString() === next.toDateString();
  const prefix = sameDay ? "Later today" : "Tomorrow";
  const timeStr = next.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${prefix} at ${timeStr}`;
}

function formatMinutes(mins: number): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  const mm = String(m).padStart(2, "0");
  return `${h12}:${mm} ${period}`;
}
