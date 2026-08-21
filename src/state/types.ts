export type ConnectionState = "connecting" | "online" | "offline";

export type AudioState = "off" | "starting" | "active" | "stopping" | "error";

export type Song = {
  id: string;
  title: string;
  artist?: string;
  durationSec: number;
};

export type QueueItem = {
  id: string;
  song: Song;
  queuedAt: number;
};

export type NowPlaying = {
  song: Song;
  elapsedSec: number;
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

export type KioskState = {
  fppConnection: ConnectionState;
  rfConnection: ConnectionState;
  audio: AudioState;
  audioRemainingSec: number;
  nowPlaying: NowPlaying | null;
  queue: QueueItem[];
  availableSongs: Song[];
  props: Record<string, PropRuntime>;
};
