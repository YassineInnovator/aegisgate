// ex3-tools-zod.ts: Phase 1 / AEG-3, tool-use loop + Zod validation
// Run: npx tsx src/day1/ex3-tools-zod.ts
//
// SPEC (acceptance criteria)
//  AC1  One tool (get_server_metrics). Its JSON schema is generated FROM the Zod schema (single source of truth).
//  AC2  Every tool input from the model is validated with Zod BEFORE the tool runs.
//  AC3  Invalid input -> tool_result with is_error: true + a clear message, so the model can correct itself.
//  AC4  tool_result blocks are sent back inside a role: "user" message, matched by tool_use_id.
//  AC5  The loop stops on end_turn, on max_tokens (flagged), or after MAX_TURNS (no infinite loops).

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { anthropic, MODEL, handleFatal } from "../../client.js";

const MAX_TURNS = 5;

// 1) The RULES for the tool's input, written once with Zod.
const MetricsInput = z.object({
  host: z
    .string()
    .regex(/^[a-z]+-\d{2}$/, "host must look like 'api-01' (lowercase letters, dash, 2 digits)")
    .describe("Server name, for example 'api-01' or 'db-02'"),
});
type MetricsInput = z.infer<typeof MetricsInput>;

// 2) The tool description the MODEL sees. Its schema is generated from the Zod rules (AC1).
const tools: Anthropic.Tool[] = [
  {
    name: "get_server_metrics",
    description: "Get current CPU %, memory % and status for one server. Use it to check server health.",
    input_schema: z.toJSONSchema(MetricsInput) as Anthropic.Tool.InputSchema,
  },
];

// 3) The real function (fake data for now; in Phase 4 this becomes a real data source).
const FAKE_METRICS: Record<string, { cpu: number; memory: number; status: string }> = {
  "api-01": { cpu: 95, memory: 71, status: "degraded" },
  "db-02": { cpu: 38, memory: 97, status: "disk_full" },
};

function getServerMetrics(input: MetricsInput) {
  const metrics = FAKE_METRICS[input.host];
  if (!metrics) return { error: `Unknown host '${input.host}'. Known hosts: ${Object.keys(FAKE_METRICS).join(", ")}` };
  return { host: input.host, ...metrics };
}

// 4) Run ONE tool call safely: validate first, then execute (AC2, AC3).
function runTool(block: Anthropic.ToolUseBlock): Anthropic.ToolResultBlockParam {
  if (block.name !== "get_server_metrics") {
    return { type: "tool_result", tool_use_id: block.id, is_error: true, content: `Unknown tool '${block.name}'` };
  }

  const parsed = MetricsInput.safeParse(block.input);
  if (!parsed.success) {  
    const reason = parsed.error.issues.map((i) => i.message).join("; ");
    console.log(`   [ZOD REJECTED] input=${JSON.stringify(block.input)} -> ${reason}`);
    return { type: "tool_result", tool_use_id: block.id, is_error: true, content: `Invalid input: ${reason}` };
  }

  const result = getServerMetrics(parsed.data);
  console.log(`   [TOOL RAN] get_server_metrics(${JSON.stringify(parsed.data)}) -> ${JSON.stringify(result)}`);
  return { type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) };
}

// 5) The loop: ask -> (tool_use -> run -> send result back)* -> final answer (AC4, AC5).
async function chat(question: string) {
  console.log(`\n=== QUESTION: ${question} ===`);
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: question }];

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: "You are an ops assistant. Use the get_server_metrics tool to check servers. Never invent metrics.",
      tools,
      messages,
    });
    console.log(` turn ${turn}: stop_reason=${response.stop_reason}`);

    if (response.stop_reason === "tool_use") {
      // Keep the model's message (with its tool_use blocks) in the history...
      messages.push({ role: "assistant", content: response.content });
      // ...run every tool call it asked for...
      const results = response.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
        .map(runTool);
      // ...and send the results back as a USER message.
      messages.push({ role: "user", content: results });
      continue;
    }

    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    if (response.stop_reason === "max_tokens") console.warn(" [TRUNCATED] final answer was cut off.");
    console.log(` ANSWER: ${text}`);
    return;
  }

  console.warn(` [STOPPED] reached MAX_TURNS=${MAX_TURNS} without a final answer.`);
}

async function run() {
  await chat("Is api-01 healthy right now?");
  await chat("Check the server called DB 2 and tell me what's wrong.");
  await chat("How is the server cache-07 doing?");
}

run().catch(handleFatal);