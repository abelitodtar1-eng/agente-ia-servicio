import { NextRequest, NextResponse } from "next/server";
import { getAdminPhone, setAdminPhone } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ phone: getAdminPhone() });
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json() as { phone?: string };
  setAdminPhone(phone ?? "");
  return NextResponse.json({ ok: true });
}
