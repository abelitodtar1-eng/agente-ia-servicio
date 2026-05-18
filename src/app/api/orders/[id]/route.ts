import { NextResponse } from "next/server";
import { getOrder, updateOrderStatus, deleteOrder, OrderStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(_: Request, { params }: { params: { id: string } }) {
  const order = getOrder(Number(params.id));
  if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status, payment_id } = await req.json();
    const valid: OrderStatus[] = ["draft", "confirmed", "paid", "shipped", "cancelled"];
    if (!valid.includes(status)) return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    updateOrderStatus(Number(params.id), status, payment_id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export function DELETE(_: Request, { params }: { params: { id: string } }) {
  const order = getOrder(Number(params.id));
  if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (order.status !== "draft") return NextResponse.json({ error: "Solo se pueden eliminar pedidos en borrador" }, { status: 400 });
  deleteOrder(Number(params.id));
  return NextResponse.json({ ok: true });
}
