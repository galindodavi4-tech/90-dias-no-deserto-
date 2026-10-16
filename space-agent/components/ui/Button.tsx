import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "warm" | "ghost" };

const variants = {
  primary: "ds-gradient-primary text-bg-deep shadow-[var(--shadow-glow)]",
  warm: "ds-gradient-warm text-bg-deep shadow-[0_8px_28px_-6px_rgb(244_123_107/0.55)]",
  ghost: "border border-line text-ink-muted hover:text-ink hover:border-primary-600",
};

/** Botão largo em pílula — o "LOGIN" do kit. */
export function Button({ variant = "primary", className = "", ...props }: Props) {
  return (
    <button
      type="button"
      className={`h-12 rounded-[var(--radius-control)] px-6 text-sm font-semibold tracking-[0.14em] uppercase transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
