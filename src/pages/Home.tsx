import { useEffect, useState } from "react";
import { AboutPanel } from "../components/AboutPanel";
import { AttractOverlay } from "../components/AttractOverlay";
import { AudioCard } from "../components/AudioCard";
import { AudioPanel } from "../components/AudioPanel";
import { AudioResetToast } from "../components/AudioResetToast";
import { BackgroundFX } from "../components/BackgroundFX";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { FollowPanel } from "../components/FollowPanel";
import { LeftRail } from "../components/LeftRail";
import { NowPlayingCard } from "../components/NowPlayingCard";
import { PropPanel } from "../components/PropPanel";
import { QueueList } from "../components/QueueList";
import { SongPicker } from "../components/SongPicker";
import { useIdle } from "../hooks/useIdle";
import { useKiosk } from "../hooks/useKiosk";
import type { TabId } from "../state/types";
import { Admin } from "./Admin";

const ATTRACT_IDLE_MS = 60_000;

export function Home() {
  const { state } = useKiosk();
  // Default to Songs — the driveway-speaker toggle now lives in the right
  // rail (AudioCard), so it's one tap from any tab and doesn't need to be
  // the landing view anymore.
  const [tab, setTab] = useState<TabId>("songs");
  const [adminOpen, setAdminOpen] = useState(false);
  const [attractOpen, setAttractOpen] = useState(false);
  const isIdle = useIdle(ATTRACT_IDLE_MS);

  // Open the attract overlay when the user goes idle, but don't close it
  // when idle flips back to false — closing has to happen via an explicit
  // click on the overlay. If we unmounted on !isIdle, the touch that woke
  // the kiosk would dispatch its synthetic click to whatever's underneath
  // (usually a song card), silently queueing a song.
  useEffect(() => {
    if (isIdle) setAttractOpen(true);
  }, [isIdle]);

  const showAttract = attractOpen && !adminOpen;

  const dismissAttract = () => {
    setAttractOpen(false);
    setTab("songs");
  };

  return (
    <div className="relative flex h-dvh w-full overflow-hidden text-neutral-100">
      <BackgroundFX />

      <LeftRail
        active={tab}
        onSelect={(id) => {
          setTab(id);
          setAttractOpen(false);
        }}
        onAdminGesture={() => setAdminOpen(true)}
      />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden px-8 py-6">
        {tab === "songs" && <SongPicker />}
        {tab === "props" && <PropPanel />}
        {tab === "audio" && <AudioPanel />}
        {tab === "follow" && <FollowPanel />}
        {tab === "about" && <AboutPanel />}
        {showAttract && <AttractOverlay onDismiss={dismissAttract} />}
      </main>

      <aside className="relative flex h-full w-[360px] shrink-0 flex-col gap-4 border-l border-white/10 bg-black/40 px-4 py-6 backdrop-blur-md">
        <NowPlayingCard
          onPickSong={() => {
            setTab("songs");
            setAttractOpen(false);
          }}
        />
        <div className="min-h-0 flex-1 overflow-hidden">
          <QueueList
            queue={state.queue}
            kioskQueuedSongs={state.kioskQueuedSongs}
            showStatus={state.showStatus}
            nowPlaying={state.nowPlaying}
          />
        </div>
        <AudioCard />
      </aside>

      <AudioResetToast />
      <ConnectionStatus />
      {adminOpen && <Admin onClose={() => setAdminOpen(false)} />}
    </div>
  );
}
