import { useEffect, useState } from "react";
import { config } from "../config";

function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

// `?after-hours=1` forces the takeover on, `?after-hours=0` forces it off.
// Lets us preview the splash without resetting the system clock. Null means
// defer to the real wall-clock check.
function urlOverride(): boolean | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("after-hours");
  if (raw === "1" || raw === "true") return true;
  if (raw === "0" || raw === "false") return false;
  return null;
}

export function isAfterHoursAt(d: Date): boolean {
  const override = urlOverride();
  if (override !== null) return override;
  const m = minutesSinceMidnight(d);
  return m >= config.afterHoursStartMinutes && m < config.afterHoursEndMinutes;
}

// Polls once a second so the 9:00pm handoff lands within a second of the
// clock boundary — the kiosk only runs for a few hours a day, so there's
// no point optimising for background cost here.
export function useAfterHours(): boolean {
  const [state, setState] = useState(() => isAfterHoursAt(new Date()));
  useEffect(() => {
    const tick = () => setState(isAfterHoursAt(new Date()));
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return state;
}
