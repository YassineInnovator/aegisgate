import {anthropic, MODEL, handleFatal} from "../../client.js";

async function main () {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 100,
    messages: [{role: "user", content:"What is the currency of Morocco? Answer in one word"}],
  });

  console.log("=== FULL RESPONSE OBJECT ===");
  console.log(JSON.stringify(response, null, 2));

  console.log("\n=== JUST THE TEXT ===");
  for (const block of response.content){
    if (block.type === "text") {
      console.log(block.text);
    }
  }
}

main().catch(handleFatal)