import { config } from "../config";
import { useKiosk } from "../hooks/useKiosk";
import { AudioButton } from "./AudioButton";

export function AudioPanel() {
  const { state } = useKiosk();
  const isActive = state.audio === "active";
  const { fmFrequency } = config.brand;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <header className="rounded-3xl border border-white/8 bg-black/40 px-6 py-5 text-center">
        <div className="flex items-center justify-center gap-4">
          <SpeakerGlyph active={isActive} />
          <div className="text-left">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.5em] text-accent-300/85">
              Driveway Speakers
            </p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.06em] text-white">
              Hear the show right here
            </h2>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
        <div className="relative w-full max-w-2xl">
          {!isActive && <PulseRings />}
          <AudioButton />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InfoCard
          icon="📻"
          eyebrow="In your car?"
          title={`Tune to ${fmFrequency}`}
          body="Low-power broadcast reaches to the end of the driveway. Windows up, heat on, sing along."
          tone="cool"
        />
        <InfoCard
          icon="⏱️"
          eyebrow="Auto shut-off"
          title="6 minutes per tap"
          body="Speakers turn themselves off so the neighbors don't file a petition. Tap again to keep them on."
          tone="accent"
        />
      </div>
    </div>
  );
}

function SpeakerGlyph({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={
        "relative flex h-16 w-16 items-center justify-center rounded-2xl border " +
        (active
          ? "border-accent-400/50 bg-accent-500/15 shadow-[0_0_24px_rgb(var(--accent-rgb)_/_0.5)]"
          : "border-cool-400/40 bg-cool-500/10 shadow-[0_0_18px_rgb(var(--cool-rgb)_/_0.35)]")
      }
    >
      <span className="text-3xl leading-none">{active ? "🔊" : "🔈"}</span>
      {active ? <WaveBars /> : null}
    </div>
  );
}

function WaveBars() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-2 -top-1 flex h-6 items-end gap-[3px]"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="wave-bar block w-[3px] rounded-full bg-accent-300"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

function PulseRings() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <span className="pulse-ring pulse-ring-a" />
      <span className="pulse-ring pulse-ring-b" />
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
