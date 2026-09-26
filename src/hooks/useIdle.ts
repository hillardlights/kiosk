import { useEffect, useRef, useState } from "react";

// Emits true when the user hasn't touched the kiosk in `idleMs` milliseconds.
// Any pointer, touch, or key event resets the countdown. mousemove during
// drags fires at display frequency (60Hz+), so we throttle re-arming so
// the timer isn't reset on every frame — that noticeably slowed scrolling
// on the Pi 4.
const REARM_THROTTLE_MS = 500;

export function useIdle(idleMs: number): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<number | null>(null);
  const lastRearmRef = useRef(0);

  useEffect(() => {
    const arm = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setIsIdle(true), idleMs);
      lastRearmRef.current = performance.now();
    };

    const wake = () => {
      const now = performance.now();
      if (now - lastRearmRef.current < REARM_THROTTLE_MS) return;
      setIsIdle(false);
      arm();
    };

    arm();

    const opts = { passive: true } as const;
    window.addEventListener("pointerdown", wake, opts);
    window.addEventListener("touchstart", wake, opts);
    window.addEventListener("keydown", wake);
    window.addEventListener("mousemove", wake, opts);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("touchstart", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("mousemove", wake);
    };
  }, [idleMs]);

  return isIdle;
}
