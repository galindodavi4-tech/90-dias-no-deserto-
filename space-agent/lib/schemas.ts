import { z } from "zod";

/** Órbitas suportadas pela checagem v1 e o Δv necessário para cada uma (m/s). */
export const REQUIRED_DELTA_V_MS = {
  LEO: 9_400,
  GTO: 11_800,
  Moon: 12_500,
} as const;

export const TargetOrbit = z.enum(["LEO", "GTO", "Moon"]);

export const StageSchema = z.object({
  dryMassKg: z.number().positive().describe("Massa seca do estágio (estrutura + motores), em kg"),
  propellantMassKg: z.number().positive().describe("Massa de propelente do estágio, em kg"),
  thrustN: z.number().positive().describe("Empuxo total do estágio na ignição, em newtons"),
  ispSeconds: z.number().positive().describe("Impulso específico, em segundos"),
  engineCount: z.number().int().positive().describe("Número de motores do estágio"),
});

export const LaunchInputSchema = z.object({
  name: z.string().min(1).describe("Nome do foguete"),
  stages: z
    .array(StageSchema)
    .min(1)
    .max(4)
    .describe("Estágios em ordem de queima: o primeiro é o que decola"),
  payloadMassKg: z.number().nonnegative().describe("Massa da carga útil, em kg"),
  targetOrbit: TargetOrbit.describe("Destino: LEO, GTO ou Moon (injeção translunar)"),
  hasFins: z.boolean().describe("Se o foguete tem aletas"),
  fuelTankCapacityKg: z
    .number()
    .positive()
    .optional()
    .describe("Capacidade de cada tanque, em kg. Omitir se o usuário não informou"),
});

export type LaunchInput = z.infer<typeof LaunchInputSchema>;

export const PartStatus = z.enum(["ok", "fail"]);

export const PartSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: PartStatus,
  reason: z.string().optional(),
});

export type Part = z.infer<typeof PartSchema>;

export type LaunchResult = {
  canLaunch: boolean;
  summary: string;
  metrics: {
    twr: number;
    deltaVMs: number;
    requiredDeltaVMs: number;
    /** Δv de cada estágio, na ordem de queima (extensão para o gráfico). */
    stageDeltaVMs: number[];
    /** Fração de propelente de cada estágio (extensão para o medidor). */
    propellantFractions: number[];
  };
  parts: Part[];
};

export const ShowRocketInputSchema = z.object({
  name: z.string().min(1).describe("Nome do foguete a exibir"),
  stageCount: z.number().int().min(1).max(4).describe("Quantidade de estágios"),
  hasFins: z.boolean().describe("Se o foguete tem aletas"),
});

export type ShowRocketInput = z.infer<typeof ShowRocketInputSchema>;

/** O que o visualizador 3D precisa para desenhar o foguete. */
export type RocketModel = {
  name: string;
  stageCount: number;
  hasFins: boolean;
  /** null quando o foguete foi exibido sem checagem de lançamento. */
  canLaunch: boolean | null;
  parts: Part[];
};

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8_000),
});

export const ChatRequestSchema = z.object({
  messages: z
    .array(ChatMessageSchema)
    .min(1)
    .max(40)
    .refine((m) => m[0].role === "user" && m[m.length - 1].role === "user", {
      message: "A conversa deve começar e terminar com uma mensagem do usuário",
    }),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export type Source = { title: string; url: string };

/** Eventos enviados do servidor ao navegador, um JSON por linha (NDJSON). */
export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "status"; label: string }
  | { type: "launch"; result: LaunchResult }
  | { type: "rocket"; model: RocketModel }
  | { type: "sources"; sources: Source[] }
  | { type: "error"; message: string }
  | { type: "done" };
