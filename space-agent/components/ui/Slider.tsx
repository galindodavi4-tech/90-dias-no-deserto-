"use client";

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  onChange: (v: number) => void;
};

/** Trilho com − / + nas pontas e botão branco — o slider do kit. */
export function Slider({ value, min, max, step = 0.05, label, onChange }: Props) {
  const pct = ((value - min) / (max - min)) * 100;
  const nudge = (dir: 1 | -1) => onChange(Math.min(max, Math.max(min, +(value + dir * step * 4).toFixed(3))));
  return (
    <div className="flex items-center gap-4">
      <button type="button" aria-label={`Diminuir ${label}`} onClick={() => nudge(-1)} className="text-2xl text-ink-muted hover:text-ink">
        −
      </button>
      <div className="relative h-5 flex-1">
        <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-bg-deep/80" />
        <div
          className="ds-gradient-warm absolute top-1/2 left-0 h-3 -translate-y-1/2 rounded-full"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-surface-3 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-surface-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgb(46_230_214/0.5)]"
        />
      </div>
      <button type="button" aria-label={`Aumentar ${label}`} onClick={() => nudge(1)} className="text-2xl text-ink-muted hover:text-ink">
        +
      </button>
    </div>
  );
}
