import type { ButtonHTMLAttributes } from "react";

export function Chip({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-full border border-line/70 bg-surface/60 px-3.5 py-1.5 text-left text-xs text-ink-muted transition hover:border-primary hover:text-ink disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}
