import { useKiosk } from "../hooks/useKiosk";

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export function NowPlaying() {
  const { state } = useKiosk();
  if (state.show !== "playing" || !state.nowPlaying) return null;

  const { title, elapsedSec, durationSec } = state.nowPlaying;
  const pct = durationSec > 0 ? Math.min(100, (elapsedSec / durationSec) * 100) : 0;

  return (
    <section className="w-full rounded-3xl border border-orange-500/25 bg-black/45 px-6 py-5 backdrop-blur-md">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.5em] text-orange-300/80">
        Now Playing
      </p>
      <p className="mt-2 truncate text-center text-2xl font-bold text-white">{title}</p>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-300 shadow-[0_0_16px_rgba(249,115,22,0.6)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-center font-mono text-sm tracking-wider text-neutral-300">
        {formatClock(elapsedSec)} / {formatClock(durationSec)}
      </p>
    </section>
  );
}
