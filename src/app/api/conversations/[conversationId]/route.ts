import { NextRequest, NextResponse } from "next/server";
import { deleteConversation, updateConversationName, updateConversationPhoneAlias } from "@/lib/db";

interface Ctx {
  params: Promise<{ conversationId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { conversationId } = await params;
  const id = parseInt(conversationId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  deleteConversation(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { conversationId } = await params;
  const id = parseInt(conversationId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  const body = await req.json() as { name?: string; phone_alias?: string };
  if (typeof body.name === "string") {
    updateConversationName(id, body.name);
  }
  if (typeof body.phone_alias === "string") {
    updateConversationPhoneAlias(id, body.phone_alias);
  }
  return NextResponse.json({ ok: true });
}
