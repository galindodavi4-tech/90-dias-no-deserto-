type Series = { values: number[]; from: string; to: string };

type Props = {
  /** Rótulos do eixo X. */
  labels: string[];
  series: Series[];
  /** Linha de referência horizontal (ex.: Δv necessário). */
  target?: { value: number; label: string };
  caption: string;
  unit?: string;
};

/** Gráfico de área com ondas suaves e gradiente — o gráfico grande do kit. */
export function AreaChart({ labels, series, target, caption, unit = "" }: Props) {
  const W = 320;
  const H = 150;
  const pad = { l: 36, r: 8, t: 10, b: 18 };
  const all = series.flatMap((s) => s.values).concat(target ? [target.value] : []);
  const maxV = Math.max(1, ...all) * 1.12;
  const n = Math.max(2, labels.length);
  const x = (i: number) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / maxV) * (H - pad.t - pad.b);

  // Curva suave (Catmull-Rom → Bézier).
  const path = (vals: number[]) => {
    const pts = vals.map((v, i) => [x(i), y(v)] as const);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const [p1, p2] = [pts[i], pts[i + 1]];
      const p3 = pts[i + 2] ?? p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
    }
    return d;
  };
  const ticks = [0.25, 0.5, 0.75, 1].map((f) => maxV * f);
  const fmt = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}K` : `${Math.round(v)}`);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={caption}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`area-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.from} stopOpacity="0.95" />
              <stop offset="1" stopColor={s.to} stopOpacity="0.25" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <text key={t} x={pad.l - 6} y={y(t) + 3} textAnchor="end" className="fill-ink-faint text-[8px]">
            {fmt(t)}
          </text>
        ))}
        {series.map((s, i) => (
          <path
            key={i}
            d={`${path(s.values)} L${x(s.values.length - 1)},${y(0)} L${x(0)},${y(0)} Z`}
            fill={`url(#area-${i})`}
            className="mix-blend-screen"
          />
        ))}
        {target && (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={y(target.value)} y2={y(target.value)} stroke="var(--color-ink)" strokeDasharray="4 4" strokeOpacity="0.6" />
            <text x={W - pad.r} y={y(target.value) - 4} textAnchor="end" className="fill-ink text-[8px]">
              {target.label}
            </text>
          </g>
        )}
        <path d={`M${pad.l},${pad.t} L${pad.l},${y(0)} L${W - pad.r},${y(0)}`} fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
        {labels.map((l, i) => (
          <text key={l} x={x(i)} y={H - 4} textAnchor="middle" className="fill-ink-faint text-[8px]">
            {l}
          </text>
        ))}
      </svg>
      <figcaption className="mt-1 text-center text-sm text-ink-muted">
        {caption}
        {unit && <span className="text-ink-faint"> ({unit})</span>}
      </figcaption>
    </figure>
  );
}
