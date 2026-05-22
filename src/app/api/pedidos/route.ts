import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listPedidos, createPedido } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = getSessionUser(req.cookies.get("dtar_session")?.value ?? "");
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const estado = req.nextUrl.searchParams.get("estado") ?? undefined;
  return NextResponse.json(listPedidos(estado));
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    phone?: string; nombre_cliente?: string; servicio?: string;
    id_servicio?: string; categoria?: string; precio_usd?: number;
    canal?: string; notas?: string;
  };
  if (!body.phone) return NextResponse.json({ error: "phone requerido" }, { status: 400 });
  const pedido = createPedido({
    phone:          body.phone,
    nombre_cliente: body.nombre_cliente ?? "",
    servicio:       body.servicio ?? "",
    id_servicio:    body.id_servicio ?? "",
    categoria:      body.categoria ?? "",
    precio_usd:     body.precio_usd ?? 0,
    canal:          body.canal ?? "WhatsApp",
    notas:          body.notas ?? "",
  });
  return NextResponse.json(pedido, { status: 201 });
}
