export type ConnectionState = "connecting" | "online" | "offline";

export type AudioState = "off" | "starting" | "active" | "stopping" | "error";

export type ViewerControlMode = "JUKEBOX" | "VOTING";

export type Song = {
  name: string;
  displayName: string;
  artist: string | null;
  imageUrl: string | null;
  category: string | null;
  active: boolean;
  durationSec: number | null;
};

export type QueueItem = {
  position: number;
  song: Song;
};

export type NowPlaying = {
  song: Song;
  elapsedSec: number;
  durationSec: number | null;
  queuedByKiosk: boolean;
};

export type PropDef = {
  id: string;
  label: string;
  preset: string;
  emoji: string;
  cooldownSec: number;
  // Shown in place of the label while the effect is cooling, e.g.
  // "Boiling more brew" — kept short (<= ~18 chars) so it fits the
  // quarter-size button footprint.
  cooldownMessage: string;
  // Whether this effect stays enabled during the "waiting" ambient
  // sequence (the idle loop RF plays when no requests are queued).
  // Real music sequences always block every effect. Default true;
  // set false for physically-constrained effects like the fog machine
  // that shouldn't fire even during idle time.
  allowDuringWaiting?: boolean;
};

export type PropRuntime = {
  cooldownUntil: number | null;
  lastError: string | null;
};

export type TabId = "songs" | "props" | "audio" | "follow" | "about";

export type SongFeedback =
  | { kind: "queued"; songName: string; at: number }
  | { kind: "error"; songName: string; message: string; at: number };

export type ShowStatus = {
  showEnabled: boolean;
  showName: string | null;
  mode: ViewerControlMode | null;
  jukeboxDepth: number;
  jukeboxRequestLimit: number;
  checkIfRequested: boolean;
  locationCheckMethod: string | null;
};

export type KioskState = {
  fppConnection: ConnectionState;
  rfConnection: ConnectionState;
  audio: AudioState;
  // Absolute ms-since-epoch timestamp when audio auto-off fires.
  // Null when audio is off or transitioning. Persisted to localStorage
  // so the countdown survives browser reloads.
  audioExpiresAt: number | null;
  audioRemainingSec: number;
  // Timestamp of the most recent "refresh" tap while audio was already
  // active. UI watches this to flash a "TIMER RESET · 6:00" toast that
  // auto-clears after ~2s. Null between resets.
  audioResetAt: number | null;
  nowPlaying: NowPlaying | null;
  queue: QueueItem[];
  availableSongs: Song[];
  props: Record<string, PropRuntime>;
  showStatus: ShowStatus;
  songFeedback: SongFeedback | null;
  kioskQueuedSongs: string[];
};
