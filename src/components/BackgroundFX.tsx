export function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, rgb(var(--cool-rgb) / 0.28), transparent 55%), " +
            "radial-gradient(ellipse at bottom, rgb(var(--accent-rgb) / 0.28), transparent 60%)",
        }}
      />
      <div className="fog fog-a" />
      <div className="fog fog-b" />
      <div className="fog fog-c" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.85))",
        }}
      />
    </div>
  );
}
