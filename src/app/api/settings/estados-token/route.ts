import { NextResponse } from "next/server";
import { getEstadosApiToken } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ token: getEstadosApiToken() });
}
