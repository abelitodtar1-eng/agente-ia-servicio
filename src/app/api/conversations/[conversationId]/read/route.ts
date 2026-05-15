import { NextRequest, NextResponse } from "next/server";
import { markConversationRead } from "@/lib/db";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  markConversationRead(Number(conversationId));
  return NextResponse.json({ ok: true });
}
