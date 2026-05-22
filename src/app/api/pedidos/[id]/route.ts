import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPedido, updatePedidoEstado, getInventarioWebhookUrl } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(req.cookies.get("dtar_session")?.value ?? "");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const pedidoId = Number(id);
  const { estado } = await req.json() as { estado: "confirmado" | "rechazado" };

  if (!["confirmado", "rechazado"].includes(estado)) {
    return NextResponse.json({ error: "estado inválido" }, { status: 400 });
  }

  const pedido = getPedido(pedidoId);
  if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  const updated = updatePedidoEstado(pedidoId, estado);

  if (estado === "confirmado") {
    const webhookUrl = process.env.N8N_WEBHOOK_INVENTARIO || getInventarioWebhookUrl();
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "salida",
          code: pedido.id_servicio,
          qty: 1,
          product_name: pedido.servicio,
          phone: pedido.phone,
          nombre_cliente: pedido.nombre_cliente,
          pedido_id: pedidoId,
        }),
      }).catch(e => console.error("[pedidos] Lucius webhook error:", e));
    }
  }

  return NextResponse.json(updated);
}
