import { useEffect, useState } from "react";
import { config } from "../config";

const SHOW_YEAR = 2026;
const SHOW_MONTH = 9; // 0-indexed → October

// Per-date overrides. Any October date not listed is a normal show night
// (6:30–9:00). Edit as the season evolves — the kiosk restarts nightly
// so a quick push + /ship picks it up.
type Override =
  | { kind: "setup"; note?: string }
  | { kind: "setup-delay"; note?: string }
  | { kind: "closed"; note: string };

const OVERRIDES: Record<number, Override> = {
  1: { kind: "setup" },
  2: { kind: "setup" },
  3: { kind: "setup" },
  4: { kind: "setup" },
  5: { kind: "setup" },
  6: { kind: "setup" },
  7: { kind: "setup" },
  8: { kind: "setup" },
  9: { kind: "setup" },
  10: { kind: "setup" },
  11: { kind: "setup-delay", note: "Weather & fixes" },
  12: { kind: "setup-delay", note: "Weather & fixes" },
  13: { kind: "setup-delay", note: "Weather & fixes" },
  16: { kind: "closed", note: "Weather + FAA" },
  17: { kind: "closed", note: "Weather + FAA" },
};

type DayKind = "setup" | "setup-delay" | "show" | "closed";

type Cell = {
  key: string;
  date: number | null;
  kind: DayKind | null;
  note?: string;
  isToday: boolean;
  isPast: boolean;
};

