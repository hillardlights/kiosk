import { useKiosk } from "../hooks/useKiosk";
import { AlbumArt } from "./AlbumArt";

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export function NowPlayingCard({ onPickSong }: { onPickSong?: () => void }) {
  const { state } = useKiosk();
  const np = state.nowPlaying;

  if (!np) {
    return (
      <button
        type="button"
        onClick={onPickSong}
        className="w-full rounded-3xl border border-accent-500/35 bg-accent-950/25 px-5 py-6 text-center backdrop-blur-md transition-colors hover:border-accent-400/60 hover:bg-accent-900/35 active:scale-[0.98]"
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-accent-300/80">
          Show idle
        </p>
        <p className="mt-2 text-base font-bold text-accent-100">
          Pick a song to start →
        </p>
      </button>
    );
  }

  const hasDuration = np.durationSec != null && np.durationSec > 0;
  const pct = hasDuration
    ? Math.min(100, (np.elapsedSec / (np.durationSec as number)) * 100)
    : 0;

  return (
    <section className="rounded-3xl border border-accent-500/25 bg-black/50 p-5 backdrop-blur-md">
      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-accent-300/85">
        Now Playing
      </p>
      <div className="mt-4 flex justify-center">
        <AlbumArt
          imageUrl={np.song.imageUrl}
          alt={np.song.displayName}
          size="hero"
          glow
        />
      </div>
      <p className="mt-4 line-clamp-2 text-center text-xl font-bold leading-tight text-white">
        {np.song.displayName}
      </p>
      {np.song.artist ? (
        <p className="mt-1 truncate text-center text-sm text-neutral-400">
          {np.song.artist}
        </p>
      ) : null}
      {hasDuration ? (
        <>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-300 shadow-[0_0_12px_rgb(var(--accent-rgb)_/_0.6)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-center font-mono text-xs tracking-wider text-neutral-400">
            {clock(np.elapsedSec)} / {clock(np.durationSec as number)}
            {" · "}
            <span className="text-accent-200">
              {clock(Math.max(0, (np.durationSec as number) - np.elapsedSec))} left
            </span>
          </p>
        </>
      ) : null}
    </section>
  );
}
