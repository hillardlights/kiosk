import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { config } from "../config";
import { useKiosk } from "../hooks/useKiosk";
import type { Song } from "../state/types";
import { AlbumArt } from "./AlbumArt";
import { CategoryChips } from "./CategoryChips";
import { SongConfirmModal } from "./SongConfirmModal";

type Scope = "all" | "new";

function normalizeTitle(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function SongPicker() {
  const { state, actions } = useKiosk();
  const [scope, setScope] = useState<Scope>("all");
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

  const newSongsSet = useMemo(
    () => new Set(config.newSongs.map(normalizeTitle)),
    [],
  );
  const isNewSong = (song: Song) => newSongsSet.has(normalizeTitle(song.displayName));

  // Log any configured new_songs that don't match a real song, so the
  // admin can catch typos in kiosk.conf without silent drops.
  useEffect(() => {
    if (newSongsSet.size === 0 || state.availableSongs.length === 0) return;
    const available = new Set(state.availableSongs.map((s) => normalizeTitle(s.displayName)));
    const missing = [...newSongsSet].filter((n) => !available.has(n));
    if (missing.length > 0) {
      console.warn("[kiosk] new_songs entries with no matching song:", missing);
    }
  }, [newSongsSet, state.availableSongs]);

  const scopedSongs = useMemo(() => {
    return scope === "new" ? state.availableSongs.filter(isNewSong) : state.availableSongs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.availableSongs, scope, newSongsSet]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of scopedSongs) {
      if (s.category && s.category.trim().length > 0) set.add(s.category);
    }
    return Array.from(set).sort();
  }, [scopedSongs]);

  // If the active category vanished when the scope changed, reset it.
  useEffect(() => {
    if (category && !categories.includes(category)) setCategory(null);
  }, [categories, category]);

  const visibleSongs = useMemo(() => {
    if (!category) return scopedSongs;
    return scopedSongs.filter((s) => s.category === category);
  }, [scopedSongs, category]);

  // Stable refs so onSelect stays reference-stable for React.memo on
  // SongCard — without this, every state tick would create a new function
  // per card and defeat memoization.
  const gateRef = useRef({ globalBlock, queueFull, kioskLocked });
  gateRef.current = { globalBlock, queueFull, kioskLocked };
  const songsRef = useRef(state.availableSongs);
  songsRef.current = state.availableSongs;

  const [pendingSong, setPendingSong] = useState<Song | null>(null);

  const onSelect = useCallback((songName: string) => {
    const g = gateRef.current;
    if (g.globalBlock || g.queueFull || g.kioskLocked) return;
    const song = songsRef.current.find((s) => s.name === songName);
    if (song) setPendingSong(song);
  }, []);

  // Auto-close the confirmation if the pending song's state changes such
  // that queueing no longer makes sense (started playing, someone else
  // queued it, queue filled up, etc.).
  useEffect(() => {
    if (!pendingSong) return;
    const stillPickable =
      !globalBlock &&
      !queueFull &&
      !kioskLocked &&
      pendingSong.name !== currentSongName &&
      !queuedSongNames.has(pendingSong.name);
    if (!stillPickable) setPendingSong(null);
  }, [pendingSong, globalBlock, queueFull, kioskLocked, currentSongName, queuedSongNames]);

  const hasNewSongs = newSongsSet.size > 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
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

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-neutral-400">
          Pick a song
        </p>
        <p className="text-xs font-mono text-neutral-500">
          {visibleSongs.length} of {state.availableSongs.length}
        </p>
      </div>

      {hasNewSongs ? (
        <ScopeToggle
          scope={scope}
          onSelect={(s) => {
            setScope(s);
            setCategory(null);
          }}
          seasonYear={config.brand.seasonYear}
        />
      ) : null}

      <CategoryChips categories={categories} active={category} onSelect={setCategory} />

      <div className="song-scroll min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
        {visibleSongs.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center text-neutral-400">
            {state.availableSongs.length === 0
              ? "No songs loaded from the show yet."
              : scope === "new"
                ? "No new songs match this filter yet."
                : "No songs in this category."}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibleSongs.map((song) => {
              const matchesFeedback = feedback && feedback.songName === song.name;
              return (
                <SongCard
                  key={song.name}
                  song={song}
                  isCurrent={song.name === currentSongName}
                  isQueued={queuedSongNames.has(song.name)}
                  isKioskQueued={kioskQueuedSet.has(song.name)}
                  showNewBadge={hasNewSongs && scope === "all" && isNewSong(song)}
                  feedbackKind={matchesFeedback ? feedback.kind : null}
                  feedbackMessage={
                    matchesFeedback && feedback.kind === "error"
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
                  onSelect={onSelect}
                />
              );
            })}
          </ul>
        )}
      </div>

      {pendingSong ? (
        <SongConfirmModal
          song={pendingSong}
          onConfirm={() => {
            const name = pendingSong.name;
            setPendingSong(null);
            void actions.queueSong(name);
          }}
          onCancel={() => setPendingSong(null)}
        />
      ) : null}
    </div>
  );
}

