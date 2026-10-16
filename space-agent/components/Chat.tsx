"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "./ui/Card";
import { Chip } from "./ui/Chip";
import { SendIcon, StopIcon } from "./ui/icons";
import { Markdown } from "./Markdown";
import type { UiMessage } from "./useSpaceAgent";

const SUGGESTIONS = [
  "Qual é a missão tripulada mais recente?",
  "Meu foguete: 1 estágio, 20 t secas, 300 t de propelente, empuxo 2.900 kN, Isp 290 s, 5 motores, 2 t de carga para LEO, sem aletas. Pode lançar?",
  "Mostre um foguete de 3 estágios com aletas.",
  "Quais são as maiores tendências econômicas agora?",
];

type Props = {
  messages: UiMessage[];
  busy: boolean;
  status: string | null;
  onSend: (text: string) => void;
  onStop: () => void;
};

export function Chat({ messages, busy, status, onSend, onStop }: Props) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <Card className="flex h-[70dvh] min-h-[420px] flex-col p-0 lg:sticky lg:top-5 lg:h-[calc(100dvh-7.5rem)]">
      <div className="ds-scroll flex-1 space-y-5 overflow-y-auto px-5 pt-5 pb-3" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex h-full flex-col justify-end gap-4">
            <div>
              <p className="text-lg font-semibold">Pergunte sobre o espaço.</p>
              <p className="mt-1 text-sm text-ink-muted">
                Astronomia, checagem de lançamento, foguete em 3D e tendências de marketing e economia.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              {SUGGESTIONS.map((s) => (
                <Chip key={s} onClick={() => onSend(s)} disabled={busy}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="ds-raised max-w-[85%] rounded-2xl rounded-br-md border border-primary/30 px-4 py-2.5 text-sm whitespace-pre-wrap">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={m.id} className="flex gap-3">
              <span className="ds-gradient-primary mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl text-xs font-bold text-bg-deep">
                SA
              </span>
              <div className="min-w-0 flex-1 text-sm leading-relaxed text-ink/90">
                {m.content && <Markdown text={m.content} />}
                {busy && i === messages.length - 1 && status && (
                  <p className="flex items-center gap-2 text-ink-muted">
                    <span className="flex gap-1" aria-hidden>
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="size-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${d * 120}ms` }} />
                      ))}
                    </span>
                    {status}
                  </p>
                )}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 border-t border-line/50 pt-2">
                    <p className="ds-label mb-1.5 text-[10px]">Fontes</p>
                    <ol className="space-y-1 text-xs">
                      {m.sources.map((s, n) => (
                        <li key={s.url} className="truncate">
                          <span className="text-ink-faint">{n + 1}. </span>
                          <a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            {s.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {m.error && (
                  <p role="alert" className="mt-2 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                    {m.error}
                  </p>
                )}
              </div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex gap-3 border-t border-line/40 p-4">
        <label className="sr-only" htmlFor="prompt">
          Mensagem
        </label>
        <textarea
          id="prompt"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
          }}
          placeholder="PERGUNTE AO SPACE AGENT"
          className="h-12 max-h-40 min-w-0 flex-1 resize-none rounded-[var(--radius-control)] border border-line bg-surface/50 px-4 py-3 text-sm text-ink placeholder:tracking-[0.14em] placeholder:text-ink-faint focus:border-primary focus:outline-none"
        />
        {busy ? (
          <button type="button" onClick={onStop} aria-label="Parar" className="ds-gradient-warm grid size-12 shrink-0 place-items-center rounded-[var(--radius-control)] text-bg-deep">
            <StopIcon />
          </button>
        ) : (
          <button type="submit" aria-label="Enviar" disabled={!draft.trim()} className="ds-gradient-primary grid size-12 shrink-0 place-items-center rounded-[var(--radius-control)] text-bg-deep shadow-[var(--shadow-glow)] disabled:opacity-40 disabled:shadow-none">
            <SendIcon />
          </button>
        )}
      </form>
    </Card>
  );
}
