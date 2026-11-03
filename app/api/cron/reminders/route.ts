import { NextResponse } from "next/server";
import { notImplemented } from "@/lib/api";

/*
  TODO: daily reminder job, triggered by Vercel Cron (see vercel.json).
  - Vercel sends `Authorization: Bearer ${CRON_SECRET}`. Reject anything else.
  - Find users with applications where isDue() is true (lib/services/applications.ts)
    and send a digest. Remember: "Needs a nudge" is derived, never written to the database.
*/
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return notImplemented("Reminders");
}
