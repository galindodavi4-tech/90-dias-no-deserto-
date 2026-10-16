type Tone = "primary" | "warm" | "danger" | "neutral";

const tones: Record<Tone, string> = {
  primary: "ds-gradient-primary text-bg-deep",
  warm: "ds-gradient-warm text-bg-deep",
  danger: "bg-danger text-white",
  neutral: "bg-surface-3 text-ink-muted",
};

/** A pílula de valor no canto do gráfico ("$4805.25" no kit). */
export function StatPill({ tone = "primary", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
