import { useMemo, useState } from "react";
import { useKiosk } from "../hooks/useKiosk";
import type { Song } from "../state/types";
import { AlbumArt } from "./AlbumArt";
import { CategoryChips } from "./CategoryChips";
import { QueueList } from "./QueueList";

export function SongPicker() {
  const { state, actions } = useKiosk();
  const [category, setCategory] = useState<string | null>(null);

  const queuedSongNames = useMemo(
    () => new Set(state.queue.map((q) => q.song.name)),
    [state.queue],
  );
  const kioskQueuedSet = useMemo(
    () => new Set(state.kioskQueuedSongs),
    [state.kioskQueuedSongs],
  );
  const currentSongName = state.nowPlaying?.song.name;
  const offline = state.rfConnection !== "online";
  const showDisabled = !state.showStatus.showEnabled;
  const votingMode = state.showStatus.mode === "VOTING";
  const queueFull = isQueueFull(state.showStatus.jukeboxDepth, state.queue.length);
  const kioskLocked =
    state.showStatus.checkIfRequested && state.kioskQueuedSongs.length > 0;
  const feedback = state.songFeedback;

  const globalBlock = offline || showDisabled || votingMode;

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of state.availableSongs) {
      if (s.category && s.category.trim().length > 0) set.add(s.category);
    }
    return Array.from(set).sort();
  }, [state.availableSongs]);

  const visibleSongs = useMemo(() => {
    if (!category) return state.availableSongs;
    return state.availableSongs.filter((s) => s.category === category);
  }, [state.availableSongs, category]);

  const onTap = (songName: string) => {
    if (globalBlock || queueFull || kioskLocked) return;
    void actions.queueSong(songName);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <QueueList
        queue={state.queue}
        kioskQueuedSongs={state.kioskQueuedSongs}
        showStatus={state.showStatus}
        nowPlaying={state.nowPlaying}
      />

      {offline ? (
        <Banner
          tone="error"
          label="Song requests offline"
          body="Waiting for the request server to come back. Props and audio still work."
        />
      ) : showDisabled ? (
        <Banner
          tone="warn"
          label="Show is currently off"
          body="Song requests will open when the show turns on."
        />
      ) : votingMode ? (
        <Banner
          tone="warn"
          label="Voting mode active"
          body="Song selection on the kiosk supports jukebox mode only. Use the QR code to vote."
        />
      ) : queueFull ? (
        <Banner
          tone="warn"
          label="Queue is full"
          body={`Wait for a song to finish — up to ${state.showStatus.jukeboxDepth} can be queued at a time.`}
        />
      ) : kioskLocked ? (
        <Banner
          tone="warn"
          label="One request at a time"
          body={`Wait for ${kioskLockedSongName(state.kioskQueuedSongs)} to play before adding another.`}
        />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-neutral-500">
            Pick a song
          </p>
          <p className="text-[0.65rem] font-mono text-neutral-600">
            {visibleSongs.length} of {state.availableSongs.length}
          </p>
        </div>
        <CategoryChips
          categories={categories}
          active={category}
          onSelect={setCategory}
        />

        <div className="min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
          <ul className="grid grid-cols-1 gap-3">
            {visibleSongs.length === 0 ? (
              <li className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 text-center text-neutral-400">
                {state.availableSongs.length === 0
                  ? "No songs loaded from the show yet."
                  : "No songs in this category."}
              </li>
            ) : null}
            {visibleSongs.map((song) => (
              <SongRow
                key={song.name}
                song={song}
                isCurrent={song.name === currentSongName}
                isQueued={queuedSongNames.has(song.name)}
                isKioskQueued={kioskQueuedSet.has(song.name)}
                feedbackKind={
                  feedback && feedback.songName === song.name ? feedback.kind : null
                }
                feedbackMessage={
                  feedback &&
                  feedback.songName === song.name &&
                  feedback.kind === "error"
                    ? feedback.message
                    : null
                }
                disabled={
                  globalBlock ||
                  queueFull ||
                  kioskLocked ||
                  song.name === currentSongName ||
                  queuedSongNames.has(song.name)
                }
                onTap={() => onTap(song.name)}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SongRow({
  song,
  isCurrent,
  isQueued,
  isKioskQueued,
  feedbackKind,
  feedbackMessage,
  disabled,
  onTap,
}: {
  song: Song;
  isCurrent: boolean;
  isQueued: boolean;
  isKioskQueued: boolean;
  feedbackKind: "queued" | "error" | null;
  feedbackMessage: string | null;
  disabled: boolean;
  onTap: () => void;
}) {
  const cls = isCurrent
    ? "border-accent-500/45 bg-accent-500/15"
    : feedbackKind === "queued"
      ? "border-emerald-400/60 bg-emerald-500/15"
      : feedbackKind === "error"
        ? "border-rose-400/60 bg-rose-500/15"
        : isKioskQueued
          ? "border-emerald-400/40 bg-emerald-500/10"
          : isQueued
            ? "border-cool-400/40 bg-cool-500/10"
            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]";
  return (
    <li>
      <button
        type="button"
        onClick={onTap}
        disabled={disabled}
        className={
          "song-row group w-full rounded-2xl border px-4 py-3 text-left transition " +
          "active:scale-[0.99] disabled:opacity-70 " +
          cls
        }
      >
        <div className="flex items-center gap-4">
          <AlbumArt imageUrl={song.imageUrl} alt={song.displayName} size="small" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-white">{song.displayName}</p>
            {song.artist ? (
              <p className="truncate text-sm text-neutral-400">{song.artist}</p>
            ) : null}
            {feedbackMessage ? (
              <p className="mt-1 text-sm text-rose-200">{feedbackMessage}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em]">
              {isCurrent ? (
                <span className="text-accent-300">Playing</span>
              ) : feedbackKind === "queued" ? (
                <span className="text-emerald-300">Queued!</span>
              ) : feedbackKind === "error" ? (
                <span className="text-rose-300">Try again</span>
              ) : isKioskQueued ? (
                <span className="text-emerald-300">Your request</span>
              ) : isQueued ? (
                <span className="text-cool-300">In queue</span>
              ) : (
                <span className="text-neutral-500 group-hover:text-accent-300">
                  Tap to queue
                </span>
              )}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}

function isQueueFull(jukeboxDepth: number, currentLength: number): boolean {
  if (jukeboxDepth <= 0) return false;
  return currentLength >= jukeboxDepth;
}

function kioskLockedSongName(kioskQueued: string[]): string {
  return kioskQueued[0] ?? "your song";
}

function Banner({
  tone,
  label,
  body,
}: {
  tone: "error" | "warn";
  label: string;
  body: string;
}) {
  const cls =
    tone === "error"
      ? "border-rose-500/30 bg-rose-950/40 text-rose-200"
      : "border-amber-500/30 bg-amber-950/30 text-amber-100";
  return (
    <div className={"rounded-3xl border px-5 py-4 text-center " + cls}>
      <p className="text-xs font-semibold uppercase tracking-[0.4em]">{label}</p>
      <p className="mt-1 text-sm opacity-90">{body}</p>
    </div>
  );
}
