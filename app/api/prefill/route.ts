import { NextResponse } from "next/server";
import { parseJobUrl } from "@/lib/services/prefill";

/**
 * POST { url } -> { company?, role?, location? }
 * This one works already because it only reads the URL text and never fetches it.
 * TODO: require a signed-in user and rate limit it.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.url !== "string") {
    return NextResponse.json({ error: "Send a url." }, { status: 400 });
  }
  try {
    return NextResponse.json(parseJobUrl(body.url.trim()));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
