type Bar = { label: string; fraction: number; danger?: boolean };

const gradients = [
  "linear-gradient(0deg, var(--color-coral), var(--color-peach))",
  "linear-gradient(0deg, var(--color-primary-700), var(--color-primary-300))",
  "linear-gradient(0deg, #6c5ce7, var(--color-lavender))",
  "linear-gradient(0deg, var(--color-primary-600), var(--color-primary-200))",
];

/** Barras verticais MAX/MIN do kit, aqui usadas para a fração de propelente. */
export function MeterBars({ bars, min, max }: { bars: Bar[]; min: number; max: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="ds-label">Max</span>
      <div className="relative flex h-36 items-end gap-4">
        {/* Faixa aceitável */}
        <div
          className="pointer-events-none absolute inset-x-[-10px] rounded-md border border-dashed border-primary/30 bg-primary/5"
          style={{ bottom: `${min * 100}%`, height: `${(max - min) * 100}%` }}
          aria-hidden
        />
        {bars.map((bar, i) => (
          <div key={bar.label} className="relative flex h-full w-4 items-end rounded-full bg-bg-deep/70">
            <div
              className="w-full rounded-full transition-[height] duration-700"
              style={{
                height: `${Math.max(0.04, Math.min(1, bar.fraction)) * 100}%`,
                background: bar.danger
                  ? "linear-gradient(0deg, var(--color-danger), var(--color-coral))"
                  : gradients[i % gradients.length],
              }}
              title={`${bar.label}: ${Math.round(bar.fraction * 100)}%`}
            />
          </div>
        ))}
      </div>
      <span className="ds-label">Min</span>
      <div className="flex gap-4 text-[10px] text-ink-faint">
        {bars.map((b) => (
          <span key={b.label} className="w-4 text-center">
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
