import { notImplemented } from "@/lib/api";

/*
  TODO: Ask Nudge.
  - Server only. ANTHROPIC_API_KEY must never reach the browser.
  - Require a signed-in user and rate limit per user (this is where AI cost comes from).
  - Build the system prompt from lib/ai/prompts.ts and add the user's tracker as context.
  - Use the @anthropic-ai/sdk package (load the claude-api skill for current model ids).
  - Start with a JSON { reply } response, then move to streaming.
  The client in lib/store.tsx already POSTs { messages } here and reads { reply }.
*/
export async function POST() {
  return notImplemented("Ask Nudge");
}
