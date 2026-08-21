import { useCallback, useRef, useState } from "react";
import { config } from "../config";

const ADMIN_TAP_COUNT = 7;
const ADMIN_TAP_WINDOW_MS = 3000;

export function Header({ onAdminGesture }: { onAdminGesture?: () => void }) {
  const [flash, setFlash] = useState(false);
  const tapsRef = useRef<number[]>([]);

  const onTap = useCallback(() => {
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

  const { brand } = config;

  return (
    <header className="flex flex-col items-center">
      <button
        type="button"
        onClick={onTap}
        aria-label={brand.name}
        className={
          "select-none rounded-2xl px-6 py-1 text-center transition " +
          (flash ? "bg-orange-500/20" : "bg-transparent")
        }
      >
        <div className="flex items-baseline justify-center gap-3">
          <span className="text-[clamp(1.5rem,3.5vw,2.5rem)] leading-none" aria-hidden>
            {brand.seasonEmoji}
          </span>
          <h1 className="halloween-title text-[clamp(2rem,5.5vw,3.75rem)] font-black uppercase leading-none tracking-[0.08em]">
            {brand.name}
          </h1>
          <span className="text-[clamp(1.5rem,3.5vw,2.5rem)] leading-none" aria-hidden>
            {brand.seasonEmoji}
          </span>
        </div>
      </button>
      <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-orange-300/70">
        {brand.seasonLabel} {brand.seasonYear}
      </p>
    </header>
  );
}
