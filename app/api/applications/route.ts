import { notImplemented } from "@/lib/api";

/*
  TODO: applications CRUD.
  - Get the user from lib/auth.ts and 401 if there is none.
  - EVERY query must filter by user_id. No exceptions.
  - Validate bodies (zod is a good fit). `status` must be a stored Status, never "Needs a nudge".
  - Add app/api/applications/[id]/route.ts for PATCH and DELETE.
*/
export async function GET() {
  return notImplemented("Listing applications");
}

export async function POST() {
  return notImplemented("Creating applications");
}
