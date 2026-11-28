import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const baseURL = process.env.ANTHROPIC_BASE_URL;
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!baseURL || !apiKey) {
  throw new Error(
    `Missing env vars. Make sure .env exists in ${process.cwd()} with ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY.`
  );
}

export const MODEL = process.env.MODEL_NAME ?? "qwen2.5:3b";

export const anthropic = new Anthropic({
  baseURL,
  apiKey,
  maxRetries: 0, // retries + fallback are the gateway's job (Phase 2), not hidden SDK behaviour
  timeout: 60_000, // SDK default is 10 min: a hung local model must fail fast
});

// Order matters: APIUserAbortError and APIConnectionError both EXTEND APIError,
// so the specific subclasses must be checked first.
export function handleFatal(err: unknown): void {
  if (err instanceof Anthropic.APIUserAbortError) {
    console.error("[ABORTED] Request cancelled by our code (timeout budget or client disconnect).");
  } else if (err instanceof Anthropic.APIConnectionError) {
    console.error("[CONNECTION] Provider unreachable or timed out. Is Ollama running?");
  } else if (err instanceof Anthropic.APIError) {
    console.error(`[API ${err.status}] ${err.message}`);
  } else {
    console.error("[UNKNOWN]", err);
  }
  process.exitCode = 1; // so CI / scripts see the failure
}