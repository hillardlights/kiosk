import { config } from "../config";

export function AttractOverlay({ onDismiss }: { onDismiss: () => void }) {
  const { brand } = config;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onDismiss}
      className="absolute inset-0 z-40 flex flex-col overflow-hidden rounded-3xl text-neutral-100 attract-fade"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgb(var(--cool-rgb) / 0.4), transparent 55%), " +
            "radial-gradient(ellipse at 80% 90%, rgb(var(--accent-rgb) / 0.45), transparent 60%), " +
            "#050505",
        }}
      />
      <div className="fog fog-a" />
      <div className="fog fog-b" />

      <div className="relative flex h-full flex-col items-center justify-center px-8 py-10">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex items-baseline justify-center gap-4">
            <span className="text-5xl" aria-hidden>
              {brand.seasonEmoji}
            </span>
            <h1 className="brand-title text-[clamp(3rem,11vw,7rem)] font-black uppercase leading-none tracking-[0.08em]">
              {brand.name}
            </h1>
            <span className="text-5xl" aria-hidden>
              {brand.seasonEmoji}
            </span>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.5em] text-accent-300/80">
            {brand.seasonLabel} {brand.seasonYear}
          </p>
          <p className="mt-4 max-w-2xl text-2xl font-medium text-neutral-200">
            {brand.motto}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2">
        <div className="attract-pulse rounded-full border border-accent-400/50 bg-accent-500/10 px-10 py-4">
          <p className="text-sm font-bold uppercase tracking-[0.5em] text-accent-100">
            Tap anywhere to start
          </p>
        </div>
      </div>
    </div>
  );
}
