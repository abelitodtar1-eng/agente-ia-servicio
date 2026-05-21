import { NextRequest, NextResponse } from "next/server";
import { updateQuickReply, deleteQuickReply } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, content, category, sort_order } = body;
  updateQuickReply(Number(id), { title, content, category, sort_order });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteQuickReply(Number(id));
  return NextResponse.json({ ok: true });
}
