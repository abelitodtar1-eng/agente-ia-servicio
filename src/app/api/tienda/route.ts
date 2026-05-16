import { NextResponse } from "next/server";
import { getConnectionState } from "@/lib/db";

const SHEET_ID = "1srqMvqVqqF4Hblk611Rrdl_IS1mFQvS1UMkFo2yiv7M";

interface GvizCell { v: string | number | null; f?: string }
interface GvizRow  { c: (GvizCell | null)[] }
interface GvizCol  { label: string }
interface GvizResponse { table: { cols: GvizCol[]; rows: GvizRow[] } }

async function fetchSheet(sheet: string): Promise<Record<string, string | number | null>[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheet)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  const raw = await res.text();
  const jsonStr = raw
    .replace(/^\/\*.*?\*\/\s*google\.visualization\.Query\.setResponse\(/, "")
    .replace(/\);?\s*$/, "");
  const data: GvizResponse = JSON.parse(jsonStr);
  const cols = data.table.cols.map(c => c.label);
  return (data.table.rows ?? []).map(row => {
    const obj: Record<string, string | number | null> = {};
    cols.forEach((col, i) => { obj[col] = row.c?.[i]?.v ?? null; });
    return obj;
  });
}

export async function GET() {
  try {
    const productos = await fetchSheet("PRODUCTOS");

    const conn = getConnectionState();
    const phone = conn.phone ?? "";

    const items = productos.map(p => ({
      codigo:    Number(p["CÓDIGO"]) || 0,
      nombre:    String(p["DESCRIPCIÓN"] ?? ""),
      categoria: String(p["CATEGORÍA"] ?? ""),
      udm:       String(p["UdM"] ?? ""),
      stock:     Number(p["INVENTARIO"]) || 0,
      precio:    Number(p["COSTO_UNIT_PROM"]) || 0,
      estado:    String(p["ESTADO"] ?? ""),
    })).filter(p => p.nombre);

    return NextResponse.json({ productos: items, phone });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
