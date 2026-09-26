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
import {
  clearAudioExpiry,
  persistAudioExpiry,
  readAudioExpiry,
  remainingFromExpiry,
} from "../services/audioTimer";
import * as fpp from "../services/fpp";
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
  | { type: "fpp/anchor-nowplaying"; anchor: fpp.FppNowPlaying }
  | { type: "song/queue-optimistic"; item: QueueItem }
  | { type: "song/advance" }
  | { type: "song/tick"; elapsedSec: number }
  | { type: "song/feedback"; feedback: SongFeedback | null }
  | { type: "audio/set"; state: AudioState; remainingSec?: number; expiresAt?: number | null }
  | { type: "audio/tick"; remainingSec: number }
  | { type: "audio/reset-flash"; at: number | null }
  | { type: "prop/cooldown"; propId: string; until: number }
  | { type: "prop/ready"; propId: string }
  | { type: "prop/error"; propId: string; message: string }
  | { type: "prop/clear-error"; propId: string };

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

  // If we're mid-audio-session at boot (persisted expiry still in the future),
  // resume with the correct remaining time. Expired timestamps are handled by
  // a mount effect that fires the OFF preset for safety.
  const persistedExpiry = readAudioExpiry();
  const now = Date.now();
  const resumedActive = persistedExpiry != null && persistedExpiry > now;

  return {
    fppConnection: inDemo ? "online" : "connecting",
    rfConnection: inDemo ? "online" : "connecting",
    audio: resumedActive ? "active" : "off",
    audioExpiresAt: resumedActive ? persistedExpiry : null,
    audioRemainingSec: resumedActive ? remainingFromExpiry(persistedExpiry, now) : 0,
    audioResetAt: null,
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
      const incoming = action.snapshot.nowPlaying;
      const merged: NowPlaying | null = incoming
        ? state.nowPlaying && state.nowPlaying.song.name === incoming.song.name
          ? { ...incoming, elapsedSec: state.nowPlaying.elapsedSec }
          : { ...incoming, elapsedSec: 0 }
        : null;
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
    case "fpp/anchor-nowplaying": {
      const { sequenceName, elapsedSec, durationSec } = action.anchor;
      // Same song as RF told us about? Just re-anchor timing.
      if (state.nowPlaying && state.nowPlaying.song.name === sequenceName) {
        return {
          ...state,
          nowPlaying: {
            ...state.nowPlaying,
            elapsedSec,
            durationSec,
          },
        };
      }
      // Different song (or no RF now-playing): FPP is the source of truth
      // for what's actually on the wire. Try to enrich with RF catalog data
      // (artist, image); fall back to a minimal Song from FPP alone.
      const rich = state.availableSongs.find((s) => s.name === sequenceName);
      const song: Song = rich ?? {
        name: sequenceName,
        displayName: sequenceName,
        artist: null,
        imageUrl: null,
        category: null,
        active: true,
      };
      return {
        ...state,
        nowPlaying: {
          song,
          elapsedSec,
          durationSec,
          queuedByKiosk: false,
        },
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
        audioExpiresAt:
          action.expiresAt !== undefined ? action.expiresAt : state.audioExpiresAt,
      };
    case "audio/tick":
      return { ...state, audioRemainingSec: Math.max(0, action.remainingSec) };
    case "audio/reset-flash":
      return { ...state, audioResetAt: action.at };
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
    case "prop/clear-error": {
      const existing = state.props[action.propId];
      if (!existing || existing.lastError === null) return state;
      return {
        ...state,
        props: {
          ...state.props,
          [action.propId]: { ...existing, lastError: null },
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
  triggerProp: (propId: string) => Promise<void>;
  audioOn: () => void;
  audioOff: () => Promise<void>;
};

type KioskContextValue = {
  state: KioskState;
  actions: KioskActions;
};

// eslint-disable-next-line react-refresh/only-export-components
export const KioskContext = createContext<KioskContextValue | null>(null);

const FPP_STATUS_POLL_MS = 5000;
const PROP_ERROR_CLEAR_MS = 4000;

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
      const item: QueueItem = { position: state.queue.length + 1, song };
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
        feedback: { kind: "error", songName, message: result.message, at: Date.now() },
      });
    }
  }, [state.availableSongs, state.queue.length]);

  const triggerProp = useCallback(async (propId: string) => {
    const def = config.props.find((p) => p.id === propId);
    if (!def) return;
    const runtime = state.props[propId];
    if (runtime?.cooldownUntil && runtime.cooldownUntil > Date.now()) return;

    // Optimistic cooldown so a second tap can't fire while the request is in flight.
    dispatch({
      type: "prop/cooldown",
      propId,
      until: Date.now() + def.cooldownSec * 1000,
    });

    if (config.demoMode) return;

    const result = await fpp.triggerPreset(def.preset);
    if (result.ok) {
      dispatch({ type: "connection/fpp", state: "online" });
    } else {
      const msg =
        result.error.kind === "network"
          ? "Show controller unreachable"
          : `Preset failed (${result.error.message})`;
      dispatch({ type: "prop/error", propId, message: msg });
      if (result.error.kind === "network") {
        dispatch({ type: "connection/fpp", state: "offline" });
      }
    }
  }, [state.props]);

  const audioOn = useCallback(() => {
    // Fully synchronous critical path so React can render the new state
    // on the very next frame after the tap — the FPP HTTP call is fired
    // in the background and doesn't gate anything the user sees. Refs
    // for the busy-guard and wasActive avoid stale-closure races when
    // the button is tapped in quick succession.
    if (audioBusyRef.current) return;
    const wasActive = state.audio === "active";
    audioBusyRef.current = true;

    const durationSec = config.demoMode
      ? config.demoAudioSeconds
      : config.audioDurationSeconds;
    const expiresAt = Date.now() + durationSec * 1000;
    dispatch({
      type: "audio/set",
      state: "active",
      remainingSec: durationSec,
      expiresAt,
    });
    if (wasActive) {
      dispatch({ type: "audio/reset-flash", at: Date.now() });
    }
    // localStorage.setItem can spike on slow SD cards — do it after the
    // dispatch so it never sits between the tap and the state update.
    persistAudioExpiry(expiresAt);

    if (config.demoMode) {
      audioBusyRef.current = false;
      return;
    }

    // Fire-and-forget: the timer is already running client-side, this
    // just tells FPP to raise the actual speakers. Failures update the
    // connection dot; the show's own audio-off safety is the backstop.
    void fpp
      .triggerPreset(config.audioOnPreset)
      .then((result) => {
        if (result.ok) {
          dispatch({ type: "connection/fpp", state: "online" });
        } else {
          if (result.error.kind === "network") {
            dispatch({ type: "connection/fpp", state: "offline" });
          }
          console.warn("[audio] on failed (timer still runs):", result.error);
        }
      })
      .finally(() => {
        audioBusyRef.current = false;
      });
  }, [state.audio]);

  const audioOff = useCallback(async () => {
    if (audioBusyRef.current) return;
    audioBusyRef.current = true;
    dispatch({ type: "audio/set", state: "stopping" });
    // Clear the persisted expiry immediately so a reload during OFF-in-flight
    // doesn't re-resume as "active".
    clearAudioExpiry();

    if (config.demoMode) {
      window.setTimeout(() => {
        dispatch({ type: "audio/set", state: "off", remainingSec: 0, expiresAt: null });
        audioBusyRef.current = false;
      }, 300);
      return;
    }

    // Best-effort: FPP's own timer is the authoritative safety, so we always
    // reflect OFF in the UI regardless of whether the call succeeds.
    const result = await fpp.triggerPreset(config.audioOffPreset);
    if (!result.ok) {
      console.warn("[audio] off failed (FPP safety timer still applies):", result.error);
      if (result.error.kind === "network") {
        dispatch({ type: "connection/fpp", state: "offline" });
      }
    } else {
      dispatch({ type: "connection/fpp", state: "online" });
    }
    dispatch({ type: "audio/set", state: "off", remainingSec: 0, expiresAt: null });
    audioBusyRef.current = false;
  }, []);

  // On mount: if a persisted audio expiry exists and has already passed,
  // fire the OFF preset for safety and clear the stored value. The kiosk
  // was dead when the timer would have expired, so this is our chance to
  // catch up. FPP's own 6-min safety is still the ultimate backstop.
  useEffect(() => {
    const persisted = readAudioExpiry();
    if (persisted == null) return;
    if (persisted > Date.now()) return; // still valid — initialState resumed it
    clearAudioExpiry();
    if (!config.demoMode) {
      void fpp.triggerPreset(config.audioOffPreset).catch(() => {});
    }
    console.info("[audio] cleared stale expiry on boot");
  }, []);

  // Auto-clear prop errors after a few seconds.
  useEffect(() => {
    const withErrors = Object.entries(state.props).filter(([, r]) => r.lastError !== null);
    if (withErrors.length === 0) return;
    const timers = withErrors.map(([propId]) =>
      window.setTimeout(
        () => dispatch({ type: "prop/clear-error", propId }),
        PROP_ERROR_CLEAR_MS,
      ),
    );
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [state.props]);

  // Auto-dismiss song feedback after 2.5s.
  useEffect(() => {
    if (!state.songFeedback) return;
    const id = window.setTimeout(() => {
      dispatch({ type: "song/feedback", feedback: null });
    }, 2500);
    return () => window.clearTimeout(id);
  }, [state.songFeedback]);

  // Auto-dismiss the audio reset flash after 2s so the toast fades away.
  useEffect(() => {
    if (state.audioResetAt == null) return;
    const id = window.setTimeout(() => {
      dispatch({ type: "audio/reset-flash", at: null });
    }, 2000);
    return () => window.clearTimeout(id);
  }, [state.audioResetAt]);

  // RF sync loop — skipped in demo mode.
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

  // FPP status polling — updates the Show connection dot.
  useEffect(() => {
    if (config.demoMode) return;

    let cancelled = false;
    let timer: number | null = null;
    const controller = new AbortController();

    const tick = async () => {
      if (cancelled) return;
      const result = await fpp.getStatus(controller.signal);
      if (cancelled) return;
      if (result.ok) {
        dispatch({ type: "connection/fpp", state: "online" });
        const anchor = fpp.extractNowPlaying(result.data);
        if (anchor) dispatch({ type: "fpp/anchor-nowplaying", anchor });
      } else {
        dispatch({ type: "connection/fpp", state: "offline" });
      }
      if (!cancelled) {
        timer = window.setTimeout(tick, FPP_STATUS_POLL_MS);
      }
    };

    tick();

    return () => {
      cancelled = true;
      controller.abort();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  // Presence heartbeat — best-effort, ignores failures.
  useEffect(() => {
    if (config.demoMode) return;
    const viewerId = viewerIdRef.current ?? "kiosk";
    rf.updateActiveViewers(viewerId);
    const id = window.setInterval(() => {
      rf.updateActiveViewers(viewerId);
    }, config.rfPresenceMs);
    return () => window.clearInterval(id);
  }, []);

  // Now-playing local ticker — increments by 1s each second to smooth the
  // progress bar between anchor points. FPP's anchor (every 5s) will re-sync
  // this to reality; using a ref means the ticker always reads the latest
  // elapsedSec even when the reducer overwrites it via anchoring.
  const nowPlayingRef = useRef(state.nowPlaying);
  nowPlayingRef.current = state.nowPlaying;

  useEffect(() => {
    if (!state.nowPlaying) return;
    const id = window.setInterval(() => {
      const np = nowPlayingRef.current;
      if (!np) return;
      const cap = np.durationSec ?? Infinity;
      const nextElapsed = Math.min(cap, np.elapsedSec + 1);
      if (nextElapsed !== np.elapsedSec) {
        dispatch({ type: "song/tick", elapsedSec: nextElapsed });
      }
      if (np.durationSec != null && nextElapsed >= np.durationSec && config.demoMode) {
        window.clearInterval(id);
        dispatch({ type: "song/advance" });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.nowPlaying?.song.name]);

  // Audio countdown driven by the absolute expiration timestamp — no drift,
  // no dependence on the tab staying awake, self-heals on reload via the
  // resume path in initialState.
  const audioOffRef = useRef(audioOff);
  audioOffRef.current = audioOff;

  useEffect(() => {
    if (state.audio !== "active" || state.audioExpiresAt == null) return;
    const expiresAt = state.audioExpiresAt;
    const id = window.setInterval(() => {
      const remaining = remainingFromExpiry(expiresAt);
      dispatch({ type: "audio/tick", remainingSec: remaining });
      if (remaining <= 0) {
        window.clearInterval(id);
        void audioOffRef.current();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [state.audio, state.audioExpiresAt]);

  // Prop cooldown watcher.
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
