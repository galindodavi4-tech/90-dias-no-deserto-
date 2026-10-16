import { buildPartList, partIds } from "../parts";
import { REQUIRED_DELTA_V_MS, type LaunchInput, type LaunchResult, type Part } from "../schemas";

export const G0 = 9.81;
export const MIN_TWR = 1.2;
export const MIN_PROPELLANT_FRACTION = 0.5;
export const MAX_PROPELLANT_FRACTION = 0.95;

const fmt = (n: number, digits = 0) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits });

/**
 * Checagem simplificada de lançamento (regras v1 do PRD). Determinística: o
 * modelo nunca decide o veredito, só chama esta função e explica o resultado.
 * Regras educativas — não é análise real de segurança de voo.
 */
export function checkLaunch(input: LaunchInput): LaunchResult {
  const { stages, payloadMassKg, targetOrbit } = input;
  const failures = new Map<string, string[]>();
  const fail = (id: string, reason: string) => {
    failures.set(id, [...(failures.get(id) ?? []), reason]);
  };

  const stageMass = stages.map((s) => s.dryMassKg + s.propellantMassKg);
  const totalMassKg = stageMass.reduce((a, b) => a + b, 0) + payloadMassKg;

  // 1. Empuxo/peso na decolagem.
  const twr = stages[0].thrustN / (totalMassKg * G0);
  if (twr <= MIN_TWR) {
    fail(
      partIds.engines(1),
      `Empuxo/peso de ${fmt(twr, 2)} na decolagem; precisa ser maior que ${fmt(MIN_TWR, 1)}.`,
    );
  }

  // 2. Orçamento de Δv: cada estágio empurra a si mesmo, os de cima e a carga.
  const stageDeltaVMs = stages.map((stage, i) => {
    const m0 = stageMass.slice(i).reduce((a, b) => a + b, 0) + payloadMassKg;
    const mf = m0 - stage.propellantMassKg;
    return stage.ispSeconds * G0 * Math.log(m0 / mf);
  });
  const deltaVMs = stageDeltaVMs.reduce((a, b) => a + b, 0);
  const requiredDeltaVMs = REQUIRED_DELTA_V_MS[targetOrbit];
  if (deltaVMs < requiredDeltaVMs) {
    const reason = `Δv total de ${fmt(deltaVMs)} m/s; ${targetOrbit} pede ~${fmt(requiredDeltaVMs)} m/s.`;
    stages.forEach((_, i) => fail(partIds.tank(i + 1), reason));
  }

  // 3. Fração de propelente de cada estágio.
  const propellantFractions = stages.map((s, i) => s.propellantMassKg / stageMass[i]);
  propellantFractions.forEach((f, i) => {
    if (f < MIN_PROPELLANT_FRACTION || f > MAX_PROPELLANT_FRACTION) {
      fail(
        partIds.tank(i + 1),
        `Fração de propelente de ${fmt(f * 100)}%; o razoável fica entre ${fmt(MIN_PROPELLANT_FRACTION * 100)}% e ${fmt(MAX_PROPELLANT_FRACTION * 100)}%.`,
      );
    }
  });

  // 4. Estabilidade: na v1, sem aletas reprova.
  if (!input.hasFins) {
    fail(partIds.fins, "Sem aletas o foguete não passa na checagem de estabilidade.");
  }

  // 5. Capacidade do tanque (vale para o tanque de cada estágio).
  if (input.fuelTankCapacityKg !== undefined) {
    const capacity = input.fuelTankCapacityKg;
    stages.forEach((s, i) => {
      if (s.propellantMassKg > capacity) {
        fail(
          partIds.tank(i + 1),
          `Leva ${fmt(s.propellantMassKg)} kg de propelente num tanque de ${fmt(capacity)} kg.`,
        );
      }
    });
  }

  // As aletas aparecem sempre: quando faltam, o visualizador mostra o vazio em vermelho.
  const parts: Part[] = buildPartList(stages.length, true).map((part) => {
    const reasons = failures.get(part.id);
    return reasons ? { ...part, status: "fail", reason: reasons.join(" ") } : part;
  });

  const failed = parts.filter((p) => p.status === "fail");
  const canLaunch = failed.length === 0;
  const summary = canLaunch
    ? `${input.name} pode lançar para ${targetOrbit}: empuxo/peso ${fmt(twr, 2)} e Δv ${fmt(deltaVMs)} m/s (precisa ~${fmt(requiredDeltaVMs)}).`
    : `${input.name} não pode lançar. Falhou em: ${failed.map((p) => p.label.toLowerCase()).join(", ")}.`;

  return {
    canLaunch,
    summary,
    metrics: { twr, deltaVMs, requiredDeltaVMs, stageDeltaVMs, propellantFractions },
    parts,
  };
}
