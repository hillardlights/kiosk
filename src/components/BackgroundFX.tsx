export function BackgroundFX() {
  // Static gradients only — the animated blur-filter fog layers we used
  // previously cost the Pi 4's VideoCore VI GPU way too much per frame
  // and made touch input feel laggy. Cosmetics not worth the input cost.
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgb(var(--cool-rgb) / 0.22), transparent 55%), " +
          "radial-gradient(ellipse at bottom right, rgb(var(--accent-rgb) / 0.22), transparent 60%), " +
          "radial-gradient(circle at center, transparent 45%, rgba(0,0,0,0.75)), " +
          "#050505",
      }}
    />
  );
}
