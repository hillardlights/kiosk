import { useEffect, useRef, useState } from "react";

// Emits true when the user hasn't touched the kiosk in `idleMs` milliseconds.
// Any pointer, touch, or key event resets the countdown.
export function useIdle(idleMs: number): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const arm = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setIsIdle(true), idleMs);
    };

    const wake = () => {
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