function buildCells(now: Date): Cell[] {
  const first = new Date(SHOW_YEAR, SHOW_MONTH, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(SHOW_YEAR, SHOW_MONTH + 1, 0).getDate();
  const sameMonth = now.getFullYear() === SHOW_YEAR && now.getMonth() === SHOW_MONTH;
  const todayNum = sameMonth ? now.getDate() : null;
  const monthPast =
    now.getFullYear() > SHOW_YEAR ||
    (now.getFullYear() === SHOW_YEAR && now.getMonth() > SHOW_MONTH);

  const cells: Cell[] = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({ key: `pad-${i}`, date: null, kind: null, isToday: false, isPast: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const override = OVERRIDES[d];
    const kind: DayKind = override ? override.kind : "show";
    const isToday = todayNum === d;
    const isPast = monthPast || (todayNum !== null && d < todayNum);
    const cell: Cell = { key: `d-${d}`, date: d, kind, isToday, isPast };
    if (override?.note) cell.note = override.note;
    cells.push(cell);
  }
  while (cells.length % 7 !== 0) {
    cells.push({ key: `end-${cells.length}`, date: null, kind: null, isToday: false, isPast: false });
  }
  return cells;
}

function formatMinutes(mins: number): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  const mm = String(m).padStart(2, "0");
  return `${h12}:${mm} ${period}`;
}

function formatTimeRange(startMins: number, endMins: number): string {
  const fmt = (mins: number) => {
    const h24 = Math.floor(mins / 60);
    const m = mins % 60;
    const h12 = ((h24 + 11) % 12) + 1;
    return m === 0 ? `${h12}` : `${h12}:${String(m).padStart(2, "0")}`;
  };
  return `${fmt(startMins)}–${fmt(endMins)}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ShowtimesPanel() {
  const { brand } = config;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const cells = buildCells(now);
  const startLabel = formatMinutes(config.showStartMinutes);
  const endLabel = formatMinutes(config.showEndMinutes);
  const showRange = formatTimeRange(config.showStartMinutes, config.showEndMinutes);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="rounded-2xl border border-accent-500/25 bg-black/40 px-4 py-3 text-center">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-accent-300/80">
          Showtimes · {brand.seasonLabel} {brand.seasonYear}
        </p>
        <p className="mt-1 text-sm text-neutral-300">
          Nightly {startLabel} — {endLabel}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black uppercase tracking-[0.08em] text-white">
              October
            </p>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
              {SHOW_YEAR}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-bold uppercase tracking-[0.25em] text-neutral-500">
            {WEEKDAYS.map((w, i) => (
              <div key={`${w}-${i}`} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1.5">
            {cells.map((c) => (
              <CalendarCell key={c.key} cell={c} showRange={showRange} />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[0.7rem]">
            <LegendSwatch tone="setup" label="Setup" />
            <LegendSwatch tone="setup-delay" label="Setup + delays" />
            <LegendSwatch tone="show" label="Show night" />
            <LegendSwatch tone="closed" label="Closed" />
            <LegendSwatch tone="today" label="Tonight" />
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-cool-500/30 bg-cool-950/30 px-5 py-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-cool-300/80">
            Weather closures happen
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-200">
            Rain and wind can shut the show down with little notice. If
            you're planning a trip out, check our socials first — we post
            same-day cancellations there.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.25em]">
            {(["facebook", "instagram"] as const).map((k) => {
              const s = brand.socials[k];
              return (
                <span
                  key={k}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-neutral-200"
                >
                  <span aria-hidden>{s.emoji}</span>
                  <span>{s.handle}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarCell({ cell, showRange }: { cell: Cell; showRange: string }) {
  if (cell.date === null) {
    return <div aria-hidden className="min-h-[88px]" />;
  }

  const base =
    "relative flex min-h-[88px] flex-col justify-between rounded-xl border px-2 py-1.5 transition";
  const dim = cell.isPast && !cell.isToday ? "opacity-60" : "";

  const kind = cell.kind ?? "show";
  const toneByKind: Record<DayKind, string> = {
    setup: "border-white/10 bg-white/[0.03] text-neutral-400",
    "setup-delay":
      "border-cool-500/40 bg-cool-500/10 text-cool-100",
    show:
      "border-accent-500/40 bg-gradient-to-b from-accent-500/15 to-accent-500/[0.03] text-white",
    closed:
      "border-red-500/50 bg-red-950/40 text-red-100",
  };
  const tone = toneByKind[kind];

  const ring = cell.isToday
    ? "ring-2 ring-accent-300 shadow-[0_0_18px_rgb(var(--accent-rgb)_/_0.45)]"
    : "";

  const labelByKind: Record<DayKind, string> = {
    setup: "Setup",
    "setup-delay": "Setup",
    show: showRange,
    closed: "Closed",
  };
  const label = labelByKind[kind];
  const sub = cell.note;

  const labelTone =
    kind === "show"
      ? "text-accent-100 font-mono"
      : kind === "closed"
        ? "text-red-200 line-through decoration-red-300/60"
        : kind === "setup-delay"
          ? "text-cool-100"
          : "text-neutral-300";

  return (
    <div
      className={`${base} ${tone} ${ring} ${dim}`.trim()}
      title={sub ? `Oct ${cell.date} · ${label} · ${sub}` : `Oct ${cell.date} · ${label}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-base font-bold leading-none text-white/90">
          {cell.date}
        </span>
        {cell.isToday && (
          <span
            aria-hidden
            className="rounded-full bg-accent-500 px-1.5 text-[0.5rem] font-black uppercase tracking-widest text-black"
          >
            Now
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-col gap-0.5">
        <span className={`text-[0.7rem] font-bold leading-tight ${labelTone}`}>
          {label}
        </span>
        {sub && (
          <span className="text-[0.55rem] leading-tight uppercase tracking-[0.1em] opacity-80">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function LegendSwatch({ tone, label }: { tone: DayKind | "today"; label: string }) {
  const swatch =
    tone === "setup"
      ? "border-white/10 bg-white/[0.05]"
      : tone === "setup-delay"
        ? "border-cool-500/40 bg-cool-500/15"
        : tone === "show"
          ? "border-accent-500/40 bg-accent-500/20"
          : tone === "closed"
            ? "border-red-500/50 bg-red-900/40"
            : "border-accent-300 bg-accent-500/40 ring-2 ring-accent-300";
  return (
    <div className="flex items-center gap-2 text-neutral-300">
      <span className={`h-4 w-4 rounded-md border ${swatch}`} aria-hidden />
      <span className="font-semibold uppercase tracking-[0.18em] text-[0.6rem]">
        {label}
      </span>
    </div>
  );
}
