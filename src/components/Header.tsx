import { useCallback, useRef, useState } from "react";

const ADMIN_TAP_COUNT = 7;
const ADMIN_TAP_WINDOW_MS = 3000;

export function Header() {
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
      // Admin route is wired up in Phase 7.
      console.info("[admin] gesture recognized");
    }
  }, []);

  return (
    <header className="flex flex-col items-center pt-[6vh]">
      <button
        type="button"
        onClick={onTap}
        aria-label="Hillard Lights"
        className={
          "select-none rounded-2xl px-6 py-2 text-center transition " +
          (flash ? "bg-orange-500/20" : "bg-transparent")
        }
      >
        <h1 className="halloween-title text-[clamp(2.75rem,7vw,5.25rem)] font-black uppercase leading-none tracking-[0.08em]">
          Hillard Lights
        </h1>
      </button>
      <p className="mt-3 text-[clamp(1rem,2vw,1.5rem)] font-medium uppercase tracking-[0.4em] text-neutral-400">
        Welcome
      </p>
    </header>
  );
}
