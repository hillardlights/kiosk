import { useKiosk } from "../hooks/useKiosk";

export function ConnectionStatus() {
  const { state } = useKiosk();

  const label =
    state.connection === "online"
      ? "Show Online"
      : state.connection === "connecting"
        ? "Connecting…"
        : "Show Offline";

  const dot =
    state.connection === "online"
      ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]"
      : state.connection === "connecting"
        ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)] animate-pulse"
        : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.75)]";

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-neutral-300 backdrop-blur">
      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      <span>{label}</span>
    </div>
  );
}
