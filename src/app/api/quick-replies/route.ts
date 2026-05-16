import { NextRequest, NextResponse } from "next/server";
import { listQuickReplies, createQuickReply } from "@/lib/db";

export async function GET() {
  return NextResponse.json(listQuickReplies());
}

export async function POST(req: NextRequest) {
  const { title, content, category = "General" } = await req.json();
  if (!title?.trim() || !content?.trim())
    return NextResponse.json({ error: "title y content requeridos" }, { status: 400 });
  const qr = createQuickReply({ title: title.trim(), content: content.trim(), category });
  return NextResponse.json(qr, { status: 201 });
}
