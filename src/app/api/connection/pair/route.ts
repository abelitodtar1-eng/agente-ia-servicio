import { NextResponse } from "next/server";
import { requestPairing } from "@/lib/baileys/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const cleaned = String(phone ?? "").replace(/[^0-9]/g, "");
    if (!cleaned) return NextResponse.json({ error: "Teléfono requerido" }, { status: 400 });
    const code = await requestPairing(cleaned);
    return NextResponse.json({ code });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
