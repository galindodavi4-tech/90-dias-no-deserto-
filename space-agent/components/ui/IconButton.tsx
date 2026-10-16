import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { label: string };

/** Botão quadrado em relevo, com ícone — o "+ / − / casa / menu" do kit. */
export function IconButton({ label, className = "", children, ...props }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`ds-raised grid size-12 place-items-center text-ink transition hover:shadow-[var(--shadow-glow)] active:translate-y-px disabled:opacity-40 disabled:hover:shadow-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
