export function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(88,28,135,0.35),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(194,65,12,0.35),transparent_60%)]" />
      <div className="fog fog-a" />
      <div className="fog fog-b" />
      <div className="fog fog-c" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.85))]" />
    </div>
  );
}
