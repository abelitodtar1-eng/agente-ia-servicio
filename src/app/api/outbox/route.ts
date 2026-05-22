import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getOrCreateConversation, insertMessage, enqueueOutbox } from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") || "";
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const { phone, message } = JSON.parse(rawBody);
  if (!phone?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "phone y message requeridos" }, { status: 400 });
  }

  const conv = getOrCreateConversation(phone);
  insertMessage(conv.id, "assistant", message.trim());
  enqueueOutbox(conv.id, phone, message.trim());

  return NextResponse.json({ ok: true });
}