function ScopeToggle({
  scope,
  onSelect,
  seasonYear,
}: {
  scope: Scope;
  onSelect: (s: Scope) => void;
  seasonYear: number;
}) {
  return (
    <div
      role="tablist"
      aria-label="Song scope"
      className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/45 p-1.5 backdrop-blur-sm"
    >
      <ScopePill
        active={scope === "all"}
        label="All songs"
        sublabel="Everything on the show"
        onClick={() => onSelect("all")}
      />
      <ScopePill
        active={scope === "new"}
        label={`New for ${seasonYear}`}
        sublabel="Just this season's additions"
        icon="★"
        onClick={() => onSelect("new")}
      />
    </div>
  );
}

function ScopePill({
  active,
  label,
  sublabel,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  sublabel: string;
  icon?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-3 transition active:scale-[0.98] " +
        (active
          ? "bg-gradient-to-b from-accent-500/30 to-accent-500/10 text-accent-100 shadow-[0_0_16px_rgb(var(--accent-rgb)_/_0.32)]"
          : "text-neutral-400 hover:text-neutral-200")
      }
    >
      <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em]">
        {icon ? <span aria-hidden>{icon}</span> : null}
        {label}
      </span>
      <span className="text-[0.6rem] uppercase tracking-[0.28em] text-neutral-500">
        {sublabel}
      </span>
    </button>
  );
}

type SongCardProps = {
  song: Song;
  isCurrent: boolean;
  isQueued: boolean;
  isKioskQueued: boolean;
  showNewBadge: boolean;
  feedbackKind: "queued" | "error" | null;
  feedbackMessage: string | null;
  disabled: boolean;
  onSelect: (name: string) => void;
};

const SongCard = memo(function SongCard({
  song,
  isCurrent,
  isQueued,
  isKioskQueued,
  showNewBadge,
  feedbackKind,
  feedbackMessage,
  disabled,
  onSelect,
}: SongCardProps) {
  const cls = isCurrent
    ? "border-accent-500/50 bg-accent-500/15"
    : feedbackKind === "queued"
      ? "border-emerald-400/60 bg-emerald-500/15"
      : feedbackKind === "error"
        ? "border-rose-400/60 bg-rose-500/15"
        : isKioskQueued
          ? "border-emerald-400/40 bg-emerald-500/10"
          : isQueued
            ? "border-cool-400/40 bg-cool-500/10"
            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]";

  const statusLabel = isCurrent
    ? { text: "Playing", tone: "text-accent-300" }
    : feedbackKind === "queued"
      ? { text: "Queued!", tone: "text-emerald-300" }
      : feedbackKind === "error"
        ? { text: "Try again", tone: "text-rose-300" }
        : isKioskQueued
          ? { text: "Your request", tone: "text-emerald-300" }
          : isQueued
            ? { text: "In queue", tone: "text-cool-300" }
            : { text: "Tap to queue", tone: "text-neutral-500" };

  return (
    <li className="song-card">
      <button
        type="button"
        onClick={() => onSelect(song.name)}
        disabled={disabled}
        className={
          "group relative flex w-full flex-col overflow-hidden rounded-2xl border text-left transition-colors " +
          "active:scale-[0.98] disabled:opacity-70 " +
          cls
        }
      >
        {showNewBadge ? (
          <span className="absolute left-2 top-2 z-10 rounded-full border border-accent-400/60 bg-accent-500/25 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.25em] text-accent-100">
            ★ New
          </span>
        ) : null}
        <div className="flex justify-center px-3 pt-4">
          <AlbumArt
            imageUrl={song.imageUrl}
            alt={song.displayName}
            size="hero"
            glow={isCurrent}
          />
        </div>
        <div className="flex min-h-0 flex-col gap-1 px-3 py-3">
          <p className="line-clamp-2 text-sm font-bold leading-tight text-white">
            {song.displayName}
          </p>
          {song.artist ? (
            <p className="truncate text-xs text-neutral-400">{song.artist}</p>
          ) : null}
          {feedbackMessage ? (
            <p className="mt-1 text-xs text-rose-200">{feedbackMessage}</p>
          ) : null}
          <p
            className={
              "mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.25em] " +
              statusLabel.tone
            }
          >
            {statusLabel.text}
          </p>
        </div>
      </button>
    </li>
  );
});

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
