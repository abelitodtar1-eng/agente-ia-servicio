import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("dtar_session")?.value ?? "";
  const user = getSessionUser(token);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  return NextResponse.json({ id: user.id, username: user.username, role: user.role });
}
