"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage, LaunchResult, RocketModel, Source, StreamEvent } from "@/lib/schemas";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  error?: string;
};

let seq = 0;
const newId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * Estado do app inteiro: histórico (guardado só no navegador e reenviado a cada
 * pergunta), o último foguete e a última checagem de lançamento.
 */
export function useSpaceAgent() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [rocket, setRocket] = useState<RocketModel | null>(null);
  const [launch, setLaunch] = useState<LaunchResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const patchLast = (fn: (m: UiMessage) => UiMessage) =>
    setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? fn(m) : m)));

  const run = useCallback(async (history: UiMessage[]) => {
    const payload: ChatMessage[] = history
      .filter((m) => m.content.trim() && !m.error)
      .map(({ role, content }) => ({ role, content }));
    setMessages([...history, { id: newId(), role: "assistant", content: "" }]);
    setBusy(true);
    setStatus("Pensando…");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload.slice(-40) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erro ${res.status}`);
      }

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;
          switch (event.type) {
            case "text":
              setStatus(null);
              patchLast((m) => ({ ...m, content: m.content + event.delta }));
              break;
            case "status":
              setStatus(event.label);
              break;
            case "launch":
              setLaunch(event.result);
              break;
            case "rocket":
              setRocket(event.model);
              break;
            case "sources":
              patchLast((m) => ({ ...m, sources: event.sources }));
              break;
            case "error":
              patchLast((m) => ({ ...m, error: event.message }));
              break;
          }
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        patchLast((m) => ({ ...m, error: err instanceof Error ? err.message : "Falha de rede." }));
      }
    } finally {
      patchLast((m) => ({ ...m, content: m.content.trim() }));
      setBusy(false);
      setStatus(null);
      abortRef.current = null;
    }
  }, []);

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      void run([...messages, { id: newId(), role: "user", content }]);
    },
    [busy, messages, run],
  );

  /** Refaz a última pergunta, descartando a resposta anterior. */
  const retry = useCallback(() => {
    if (busy) return;
    const lastUser = messages.findLastIndex((m) => m.role === "user");
    if (lastUser >= 0) void run(messages.slice(0, lastUser + 1));
  }, [busy, messages, run]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setRocket(null);
    setLaunch(null);
  }, []);

  return { messages, busy, status, rocket, launch, send, retry, stop, reset };
}
