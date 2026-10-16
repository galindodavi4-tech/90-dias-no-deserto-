import Anthropic from "@anthropic-ai/sdk";
import type {
  BetaContentBlock,
  BetaMessageParam,
  BetaToolResultBlockParam,
  BetaToolUnion,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { z } from "zod";
import {
  LaunchInputSchema,
  ShowRocketInputSchema,
  type ChatMessage,
  type LaunchResult,
  type Source,
  type StreamEvent,
} from "./schemas";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { checkLaunch } from "./tools/checkLaunch";
import { showRocket } from "./tools/showRocket";

export const MODEL = "claude-sonnet-5-5";
const MAX_ITERATIONS = 8;
const MAX_SEARCHES_PER_TURN = 3;

const toInputSchema = (schema: z.ZodType) => {
  const { $schema: _ignored, ...json } = z.toJSONSchema(schema) as Record<string, unknown>;
  return json as Anthropic.Tool.InputSchema;
};

const TOOLS: BetaToolUnion[] = [
  { type: "web_search_20260209", name: "web_search", max_uses: MAX_SEARCHES_PER_TURN },
  {
    name: "check_launch",
    description:
      "Runs the deterministic launch check for a spaceship and returns canLaunch, metrics (TWR, delta-v) and a per-part status list. Call it whenever the user describes a ship with enough specs; never judge launch feasibility yourself.",
    input_schema: toInputSchema(LaunchInputSchema),
    eager_input_streaming: true,
  },
  {
    name: "show_rocket",
    description:
      "Updates the 3D rocket viewer in the user's browser. Call it when the user asks about a rocket or right after check_launch; failed parts from the latest check are highlighted in red automatically.",
    input_schema: toInputSchema(ShowRocketInputSchema),
    eager_input_streaming: true,
  },
];

const SEARCH_LABEL = "Pesquisando na web…";

type Emit = (event: StreamEvent) => void;

/** Executa uma ferramenta local. Entrada inválida volta para o modelo como erro. */
function runTool(
  block: Extract<BetaContentBlock, { type: "tool_use" }>,
  state: { lastCheck?: LaunchResult },
  emit: Emit,
): BetaToolResultBlockParam {
  const error = (message: string): BetaToolResultBlockParam => ({
    type: "tool_result",
    tool_use_id: block.id,
    is_error: true,
    content: message,
  });

  if (block.name === "check_launch") {
    const parsed = LaunchInputSchema.safeParse(block.input);
    if (!parsed.success) return error(`Entrada inválida: ${z.prettifyError(parsed.error)}`);
    const result = checkLaunch(parsed.data);
    state.lastCheck = result;
    emit({ type: "launch", result });
    return { type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) };
  }

  if (block.name === "show_rocket") {
    const parsed = ShowRocketInputSchema.safeParse(block.input);
    if (!parsed.success) return error(`Entrada inválida: ${z.prettifyError(parsed.error)}`);
    const model = showRocket(parsed.data, state.lastCheck);
    emit({ type: "rocket", model });
    return {
      type: "tool_result",
      tool_use_id: block.id,
      content: `Visualizador atualizado com ${model.parts.length} peças.`,
    };
  }

  return error(`Ferramenta desconhecida: ${block.name}`);
}

/** Junta as fontes citadas nas respostas que usaram busca, sem repetir URL. */
function collectSources(content: BetaContentBlock[], into: Map<string, Source>) {
  for (const block of content) {
    if (block.type !== "text" || !block.citations) continue;
    for (const c of block.citations) {
      if (c.type === "web_search_result_location" && !into.has(c.url)) {
        into.set(c.url, { title: c.title ?? c.url, url: c.url });
      }
    }
  }
}

/**
 * Loop do agente: manda a conversa ao Claude, executa as ferramentas locais que
 * ele pedir, devolve os resultados e repete até a resposta final. O texto sai
 * em tempo real pelo `emit`.
 */
export async function runAgent(history: ChatMessage[], emit: Emit, signal?: AbortSignal) {
  const client = new Anthropic();
  const messages: BetaMessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  const state: { lastCheck?: LaunchResult } = {};
  const sources = new Map<string, Source>();

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const stream = client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 16_000,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
        output_config: { effort: "medium" },
        // Se o modelo recusar por política, o servidor tenta o substituto recomendado.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      },
      { signal },
    );

    stream.on("text", (delta) => emit({ type: "text", delta }));
    stream.on("streamEvent", (event) => {
      if (event.type !== "content_block_start") return;
      const block = event.content_block;
      if (block.type === "server_tool_use") emit({ type: "status", label: SEARCH_LABEL });
      if (block.type === "tool_use") {
        emit({
          type: "status",
          label: block.name === "check_launch" ? "Checando o lançamento…" : "Montando o foguete 3D…",
        });
      }
    });

    const message = await stream.finalMessage();
    collectSources(message.content, sources);

    if (message.stop_reason === "refusal") {
      emit({ type: "error", message: "O modelo recusou este pedido." });
      break;
    }
    // A busca no servidor atingiu o limite de passos: reenviar retoma de onde parou.
    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }

    const toolUses = message.content.filter(
      (b): b is Extract<BetaContentBlock, { type: "tool_use" }> => b.type === "tool_use",
    );
    if (toolUses.length === 0) break;
    if (message.stop_reason === "max_tokens") {
      emit({ type: "error", message: "A resposta foi cortada antes de terminar a ferramenta." });
      break;
    }

    messages.push({ role: "assistant", content: message.content });
    messages.push({ role: "user", content: toolUses.map((b) => runTool(b, state, emit)) });
    // Separa visualmente o texto antes e depois das ferramentas.
    emit({ type: "text", delta: "\n\n" });
  }

  if (sources.size > 0) emit({ type: "sources", sources: [...sources.values()] });
}
