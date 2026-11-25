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
export const anthropic = new Anthropic({ baseURL, apiKey });