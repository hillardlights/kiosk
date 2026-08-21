import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { config } from "../config";
import * as rf from "../services/rf";
import { getOrCreateViewerId } from "../services/viewerId";
import {
  DEMO_INITIAL_NOW_PLAYING_DURATION,
  DEMO_INITIAL_NOW_PLAYING_ELAPSED,
  DEMO_INITIAL_QUEUE,
  DEMO_SONGS,
} from "./demoData";
import type {
  AudioState,
  ConnectionState,
  KioskState,
  NowPlaying,
  PropRuntime,
  QueueItem,
  ShowStatus,
  Song,
  SongFeedback,
  ViewerControlMode,
} from "./types";

type RfSnapshot = {
  availableSongs: Song[];
  queue: QueueItem[];
  nowPlaying: NowPlaying | null;
  showStatus: ShowStatus;
};

type Action =
  | { type: "connection/fpp"; state: ConnectionState }
  | { type: "connection/rf"; state: ConnectionState }
  | { type: "rf/sync"; snapshot: RfSnapshot }
  | { type: "song/queue-optimistic"; item: QueueItem }
  | { type: "song/advance" }
  | { type: "song/tick"; elapsedSec: number }
  | { type: "song/feedback"; feedback: SongFeedback | null }
  | { type: "audio/set"; state: AudioState; remainingSec?: number }
  | { type: "audio/tick"; remainingSec: number }
  | { type: "prop/cooldown"; propId: string; until: number }
  | { type: "prop/ready"; propId: string }
  | { type: "prop/error"; propId: string; message: string };

function buildInitialProps(): Record<string, PropRuntime> {
  const out: Record<string, PropRuntime> = {};
  for (const p of config.props) {
    out[p.id] = { cooldownUntil: null, lastError: null };
  }
  return out;
}

function initialShowStatus(inDemo: boolean): ShowStatus {
  if (inDemo) {
    return {
      showEnabled: true,
      showName: "Hillard Lights (demo)",
      mode: "JUKEBOX",
      jukeboxDepth: 5,
      jukeboxRequestLimit: 2,
      checkIfRequested: false,
      locationCheckMethod: null,
    };
  }
  return {
    showEnabled: false,
    showName: null,
    mode: null,
    jukeboxDepth: 0,
    jukeboxRequestLimit: 0,
    checkIfRequested: false,
    locationCheckMethod: null,
  };
}

function initialState(): KioskState {
  const inDemo = config.demoMode;
  const firstUp: NowPlaying | null = inDemo
    ? {
        song: DEMO_SONGS[1]!,
        elapsedSec: DEMO_INITIAL_NOW_PLAYING_ELAPSED,
        durationSec: DEMO_INITIAL_NOW_PLAYING_DURATION,
        queuedByKiosk: false,
      }
    : null;
  return {
    fppConnection: inDemo ? "online" : "connecting",
    rfConnection: inDemo ? "online" : "connecting",
    audio: "off",
    audioRemainingSec: 0,
    nowPlaying: firstUp,
    queue: inDemo ? [...DEMO_INITIAL_QUEUE] : [],
    availableSongs: inDemo ? DEMO_SONGS : [],
    props: buildInitialProps(),
    showStatus: initialShowStatus(inDemo),
    songFeedback: null,
    kioskQueuedSongs: [],
  };
}

