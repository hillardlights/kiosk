import type { TabId } from "../state/types";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "songs", label: "Songs", emoji: "🎵" },
  { id: "props", label: "Effects", emoji: "🎃" },
  { id: "audio", label: "Audio", emoji: "🔊" },
  { id: "follow", label: "Follow", emoji: "📸" },
];

export function TabBar({
  active,
  onSelect,
}: {
  active: TabId;
  onSelect: (id: TabId) => void;
}) {
  return (
    <nav
      className="grid grid-cols-4 gap-2 rounded-3xl border border-white/10 bg-black/70 p-2 backdrop-blur-md"
      role="tablist"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={
              "flex flex-col items-center justify-center gap-1 rounded-2xl py-4 transition active:scale-[0.98] " +
              (isActive
                ? "bg-gradient-to-b from-orange-500/25 to-orange-500/5 text-orange-100 shadow-[0_0_18px_rgba(249,115,22,0.28)]"
                : "text-neutral-400 hover:text-neutral-200")
            }
          >
            <span className="text-2xl leading-none">{tab.emoji}</span>
            <span className="text-xs font-bold uppercase tracking-[0.25em]">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
