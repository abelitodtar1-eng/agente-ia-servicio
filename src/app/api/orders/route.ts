import { NextResponse } from "next/server";
import { listOrders, createOrder, countOrdersByStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  const offset = Number(searchParams.get("offset") ?? 0);
  const orders = listOrders(limit, offset);
  const counts = countOrdersByStatus();
  return NextResponse.json({ orders, counts });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.conversation_id || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "conversation_id e items requeridos" }, { status: 400 });
    }
    const order = createOrder({ conversation_id: body.conversation_id, notes: body.notes, items: body.items });
    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
