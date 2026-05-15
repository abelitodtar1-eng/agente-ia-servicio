import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, verifyPassword, createSession, updateLastLogin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Credenciales requeridas" }, { status: 400 });
  }

  const user = getUserByUsername(String(username));
  if (!user) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  const ok = await verifyPassword(String(password), user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
  }

  const token = createSession(user.id);
  updateLastLogin(user.id);

  const res = NextResponse.json({ username: user.username, role: user.role });
  res.cookies.set("dtar_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  return res;
}
