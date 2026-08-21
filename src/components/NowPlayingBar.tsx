import { useKiosk } from "../hooks/useKiosk";

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export function NowPlayingBar() {
  const { state } = useKiosk();
  const np = state.nowPlaying;

  if (!np) {
    return (
      <section className="w-full rounded-3xl border border-white/8 bg-black/45 px-5 py-4 backdrop-blur-md">
        <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-neutral-500">
          Show idle
        </p>
        <p className="mt-1 text-center text-lg font-semibold text-neutral-300">
          Pick a song to get things going
        </p>
      </section>
    );
  }

  const hasDuration = np.durationSec != null && np.durationSec > 0;
  const pct = hasDuration
    ? Math.min(100, (np.elapsedSec / (np.durationSec as number)) * 100)
    : 0;

  return (
    <section className="w-full rounded-3xl border border-accent-500/25 bg-black/50 px-5 py-4 backdrop-blur-md">
      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-accent-300/85">
        Now Playing
      </p>
      <p className="mt-1 truncate text-center text-2xl font-bold text-white">
        {np.song.displayName}
      </p>
      {np.song.artist ? (
        <p className="truncate text-center text-sm text-neutral-400">{np.song.artist}</p>
      ) : null}
      {hasDuration ? (
        <>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-300 shadow-[0_0_12px_rgb(var(--accent-rgb) / 0.6)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-center font-mono text-xs tracking-wider text-neutral-400">
            {clock(np.elapsedSec)} / {clock(np.durationSec as number)}
          </p>
        </>
      ) : null}
    </section>
  );
}