function reducer(state: KioskState, action: Action): KioskState {
  switch (action.type) {
    case "connection/fpp":
      return { ...state, fppConnection: action.state };
    case "connection/rf":
      return { ...state, rfConnection: action.state };
    case "rf/sync": {
      // Preserve client-side elapsedSec while the same song is playing —
      // RF doesn't report elapsed, so we tick locally between song changes.
      const incoming = action.snapshot.nowPlaying;
      const merged: NowPlaying | null = incoming
        ? state.nowPlaying && state.nowPlaying.song.name === incoming.song.name
          ? { ...incoming, elapsedSec: state.nowPlaying.elapsedSec }
          : { ...incoming, elapsedSec: 0 }
        : null;
      // Prune kiosk-queued songs that have exited RF's queue. If a song
      // moved from queue to now-playing it's no longer "queued" per RF's
      // rule chain — the kiosk is free to submit another.
      const stillQueued = new Set(action.snapshot.queue.map((q) => q.song.name));
      const nextKioskQueued = state.kioskQueuedSongs.filter((n) => stillQueued.has(n));
      return {
        ...state,
        availableSongs: action.snapshot.availableSongs,
        queue: action.snapshot.queue,
        nowPlaying: merged,
        showStatus: action.snapshot.showStatus,
        kioskQueuedSongs: nextKioskQueued,
      };
    }
    case "song/queue-optimistic": {
      const alreadyTracked = state.kioskQueuedSongs.includes(action.item.song.name);
      return {
        ...state,
        queue: [...state.queue, action.item],
        kioskQueuedSongs: alreadyTracked
          ? state.kioskQueuedSongs
          : [...state.kioskQueuedSongs, action.item.song.name],
      };
    }
    case "song/advance": {
      const [next, ...rest] = state.queue;
      if (!next) return { ...state, nowPlaying: null };
      const nextKioskQueued = state.kioskQueuedSongs.filter((n) => n !== next.song.name);
      return {
        ...state,
        nowPlaying: {
          song: next.song,
          elapsedSec: 0,
          durationSec: null,
          queuedByKiosk: false,
        },
        queue: rest,
        kioskQueuedSongs: nextKioskQueued,
      };
    }
    case "song/tick": {
      if (!state.nowPlaying) return state;
      return {
        ...state,
        nowPlaying: { ...state.nowPlaying, elapsedSec: action.elapsedSec },
      };
    }
    case "song/feedback":
      return { ...state, songFeedback: action.feedback };
    case "audio/set":
      return {
        ...state,
        audio: action.state,
        audioRemainingSec: action.remainingSec ?? state.audioRemainingSec,
      };
    case "audio/tick":
      return { ...state, audioRemainingSec: Math.max(0, action.remainingSec) };
    case "prop/cooldown": {
      const existing = state.props[action.propId];
      if (!existing) return state;
      return {
        ...state,
        props: {
          ...state.props,
          [action.propId]: { cooldownUntil: action.until, lastError: null },
        },
      };
    }
    case "prop/ready": {
      const existing = state.props[action.propId];
      if (!existing) return state;
      return {
        ...state,
        props: {
          ...state.props,
          [action.propId]: { ...existing, cooldownUntil: null },
        },
      };
    }
    case "prop/error": {
      const existing = state.props[action.propId];
      if (!existing) return state;
      return {
        ...state,
        props: {
          ...state.props,
          [action.propId]: { ...existing, lastError: action.message },
        },
      };
    }
    default:
      return state;
  }
}

function normalizeMode(raw: string | null | undefined): ViewerControlMode | null {
  if (raw === "JUKEBOX" || raw === "VOTING") return raw;
  return null;
}

function snapshotFromRf(show: rf.RfShow): RfSnapshot {
  const availableSongs: Song[] = show.sequences
    .filter((s) => s.active)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s) => ({
      name: s.name,
      displayName: s.displayName ?? s.name,
      artist: s.artist,
      imageUrl: s.imageUrl,
      category: s.category,
      active: s.active,
    }));

  const songByName = new Map(availableSongs.map((s) => [s.name, s]));

  const queue: QueueItem[] = show.requests
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((req) => ({
      position: req.position,
      song:
        songByName.get(req.sequence.name) ?? {
          name: req.sequence.name,
          displayName: req.sequence.displayName ?? req.sequence.name,
          artist: req.sequence.artist,
          imageUrl: req.sequence.imageUrl,
          category: null,
          active: true,
        },
    }));

  const npSeq = show.playingNowSequence;
  const nowPlaying: NowPlaying | null = npSeq
    ? {
        song:
          songByName.get(npSeq.name) ?? {
            name: npSeq.name,
            displayName: npSeq.displayName ?? npSeq.name,
            artist: npSeq.artist,
            imageUrl: npSeq.imageUrl,
            category: null,
            active: true,
          },
        elapsedSec: 0,
        durationSec: npSeq.duration ?? null,
        queuedByKiosk: false,
      }
    : null;

  const prefs = show.preferences;
  const showStatus: ShowStatus = {
    showEnabled: prefs?.viewerControlEnabled ?? false,
    showName: show.showName,
    mode: normalizeMode(prefs?.viewerControlMode),
    jukeboxDepth: prefs?.jukeboxDepth ?? 0,
    jukeboxRequestLimit: prefs?.jukeboxRequestLimit ?? 0,
    checkIfRequested: prefs?.checkIfRequested ?? false,
    locationCheckMethod: prefs?.locationCheckMethod ?? null,
  };

  return { availableSongs, queue, nowPlaying, showStatus };
}

type KioskActions = {
  queueSong: (songName: string) => Promise<void>;
  triggerProp: (propId: string) => void;
  audioOn: () => void;
  audioOff: () => void;
};

type KioskContextValue = {
  state: KioskState;
  actions: KioskActions;
};

// eslint-disable-next-line react-refresh/only-export-components
export const KioskContext = createContext<KioskContextValue | null>(null);

