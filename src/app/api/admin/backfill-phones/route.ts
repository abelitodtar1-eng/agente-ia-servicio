import { NextResponse } from "next/server";
import { backfillPhoneAliases } from "@/lib/db";

export async function POST() {
  const updated = backfillPhoneAliases();
  return NextResponse.json({ updated });
}
