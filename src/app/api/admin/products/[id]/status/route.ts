import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getProduct } from "@/lib/db";
import { sendWAStatus } from "@/lib/baileys/client";

export const dynamic = "force-dynamic";

const IMAGES_DIR = path.resolve(process.cwd(), "data", "images");

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(Number(id));
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  if (!product.imagen) return NextResponse.json({ error: "Producto sin imagen" }, { status: 400 });

  const filepath = path.join(IMAGES_DIR, product.imagen);
  if (!fs.existsSync(filepath)) return NextResponse.json({ error: "Archivo de imagen no encontrado" }, { status: 404 });

  const buffer = fs.readFileSync(filepath);
  const lines = [product.nombre, `💰 ${product.precio.toLocaleString("es-CU")} CUP`, `📦 Stock: ${product.stock}`];
  if (product.categoria) lines.push(`🏷️ ${product.categoria}`);
  const caption = lines.join("\n");

  try {
    await sendWAStatus(buffer, caption);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
