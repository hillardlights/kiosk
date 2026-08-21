export type ConnectionState = "connecting" | "online" | "offline";

export type AudioState = "off" | "starting" | "active" | "stopping" | "error";

// `name` is the sequence identifier RF/FPP use internally; `displayName` is
// what the visitor sees. When RF omits displayName, callers should fall back
// to name.
export type Song = {
  name: string;
  displayName: string;
  artist: string | null;
  imageUrl: string | null;
  category: string | null;
  active: boolean;
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
};

export type PropRuntime = {
  cooldownUntil: number | null;
  lastError: string | null;
};

export type TabId = "songs" | "props" | "audio";

export type SongFeedback =
  | { kind: "queued"; songName: string; at: number }
  | { kind: "error"; songName: string; message: string; at: number };

export type ShowStatus = {
  showEnabled: boolean;
  showName: string | null;
  mode: string | null;
};

export type KioskState = {
  fppConnection: ConnectionState;
  rfConnection: ConnectionState;
  audio: AudioState;
  audioRemainingSec: number;
  nowPlaying: NowPlaying | null;
  queue: QueueItem[];
  availableSongs: Song[];
  props: Record<string, PropRuntime>;
  showStatus: ShowStatus;
  songFeedback: SongFeedback | null;
};
