import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("dtar_session")?.value;
  if (token) deleteSession(token);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("dtar_session", "", { maxAge: 0, path: "/" });
  return res;
}
