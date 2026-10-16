import { describe, expect, it } from "vitest";
import type { LaunchInput } from "../lib/schemas";
import { checkLaunch, G0 } from "../lib/tools/checkLaunch";
import { showRocket } from "../lib/tools/showRocket";

/** Dois estágios que passam em todas as regras para LEO. */
const healthy = (): LaunchInput => ({
  name: "Turquesa-1",
  stages: [
    { dryMassKg: 25_000, propellantMassKg: 400_000, thrustN: 7_600_000, ispSeconds: 300, engineCount: 9 },
    { dryMassKg: 8_000, propellantMassKg: 100_000, thrustN: 980_000, ispSeconds: 348, engineCount: 1 },
  ],
  payloadMassKg: 5_000,
  targetOrbit: "LEO",
  hasFins: true,
});

const statusOf = (r: ReturnType<typeof checkLaunch>, id: string) => r.parts.find((p) => p.id === id)?.status;

describe("checkLaunch", () => {
  it("aprova um foguete saudável", () => {
    const r = checkLaunch(healthy());
    expect(r.canLaunch).toBe(true);
    expect(r.parts.every((p) => p.status === "ok")).toBe(true);
    expect(r.metrics.twr).toBeGreaterThan(1.2);
    expect(r.metrics.deltaVMs).toBeGreaterThan(r.metrics.requiredDeltaVMs);
  });

  it("regra 1: TWR 0,9 reprova e marca os motores", () => {
    const input = healthy();
    const totalMass = 25_000 + 400_000 + 8_000 + 100_000 + 5_000;
    input.stages[0].thrustN = 0.9 * totalMass * G0;
    const r = checkLaunch(input);
    expect(r.metrics.twr).toBeCloseTo(0.9, 5);
    expect(r.canLaunch).toBe(false);
    expect(statusOf(r, "stage-1-engines")).toBe("fail");
  });

  it("regra 1: TWR exatamente 1,2 não basta (precisa ser maior)", () => {
    const input = healthy();
    const totalMass = 538_000;
    input.stages[0].thrustN = 1.2 * totalMass * G0;
    expect(statusOf(checkLaunch(input), "stage-1-engines")).toBe("fail");
  });

  it("regra 2: Δv calculado pela equação do foguete, estágio a estágio", () => {
    const r = checkLaunch(healthy());
    const s1 = 300 * G0 * Math.log(538_000 / 138_000);
    const s2 = 348 * G0 * Math.log(113_000 / 13_000);
    expect(r.metrics.stageDeltaVMs[0]).toBeCloseTo(s1, 6);
    expect(r.metrics.stageDeltaVMs[1]).toBeCloseTo(s2, 6);
    expect(r.metrics.deltaVMs).toBeCloseTo(s1 + s2, 6);
  });

  it("regra 2: Δv insuficiente para a Lua reprova os tanques", () => {
    const r = checkLaunch({ ...healthy(), targetOrbit: "Moon", payloadMassKg: 40_000 });
    expect(r.metrics.requiredDeltaVMs).toBe(12_500);
    expect(r.canLaunch).toBe(false);
    expect(statusOf(r, "stage-1-tank")).toBe("fail");
    expect(statusOf(r, "stage-2-tank")).toBe("fail");
  });

  it("regra 3: fração de propelente fora de 50–95% reprova só aquele tanque", () => {
    const input = healthy();
    input.stages[1] = { ...input.stages[1], dryMassKg: 60_000, propellantMassKg: 50_000 };
    const r = checkLaunch({ ...input, targetOrbit: "LEO" });
    expect(r.metrics.propellantFractions[1]).toBeLessThan(0.5);
    expect(statusOf(r, "stage-2-tank")).toBe("fail");
    expect(r.parts.find((p) => p.id === "stage-2-tank")?.reason).toMatch(/Fração de propelente/);
  });

  it("regra 3: fração acima de 95% também reprova", () => {
    const input = healthy();
    input.stages[0].dryMassKg = 10_000; // 400/410 ≈ 97,6%
    const r = checkLaunch(input);
    expect(r.parts.find((p) => p.id === "stage-1-tank")?.reason).toMatch(/Fração de propelente/);
  });

  it("regra 4: sem aletas reprova a estabilidade", () => {
    const r = checkLaunch({ ...healthy(), hasFins: false });
    expect(r.canLaunch).toBe(false);
    expect(statusOf(r, "fins")).toBe("fail");
    expect(r.parts.filter((p) => p.status === "fail")).toHaveLength(1);
  });

  it("regra 5: propelente acima da capacidade do tanque reprova", () => {
    const r = checkLaunch({ ...healthy(), fuelTankCapacityKg: 300_000 });
    expect(statusOf(r, "stage-1-tank")).toBe("fail");
    expect(statusOf(r, "stage-2-tank")).toBe("ok");
  });

  it("junta os motivos quando uma peça falha em mais de uma regra", () => {
    const input = healthy();
    input.stages[0].dryMassKg = 10_000;
    const r = checkLaunch({ ...input, fuelTankCapacityKg: 300_000 });
    const reason = r.parts.find((p) => p.id === "stage-1-tank")?.reason ?? "";
    expect(reason).toMatch(/Fração de propelente/);
    expect(reason).toMatch(/tanque de/);
  });
});

describe("showRocket", () => {
  it("sem checagem, todas as peças ficam neutras", () => {
    const m = showRocket({ name: "X", stageCount: 3, hasFins: false });
    expect(m.canLaunch).toBeNull();
    expect(m.parts.some((p) => p.id === "fins")).toBe(false);
    expect(m.parts.filter((p) => p.id.endsWith("-tank"))).toHaveLength(3);
  });

  it("herda as peças reprovadas da última checagem", () => {
    const check = checkLaunch({ ...healthy(), hasFins: false });
    const m = showRocket({ name: "Turquesa-1", stageCount: 2, hasFins: false }, check);
    expect(m.canLaunch).toBe(false);
    expect(m.parts.find((p) => p.id === "fins")?.status).toBe("fail");
  });
});
