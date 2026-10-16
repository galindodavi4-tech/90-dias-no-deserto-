type Props = {
  /** 0 a 1; valores acima de 1 enchem o anel. */
  fraction: number;
  value: string;
  label: string;
  color: string;
  colorTo?: string;
  danger?: boolean;
};

/** Anel de progresso com o valor no meio — os "45% / 60% / 75%" do kit. */
export function DonutGauge({ fraction, value, label, color, colorTo, danger }: Props) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, fraction)) * c;
  const id = `g-${label.replace(/\W/g, "")}`;
  return (
    <figure className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 84 84" className="size-22" role="img" aria-label={`${label}: ${value}`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={danger ? "var(--color-danger)" : color} />
            <stop offset="1" stopColor={danger ? "var(--color-coral)" : (colorTo ?? color)} />
          </linearGradient>
        </defs>
        <circle cx="42" cy="42" r={r} fill="none" stroke="var(--color-bg-deep)" strokeWidth="9" opacity="0.7" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
          transform="rotate(-90 42 42)"
          className="transition-[stroke-dasharray] duration-700"
        />
        <text x="42" y="46" textAnchor="middle" className="fill-ink-muted text-[13px] font-medium">
          {value}
        </text>
      </svg>
      <figcaption className="text-[11px] tracking-wider text-ink-faint uppercase">{label}</figcaption>
    </figure>
  );
}
