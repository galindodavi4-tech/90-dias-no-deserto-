"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Chat } from "@/components/Chat";
import { AgentCard, DeltaVCard, GaugesCard, PropellantCard } from "@/components/Dashboard";
import type { RocketViewerHandle } from "@/components/RocketViewer";
import { useSpaceAgent } from "@/components/useSpaceAgent";
import { buildPartList } from "@/lib/parts";
import type { RocketModel } from "@/lib/schemas";
import { Card, CardTitle } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { HomeIcon, PlusIcon, ReturnIcon } from "@/components/ui/icons";
import { Slider } from "@/components/ui/Slider";
import { StatPill } from "@/components/ui/StatPill";

const RocketViewer = dynamic(() => import("@/components/RocketViewer").then((m) => m.RocketViewer), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-ink-faint">Carregando 3D…</div>,
});

const DEMO_ROCKET: RocketModel = {
  name: "Demonstração",
  stageCount: 2,
  hasFins: true,
  canLaunch: null,
  parts: buildPartList(2, true),
};

export default function Home() {
  const agent = useSpaceAgent();
  const [spread, setSpread] = useState(0.15);
  const viewer = useRef<RocketViewerHandle>(null);
  const rocket = agent.rocket ?? DEMO_ROCKET;
  const failed = rocket.parts.filter((p) => p.status === "fail");

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="ds-gradient-primary grid size-11 place-items-center rounded-2xl text-lg font-bold text-bg-deep shadow-[var(--shadow-glow)]">
            ✦
          </span>
          <div>
            <h1 className="text-xl font-semibold leading-tight">Space Agent</h1>
            <p className="text-xs text-ink-muted">Espaço · Lançamento · Mercado · 3D</p>
          </div>
        </div>
        <nav className="flex gap-3" aria-label="Ações">
          <IconButton label="Nova conversa" onClick={agent.reset}>
            <PlusIcon />
          </IconButton>
          <IconButton label="Refazer a última pergunta" onClick={agent.retry} disabled={agent.busy || agent.messages.length === 0}>
            <ReturnIcon />
          </IconButton>
          <IconButton label="Recentralizar o foguete" onClick={() => viewer.current?.resetCamera()}>
            <HomeIcon />
          </IconButton>
        </nav>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(340px,430px)_minmax(0,1fr)]">
        <Chat messages={agent.messages} busy={agent.busy} status={agent.status} onSend={agent.send} onStop={agent.stop} />

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <Card className="flex flex-col xl:row-span-2">
            <CardTitle
              right={
                rocket.canLaunch === null ? (
                  <StatPill tone="neutral">Sem checagem</StatPill>
                ) : rocket.canLaunch ? (
                  <StatPill tone="primary">✓ Pode lançar</StatPill>
                ) : (
                  <StatPill tone="danger">✕ Não lança</StatPill>
                )
              }
            >
              {rocket.name}
            </CardTitle>
            <div className="relative h-[340px] overflow-hidden rounded-2xl sm:h-[420px]">
              <RocketViewer ref={viewer} model={rocket} spread={spread} />
            </div>
            {failed.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs">
                {failed.map((p) => (
                  <li key={p.id} className="flex gap-2">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-danger" />
                    <span>
                      <strong className="text-ink">{p.label}:</strong> <span className="text-ink-muted">{p.reason}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-center gap-3">
              <span className="ds-label shrink-0">Explodir</span>
              <div className="flex-1">
                <Slider label="separação das peças" value={spread} min={0} max={1.2} onChange={setSpread} />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-ink-faint">
              Arraste para girar, role para dar zoom, passe o cursor numa peça para ver o status. Regras simplificadas e
              educativas — não é aprovação de engenharia real.
            </p>
          </Card>

          <AgentCard />
          <PropellantCard launch={agent.launch} />
          <GaugesCard launch={agent.launch} />
          <DeltaVCard launch={agent.launch} />
        </div>
      </div>
    </main>
  );
}
