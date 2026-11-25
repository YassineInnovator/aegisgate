import { anthropic, MODEL } from "../client.js";

async function run() {
  const startedAt = performance.now();
  let firstTokenAt: number | null = null;
  const seenEvents = new Set<string>();

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 300,
    system: "Answer concisely in 3 short bullet points.",
    messages: [
      {
        role: "user",
        content: "Why is streaming important in production LLM apps?",
      },
    ],
  });

  // Inspect raw SSE lifecycle events
  stream.on("streamEvent", (event) => {
    seenEvents.add(event.type);
  });

  // Print text deltas immediately as they arrive
  stream.on("text", (delta) => {
    if (firstTokenAt === null) {
      firstTokenAt = performance.now();
    }
    process.stdout.write(delta);
  });

  const finalMessage = await stream.finalMessage();
  const totalMs = Math.round(performance.now() - startedAt);
  const ttftMs = firstTokenAt ? Math.round(firstTokenAt - startedAt) : -1;
  const tokPerSec =
    finalMessage.usage.output_tokens / ((totalMs - ttftMs) / 1000 || 1);

  console.log("\n\n--- STREAM TELEMETRY ---");
  console.log("SSE Events seen:", [...seenEvents].join(" -> "));
  console.log(`TTFT: ${ttftMs} ms | Total: ${totalMs} ms | Speed: ${tokPerSec.toFixed(1)} tok/s`);
  console.log("Stop reason:", finalMessage.stop_reason);
  console.log("Usage:", finalMessage.usage);
}

run().catch(console.error);