import { buildPartList } from "../parts";
import type { LaunchResult, RocketModel, ShowRocketInput } from "../schemas";

/**
 * Monta o modelo do visualizador. Quando há uma checagem de lançamento do mesmo
 * foguete neste turno, as peças herdam os status dela (reprovadas = vermelhas).
 */
export function showRocket(input: ShowRocketInput, lastCheck?: LaunchResult): RocketModel {
  if (lastCheck) {
    const stageCount = lastCheck.metrics.stageDeltaVMs.length;
    return {
      name: input.name,
      stageCount,
      hasFins: input.hasFins,
      canLaunch: lastCheck.canLaunch,
      parts: lastCheck.parts,
    };
  }
  return {
    name: input.name,
    stageCount: input.stageCount,
    hasFins: input.hasFins,
    canLaunch: null,
    parts: buildPartList(input.stageCount, input.hasFins),
  };
}
