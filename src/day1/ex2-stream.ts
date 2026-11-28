import { anthropic, MODEL, handleFatal } from "../../client.js";

const TTFT_BUDGET_MS = 20_000; // no first token within budget => abort (Phase 2: fall back to next provider)

async function streamOnce(label: string) {
  const startedAt = performance.now();
  let firstTokenAt: number | null = null;
  const seenEvents = new Set<string>();

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 300,
    system: "Answer concisely in 3 short bullet points.",
    messages: [{ role: "user", content: "Why is streaming important in production LLM apps?" }],
  });

  const ttftGuard = setTimeout(() => stream.abort(), TTFT_BUDGET_MS);

  stream.on("streamEvent", (event) => seenEvents.add(event.type));
  stream.on("text", (delta) => {
    if (firstTokenAt === null) {
      firstTokenAt = performance.now();
      clearTimeout(ttftGuard);
    }
    process.stdout.write(delta);
  });

  try {
    const finalMessage = await stream.finalMessage();
    const totalMs = Math.round(performance.now() - startedAt);
    const ttftMs = firstTokenAt === null ? null : Math.round(firstTokenAt - startedAt);
    const genSec = ttftMs === null ? 0 : (totalMs - ttftMs) / 1000;
    const tokPerSec = genSec > 0 ? finalMessage.usage.output_tokens / genSec : 0;

    console.log(`\n\n--- ${label} ---`);
    console.log("SSE events:", [...seenEvents].join(" -> "));
    console.log(`TTFT: ${ttftMs ?? "n/a"} ms | Total: ${totalMs} ms | ~${tokPerSec.toFixed(1)} tok/s`);
    console.log("Stop reason:", finalMessage.stop_reason, "| Usage:", finalMessage.usage);
  } finally {
    clearTimeout(ttftGuard);
  }
}

async function run() {
  // Run twice: the first call may include loading the model into RAM (cold start).
  await streamOnce("RUN 1 (maybe cold)");
  await streamOnce("RUN 2 (warm)");
}

run().catch(handleFatal);