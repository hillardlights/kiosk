import { useKiosk } from "../hooks/useKiosk";
import type { ConnectionState } from "../state/types";

function dot(state: ConnectionState): string {
  if (state === "online")
    return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]";
  if (state === "connecting")
    return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)] animate-pulse";
  return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.75)]";
}

export function ConnectionStatus() {
  const { state } = useKiosk();

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 flex items-center gap-3 rounded-full border border-white/10 bg-black/65 px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.25em] text-neutral-300 backdrop-blur">
      <span className="flex items-center gap-1.5">
        <span className={`inline-block h-2 w-2 rounded-full ${dot(state.fppConnection)}`} />
        <span>Show</span>
      </span>
      <span className="h-3 w-px bg-white/15" />
      <span className="flex items-center gap-1.5">
        <span className={`inline-block h-2 w-2 rounded-full ${dot(state.rfConnection)}`} />
        <span>Requests</span>
      </span>
    </div>
  );
}
