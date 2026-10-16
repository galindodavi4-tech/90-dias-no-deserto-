import type { Part } from "./schemas";

/** IDs estáveis que ligam a checagem de lançamento às malhas do visualizador. */
export const partIds = {
  nose: "nose",
  fins: "fins",
  tank: (stage: number) => `stage-${stage}-tank`,
  engines: (stage: number) => `stage-${stage}-engines`,
};

/** Lista de peças de um foguete, todas "ok", na ordem de cima para baixo. */
export function buildPartList(stageCount: number, includeFins: boolean): Part[] {
  const parts: Part[] = [{ id: partIds.nose, label: "Coifa / carga útil", status: "ok" }];
  for (let s = stageCount; s >= 1; s--) {
    parts.push({ id: partIds.tank(s), label: `Tanque do estágio ${s}`, status: "ok" });
    parts.push({ id: partIds.engines(s), label: `Motores do estágio ${s}`, status: "ok" });
  }
  if (includeFins) parts.push({ id: partIds.fins, label: "Aletas", status: "ok" });
  return parts;
}
