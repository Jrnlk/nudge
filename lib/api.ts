import { NextResponse } from "next/server";

/** Placeholder response for routes that are scaffolded but not built yet. */
export const notImplemented = (what: string) =>
  NextResponse.json({ error: `${what} is not built yet.` }, { status: 501 });
