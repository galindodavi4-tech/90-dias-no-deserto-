import { MAX_PROPELLANT_FRACTION, MIN_PROPELLANT_FRACTION, MIN_TWR } from "@/lib/tools/checkLaunch";
import type { LaunchResult } from "@/lib/schemas";
import { AreaChart } from "./ui/AreaChart";
import { Card, CardTitle } from "./ui/Card";
import { DonutGauge } from "./ui/DonutGauge";
import { StarIcon, UserIcon } from "./ui/icons";
import { MeterBars } from "./ui/MeterBars";

const fmt = (n: number, d = 0) => n.toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d });

/** Os três anéis: empuxo/peso, Δv atingido e peças aprovadas. */
export function GaugesCard({ launch }: { launch: LaunchResult | null }) {
  const m = launch?.metrics;
  const okParts = launch ? launch.parts.filter((p) => p.status === "ok").length / launch.parts.length : 0;
  return (
    <Card>
      <CardTitle>Checagem</CardTitle>
      <div className="flex justify-around gap-2">
        <DonutGauge
          label="TWR"
          value={m ? fmt(m.twr, 2) : "—"}
          fraction={m ? m.twr / (MIN_TWR * 2) : 0}
          color="var(--color-coral)"
          colorTo="var(--color-peach)"
          danger={!!m && m.twr <= MIN_TWR}
        />
        <DonutGauge
          label="Δv"
          value={m ? `${fmt((m.deltaVMs / m.requiredDeltaVMs) * 100)}%` : "—"}
          fraction={m ? m.deltaVMs / m.requiredDeltaVMs : 0}
          color="var(--color-lavender)"
          colorTo="#6c5ce7"
          danger={!!m && m.deltaVMs < m.requiredDeltaVMs}
        />
        <DonutGauge
          label="Peças ok"
          value={launch ? `${fmt(okParts * 100)}%` : "—"}
          fraction={okParts}
          color="var(--color-primary-300)"
          colorTo="var(--color-primary-600)"
        />
      </div>
    </Card>
  );
}

/** Δv acumulado por estágio contra o Δv que a órbita pede. */
export function DeltaVCard({ launch }: { launch: LaunchResult | null }) {
  const stages = launch?.metrics.stageDeltaVMs ?? [3200, 4100, 2600];
  const cumulative = stages.reduce<number[]>((acc, v) => [...acc, (acc.at(-1) ?? 0) + v], [0]);
  const perStage = [0, ...stages];
  return (
    <Card>
      <CardTitle right={launch && <span className="text-xs text-ink-faint">meta {fmt(launch.metrics.requiredDeltaVMs)} m/s</span>}>
        Orçamento de Δv
      </CardTitle>
      <div className={launch ? "" : "opacity-40"}>
        <AreaChart
          labels={cumulative.map((_, i) => (i === 0 ? "solo" : `E${i}`))}
          series={[
            { values: cumulative, from: "#6eeadf", to: "#0f8f86" },
            { values: perStage, from: "#ffc29a", to: "#f47b6b" },
          ]}
          target={launch ? { value: launch.metrics.requiredDeltaVMs, label: "necessário" } : undefined}
          caption={launch ? "Acumulado (turquesa) e por estágio" : "Aguardando uma checagem"}
          unit="m/s"
        />
      </div>
    </Card>
  );
}

/** Fração de propelente de cada estágio, com a faixa aceitável marcada. */
export function PropellantCard({ launch }: { launch: LaunchResult | null }) {
  const fractions = launch?.metrics.propellantFractions ?? [];
  return (
    <Card className="flex flex-col items-center">
      <CardTitle>Propelente</CardTitle>
      {fractions.length > 0 ? (
        <MeterBars
          min={MIN_PROPELLANT_FRACTION}
          max={MAX_PROPELLANT_FRACTION}
          bars={fractions.map((f, i) => ({
            label: `E${i + 1}`,
            fraction: f,
            danger: f < MIN_PROPELLANT_FRACTION || f > MAX_PROPELLANT_FRACTION,
          }))}
        />
      ) : (
        <p className="py-10 text-center text-xs text-ink-faint">A fração de cada estágio aparece depois da checagem.</p>
      )}
    </Card>
  );
}

/** Cartão de perfil do kit, virou o cartão do agente. */
export function AgentCard() {
  return (
    <Card className="flex flex-col justify-between gap-6">
      <div className="flex gap-4">
        <span className="ds-gradient-primary grid size-16 shrink-0 place-items-center rounded-2xl shadow-[var(--shadow-glow)]">
          <UserIcon />
        </span>
        <div>
          <p className="text-lg font-semibold">Space Agent</p>
          <p className="text-xs leading-relaxed text-ink-muted">
            Espaço, foguetes e tendências de mercado. Vereditos de lançamento vêm de cálculo, não de palpite.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="ds-label">Tópicos</span>
        <span className="flex items-center gap-2 text-2xl font-semibold">
          4 <StarIcon />
        </span>
      </div>
    </Card>
  );
}