export function KioskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const audioBusyRef = useRef(false);
  const viewerIdRef = useRef<string | null>(null);
  if (viewerIdRef.current === null) {
    viewerIdRef.current = getOrCreateViewerId();
  }

  const queueSong = useCallback(async (songName: string) => {
    const song = state.availableSongs.find((s) => s.name === songName);
    if (!song) return;

    if (config.demoMode) {
      const item: QueueItem = {
        position: state.queue.length + 1,
        song,
      };
      dispatch({ type: "song/queue-optimistic", item });
      dispatch({
        type: "song/feedback",
        feedback: { kind: "queued", songName, at: Date.now() },
      });
      return;
    }

    const result = await rf.addSequenceToQueue(songName, viewerIdRef.current ?? "kiosk");
    if (result.ok) {
      dispatch({
        type: "song/queue-optimistic",
        item: { position: state.queue.length + 1, song },
      });
      dispatch({
        type: "song/feedback",
        feedback: { kind: "queued", songName, at: Date.now() },
      });
    } else {
      dispatch({
        type: "song/feedback",
        feedback: {
          kind: "error",
          songName,
          message: result.message,
          at: Date.now(),
        },
      });
    }
  }, [state.availableSongs, state.queue.length]);

  const triggerProp = useCallback((propId: string) => {
    const def = config.props.find((p) => p.id === propId);
    if (!def) return;
    const runtime = state.props[propId];
    if (runtime?.cooldownUntil && runtime.cooldownUntil > Date.now()) return;
    dispatch({
      type: "prop/cooldown",
      propId,
      until: Date.now() + def.cooldownSec * 1000,
    });
    // Real FPP preset trigger arrives in Phase 4.
  }, [state.props]);

  const audioOn = useCallback(() => {
    if (audioBusyRef.current) return;
    if (state.audio === "active" || state.audio === "starting") return;
    audioBusyRef.current = true;
    dispatch({ type: "audio/set", state: "starting" });
    window.setTimeout(() => {
      const seconds = config.demoMode ? config.demoAudioSeconds : config.audioDurationSeconds;
      dispatch({ type: "audio/set", state: "active", remainingSec: seconds });
      audioBusyRef.current = false;
    }, 500);
  }, [state.audio]);

  const audioOff = useCallback(() => {
    if (audioBusyRef.current) return;
    audioBusyRef.current = true;
    dispatch({ type: "audio/set", state: "stopping" });
    window.setTimeout(() => {
      dispatch({ type: "audio/set", state: "off", remainingSec: 0 });
      audioBusyRef.current = false;
    }, 300);
  }, []);

  useEffect(() => {
    if (!state.songFeedback) return;
    const id = window.setTimeout(() => {
      dispatch({ type: "song/feedback", feedback: null });
    }, 2500);
    return () => window.clearTimeout(id);
  }, [state.songFeedback]);

  useEffect(() => {
    if (config.demoMode) return;

    let cancelled = false;
    let timer: number | null = null;
    const controller = new AbortController();

    const tick = async () => {
      if (cancelled) return;
      try {
        const show = await rf.getShow(controller.signal);
        if (cancelled) return;
        dispatch({ type: "rf/sync", snapshot: snapshotFromRf(show) });
        dispatch({ type: "connection/rf", state: "online" });
      } catch (err) {
        if (cancelled) return;
        console.warn("[rf] getShow failed", err);
        dispatch({ type: "connection/rf", state: "offline" });
      } finally {
        if (!cancelled) {
          timer = window.setTimeout(tick, config.rfPollMs);
        }
      }
    };

    tick();

    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (config.demoMode) return;
    const viewerId = viewerIdRef.current ?? "kiosk";
    rf.updateActiveViewers(viewerId);
    const id = window.setInterval(() => {
      rf.updateActiveViewers(viewerId);
    }, config.rfPresenceMs);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!state.nowPlaying) return;
    const duration = state.nowPlaying.durationSec;
    if (duration == null) return;
    const startTs = Date.now() - state.nowPlaying.elapsedSec * 1000;
    const id = window.setInterval(() => {
      const elapsed = Math.min(duration, Math.floor((Date.now() - startTs) / 1000));
      dispatch({ type: "song/tick", elapsedSec: elapsed });
      if (elapsed >= duration && config.demoMode) {
        window.clearInterval(id);
        dispatch({ type: "song/advance" });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.nowPlaying?.song.name, state.nowPlaying?.durationSec]);

  useEffect(() => {
    if (state.audio !== "active") return;
    const expiresAt = Date.now() + state.audioRemainingSec * 1000;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      dispatch({ type: "audio/tick", remainingSec: remaining });
      if (remaining <= 0) {
        window.clearInterval(id);
        dispatch({ type: "audio/set", state: "off", remainingSec: 0 });
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [state.audio]);

  useEffect(() => {
    const anyOnCooldown = Object.values(state.props).some(
      (p) => p.cooldownUntil !== null,
    );
    if (!anyOnCooldown) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      for (const [propId, runtime] of Object.entries(state.props)) {
        if (runtime.cooldownUntil && runtime.cooldownUntil <= now) {
          dispatch({ type: "prop/ready", propId });
        }
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [state.props]);

  const value = useMemo<KioskContextValue>(
    () => ({ state, actions: { queueSong, triggerProp, audioOn, audioOff } }),
    [state, queueSong, triggerProp, audioOn, audioOff],
  );

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>;
}
