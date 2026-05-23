import { NextResponse } from "next/server";
import { getUserByUsername, verifyPassword, createSession, updateLastLogin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Usuario y contraseña requeridos" }, { status: 400 });
    }

    const user = getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const token = createSession(user.id);
    updateLastLogin(user.id);

    const res = NextResponse.json({ ok: true });
    res.cookies.set("dtar_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
