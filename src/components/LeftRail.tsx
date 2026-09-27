import { useCallback, useRef, useState } from "react";
import { config } from "../config";
import type { TabId } from "../state/types";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "songs", label: "Songs", emoji: "🎵" },
  { id: "props", label: "Effects", emoji: "🎃" },
  { id: "audio", label: "Audio", emoji: "🔊" },
  { id: "follow", label: "Follow", emoji: "📸" },
  { id: "about", label: "About", emoji: "💡" },
];

const ADMIN_TAP_COUNT = 7;
const ADMIN_TAP_WINDOW_MS = 3000;

export function LeftRail({
  active,
  onSelect,
  onAdminGesture,
}: {
  active: TabId;
  onSelect: (id: TabId) => void;
  onAdminGesture?: () => void;
}) {
  const { brand } = config;
  const [flash, setFlash] = useState(false);
  const tapsRef = useRef<number[]>([]);

  const onBrandTap = useCallback(() => {
    const now = Date.now();
    tapsRef.current = tapsRef.current.filter((t) => now - t < ADMIN_TAP_WINDOW_MS);
    tapsRef.current.push(now);
    if (tapsRef.current.length >= ADMIN_TAP_COUNT) {
      tapsRef.current = [];
      setFlash(true);
      window.setTimeout(() => setFlash(false), 400);
      onAdminGesture?.();
    }
  }, [onAdminGesture]);

  return (
    <nav
      className="flex h-full w-[88px] shrink-0 flex-col items-stretch border-r border-white/10 bg-black/55 py-4 backdrop-blur-md"
      role="tablist"
      aria-label="Kiosk sections"
    >
      <button
        type="button"
        onClick={onBrandTap}
        aria-label={brand.name}
        className={
          "mx-2 mb-4 flex items-center justify-center rounded-2xl py-4 transition select-none " +
          (flash ? "bg-accent-500/25" : "bg-white/[0.03] hover:bg-white/[0.06]")
        }
      >
        <span
          className="brand-title text-3xl font-black uppercase leading-none tracking-[0.08em]"
          aria-hidden
        >
          HL
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-2 px-2">
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
                "relative flex flex-col items-center justify-center gap-1 rounded-2xl py-4 transition active:scale-[0.97] " +
                (isActive
                  ? "bg-gradient-to-b from-accent-500/25 to-accent-500/5 text-accent-100 shadow-[0_0_18px_rgb(var(--accent-rgb)_/_0.28)]"
                  : "text-neutral-400 hover:text-neutral-200")
              }
            >
              {isActive ? (
                <span
                  aria-hidden
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-accent-300 shadow-[0_0_10px_rgb(var(--accent-rgb)_/_0.9)]"
                />
              ) : null}
              <span className="text-2xl leading-none" aria-hidden>
                {tab.emoji}
              </span>
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.22em]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
