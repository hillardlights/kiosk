import { useEffect, useState } from "react";
import { config } from "../config";
import { useKiosk } from "../hooks/useKiosk";

const FIRE_WINDOW_SEC = 30;

function formatCooldown(remainingSec: number): string {
  const s = Math.max(0, Math.ceil(remainingSec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export function PropPanel() {
  const { state, actions } = useKiosk();
  const def = config.props.find((p) => p.id === "fobbles");

  const runtime = def ? state.props[def.id] : undefined;
  const [now, setNow] = useState(() => Date.now());

  const cooldownUntil = runtime?.cooldownUntil ?? null;
  const cooling = cooldownUntil !== null && cooldownUntil > now;
  const remainingSec = cooling ? Math.max(0, (cooldownUntil - now) / 1000) : 0;
  const totalCooldown = def?.cooldownSec ?? 300;
  const elapsed = Math.max(0, totalCooldown - remainingSec);
  const firing = cooling && elapsed < FIRE_WINDOW_SEC;
  const errorMsg = runtime?.lastError ?? null;

  useEffect(() => {
    if (!cooling) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [cooling]);

  if (!def) return null;

  // Note: we deliberately don't gate on `state.fppConnection`. The status
  // poll can go stale from a transient blip even when the preset endpoint
  // is reachable; the ConnectionStatus badge already surfaces controller
  // health. Let the user tap — a real failure flips us into the error
  // stage below with the server's message.
  const disabled = cooling;
  const stage: "error" | "firing" | "recharging" | "ready" = errorMsg
    ? "error"
    : firing
      ? "firing"
      : cooling
        ? "recharging"
        : "ready";

  const stageClass =
    stage === "error"
      ? "is-error"
      : stage === "firing"
        ? "is-firing"
        : stage === "recharging"
          ? "is-recharging"
          : "is-ready";

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <header className="rounded-3xl border border-cool-500/20 bg-black/40 px-6 py-5 text-center">
        <div className="flex items-center justify-center gap-4">
          <CauldronGlyph firing={firing} />
          <div className="text-left">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.5em] text-cool-200/85">
              Audience Effects
            </p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.06em] text-white">
              Stir the cauldron
            </h2>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
        <div className="relative w-full max-w-2xl">
          <button
            type="button"
            onClick={() => void actions.triggerProp(def.id)}
            disabled={disabled}
            className={
              "fobbles-button relative flex w-full flex-col items-center justify-center " +
              "gap-4 overflow-hidden rounded-[2.25rem] px-8 py-10 text-neutral-100 " +
              "transition active:scale-[0.98] " +
              stageClass
            }
          >
            {stage === "ready" ? (
              <span aria-hidden className="pointer-events-none absolute inset-0 z-0">
                <span className="fobbles-bubble" />
                <span className="fobbles-bubble" />
                <span className="fobbles-bubble" />
                <span className="fobbles-bubble" />
                <span className="fobbles-bubble" />
              </span>
            ) : null}

            <span
              className={
                "relative z-10 text-[8rem] leading-none " +
                (stage === "recharging"
                  ? "opacity-50"
                  : stage === "firing"
                    ? "drop-shadow-[0_0_32px_rgb(var(--accent-rgb)_/_0.75)]"
                    : "drop-shadow-[0_0_28px_rgb(var(--cool-rgb)_/_0.7)]")
              }
              aria-hidden
            >
              {stage === "firing" ? "💨" : "🫧"}
            </span>

            {stage === "error" ? (
              <>
                <span className="relative z-10 text-3xl font-black uppercase tracking-[0.08em] text-rose-100">
                  Something misfired
                </span>
                <span className="relative z-10 text-sm font-semibold uppercase tracking-widest text-rose-200">
                  {errorMsg}
                </span>
              </>
            ) : stage === "firing" ? (
              <>
                <span className="relative z-10 text-4xl font-black uppercase tracking-[0.08em] text-white">
                  Bubbles aloft
                </span>
                <span className="relative z-10 text-base text-accent-100/90">
                  The brew is bubbling — enjoy the swarm.
                </span>
                <span className="relative z-10 mt-2 font-mono text-5xl font-bold tabular-nums text-accent-100 drop-shadow-[0_0_18px_rgb(var(--accent-rgb)_/_0.7)]">
                  {formatCooldown(Math.max(0, FIRE_WINDOW_SEC - elapsed))}
                </span>
              </>
            ) : stage === "recharging" ? (
              <>
                <span className="relative z-10 text-3xl font-black uppercase tracking-[0.08em] text-neutral-200">
                  Recharging spooky ghost fluid
                </span>
                <span className="relative z-10 text-sm text-neutral-400">
                  Brewing fresh fog potion — stand by.
                </span>
                <span className="relative z-10 mt-2 font-mono text-6xl font-bold tabular-nums text-cool-200 drop-shadow-[0_0_16px_rgb(var(--cool-rgb)_/_0.5)]">
                  {formatCooldown(remainingSec)}
                </span>
              </>
            ) : (
              <>
                <span className="relative z-10 text-5xl font-black uppercase tracking-[0.08em] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)]">
                  Fobbles
                </span>
                <span className="relative z-10 text-base text-cool-100/85">
                  Smoke-filled bubbles, straight from the cauldron.
                </span>
                <span className="relative z-10 mt-2 rounded-full border border-cool-300/50 bg-cool-500/20 px-6 py-3 text-sm font-black uppercase tracking-[0.3em] text-cool-100 shadow-[0_0_24px_rgb(var(--cool-rgb)_/_0.6)]">
                  🫧 Unleash the brew
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InfoCard
          icon="⏱️"
          eyebrow="30 seconds of magic"
          title="One tap, one swarm"
          body="The cauldron erupts for a half-minute of smoke-stuffed bubbles — overlaid on whatever song is playing, no show disruption."
          tone="cool"
        />
        <InfoCard
          icon="🧪"
          eyebrow="Then it rests"
          title="5 minute recharge"
          body="After launch, the ghost fluid needs to re-steep. Give the cauldron a breather — it'll be ready before you know it."
          tone="accent"
        />
      </div>
    </div>
  );
}

function CauldronGlyph({ firing }: { firing: boolean }) {
  return (
    <div
      aria-hidden
      className={
        "relative flex h-16 w-16 items-center justify-center rounded-2xl border " +
        (firing
          ? "border-accent-400/60 bg-accent-500/20 shadow-[0_0_24px_rgb(var(--accent-rgb)_/_0.55)]"
          : "border-cool-400/50 bg-cool-500/15 shadow-[0_0_20px_rgb(var(--cool-rgb)_/_0.45)]")
      }
    >
      <span className="text-3xl leading-none">{firing ? "💨" : "🧪"}</span>
    </div>
  );
}

function InfoCard({
  icon,
  eyebrow,
  title,
  body,
  tone,
}: {
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
  tone: "cool" | "accent";
}) {
  const cls =
    tone === "accent"
      ? "border-accent-500/25 bg-accent-950/25 text-accent-300/85"
      : "border-cool-500/25 bg-cool-950/25 text-cool-300/85";
  return (
    <div className={"rounded-3xl border px-5 py-4 " + cls}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em]">
            {eyebrow}
          </p>
          <p className="mt-1 text-xl font-black uppercase tracking-[0.05em] text-white">
            {title}
          </p>
          <p className="mt-2 text-sm text-neutral-300">{body}</p>
        </div>
      </div>
    </div>
  );
}
