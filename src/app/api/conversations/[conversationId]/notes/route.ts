import { NextRequest, NextResponse } from "next/server";
import { getNotesByConversation, insertNote, deleteNote } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const notes = getNotesByConversation(Number(conversationId));
  return NextResponse.json(notes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const token = req.cookies.get("dtar_session")?.value ?? "";
  const user = getSessionUser(token);
  if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "content requerido" }, { status: 400 });
  const note = insertNote(Number(conversationId), user.id, user.username, content.trim());
  return NextResponse.json(note, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  await params;
  const { noteId } = await req.json();
  if (!noteId) return NextResponse.json({ error: "noteId requerido" }, { status: 400 });
  deleteNote(Number(noteId));
  return NextResponse.json({ ok: true });
}
