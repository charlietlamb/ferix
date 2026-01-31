export function Background() {
  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 z-1 blur-sm" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--accent-2)_4%,var(--background))_0%,transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(315deg,color-mix(in_oklch,var(--accent-2)_2%,var(--background))_0%,transparent_45%)]"
      />
    </div>
  );
}
