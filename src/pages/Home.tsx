import { useState } from "react";
import { AboutPanel } from "../components/AboutPanel";
import { AttractOverlay } from "../components/AttractOverlay";
import { AudioPanel } from "../components/AudioPanel";
import { BackgroundFX } from "../components/BackgroundFX";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { FollowCard } from "../components/FollowCard";
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
  const [tab, setTab] = useState<TabId>("songs");
  const [adminOpen, setAdminOpen] = useState(false);
  const [attractDismissed, setAttractDismissed] = useState(false);
  const isIdle = useIdle(ATTRACT_IDLE_MS);

  const showAttract = isIdle && !adminOpen && !attractDismissed;

  if (!isIdle && attractDismissed) {
    queueMicrotask(() => setAttractDismissed(false));
  }

  return (
    <div className="relative flex h-dvh w-full overflow-hidden text-neutral-100">
      <BackgroundFX />

      <LeftRail
        active={tab}
        onSelect={(id) => {
          setTab(id);
          setAttractDismissed(true);
        }}
        onAdminGesture={() => setAdminOpen(true)}
      />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden px-8 py-6">
        {tab === "songs" && <SongPicker />}
        {tab === "props" && <PropPanel />}
        {tab === "audio" && <AudioPanel />}
        {tab === "follow" && <FollowPanel />}
        {tab === "about" && <AboutPanel />}
        {showAttract && <AttractOverlay onDismiss={() => setAttractDismissed(true)} />}
      </main>

      <aside className="relative flex h-full w-[360px] shrink-0 flex-col gap-4 border-l border-white/10 bg-black/40 px-4 py-6 backdrop-blur-md">
        <NowPlayingCard />
        <div className="min-h-0 flex-1 overflow-hidden">
          <QueueList
            queue={state.queue}
            kioskQueuedSongs={state.kioskQueuedSongs}
            showStatus={state.showStatus}
            nowPlaying={state.nowPlaying}
          />
        </div>
        <FollowCard />
      </aside>

      <ConnectionStatus />
      {adminOpen && <Admin onClose={() => setAdminOpen(false)} />}
    </div>
  );
}
