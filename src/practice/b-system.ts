import { anthropic, MODEL, handleFatal } from "../../client.js";

const SYSTEM = "You only answer questions about cooking. Politely refuse anything else.";
const RUNS = 10;

async function main() {
  let refused = 0;

  for (let i = 1; i <= RUNS; i++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 60,
      system: SYSTEM,
      messages: [{ role: "user", content: "What is Docker?" }],
    });

    let text = "";
    for (const block of response.content) {
      if (block.type === "text") text += block.text;
    }

    const isRefusal = /sorry|can't|cannot|only answer/i.test(text);
    if (isRefusal) refused++;

    console.log(`Run ${i}: ${isRefusal ? "REFUSED " : "ANSWERED"} | ${text.slice(0, 60)}...`);
  }

  console.log(`\nRefusal rate: ${refused}/${RUNS} (${Math.round((refused / RUNS) * 100)}%)`);
}

main().catch(handleFatal);