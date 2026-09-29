import { useEffect } from "react";
import { lookupFact } from "../songFacts";
import type { Song } from "../state/types";
import { AlbumArt } from "./AlbumArt";

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export function SongConfirmModal({
  song,
  onConfirm,
  onCancel,
}: {
  song: Song;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const durationLabel = song.durationSec != null ? clock(song.durationSec) : null;
  const fact = lookupFact(song.name, song.displayName);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="song-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-md"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-accent-500/40 bg-gradient-to-b from-neutral-950 to-black text-center shadow-[0_0_60px_rgb(var(--accent-rgb)_/_0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 pt-8 pb-6">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-accent-300/85">
            Queue this song?
          </p>
          <div className="mt-5 flex justify-center">
            <AlbumArt
              imageUrl={song.imageUrl}
              alt={song.displayName}
              size="hero"
              glow
            />
          </div>
          <h2
            id="song-confirm-title"
            className="mt-5 line-clamp-2 text-2xl font-black leading-tight text-white"
          >
            {song.displayName}
          </h2>
          {song.artist ? (
            <p className="mt-1 truncate text-sm text-neutral-400">{song.artist}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[0.7rem] uppercase tracking-widest text-neutral-500">
            {durationLabel ? (
              <span>
                <span className="text-neutral-600">Runtime </span>
                <span className="font-mono text-cool-200">{durationLabel}</span>
              </span>
            ) : null}
            {song.category ? (
              <span>
                <span className="text-neutral-600">Category </span>
                <span className="text-accent-200">{song.category}</span>
              </span>
            ) : null}
          </div>
          {fact ? (
            <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm leading-snug text-neutral-200">
              {fact}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-white/10 bg-black/40 px-6 py-5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-white/15 bg-white/[0.04] py-4 text-sm font-bold uppercase tracking-[0.2em] text-neutral-300 transition hover:bg-white/[0.08] active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="rounded-2xl border border-accent-400/60 bg-gradient-to-b from-accent-500/40 to-accent-500/10 py-4 text-sm font-bold uppercase tracking-[0.2em] text-accent-100 shadow-[0_0_24px_rgb(var(--accent-rgb)_/_0.4)] transition hover:brightness-125 active:scale-[0.98]"
          >
            Add to queue
          </button>
        </div>
      </div>
    </div>
  );
}
