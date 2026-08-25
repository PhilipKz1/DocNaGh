import { NextResponse } from "next/server";
import { purgeExpiredDocuments } from "@/lib/retention";

/**
 * Triggered on a schedule (see vercel.json) to enforce document retention.
 * Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET` for
 * routes listed there; anyone else calling this without the matching
 * secret is rejected before touching the database.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await purgeExpiredDocuments();
  return NextResponse.json(result);
}
