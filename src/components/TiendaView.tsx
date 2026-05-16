"use client";
import { useState, useEffect, useMemo } from "react";

const BG   = "#0a0c10";
const CARD = "#1a1d27";
const BORD = "#2a2d3e";
const PRP  = "#6c63ff";
const TEAL = "#00d4aa";
const RED  = "#ff6b6b";
const YELL = "#ffd166";
const TEXT = "#e2e8f0";
const MUTED = "#8892a4";
const GREEN = "#4caf50";

interface Producto {
  codigo: number;
  nombre: string;
  categoria: string;
  udm: string;
  stock: number;
  precio: number;
  estado: string;
}

function estadoColor(p: Producto) {
  if (p.stock <= 0 || p.estado.includes("SIN STOCK")) return RED;
  if (p.estado.includes("SOLICITAR") || p.stock < 5) return YELL;
  return GREEN;
}

function estadoLabel(p: Producto) {
  if (p.stock <= 0 || p.estado.includes("SIN STOCK")) return "Sin stock";
  if (p.estado.includes("SOLICITAR")) return "Poco stock";
  if (p.stock < 5) return `Últimas ${p.stock}`;
  return "OK";
}

export function TiendaView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [search, setSearch]       = useState("");
  const [catFiltro, setCatFiltro] = useState("Todos");
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState(false);

  const storeUrl = typeof window !== "undefined"
    ? `${window.location.origin}/tienda`
    : "/tienda";

  useEffect(() => {
    fetch("/api/tienda")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.productos) setProductos(d.productos); })
      .finally(() => setLoading(false));
  }, []);

  const categorias = useMemo(() => {
    const cats = [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort();
    return ["Todos", ...cats];
  }, [productos]);

  const visible = useMemo(() => productos.filter(p => {
    if (catFiltro !== "Todos" && p.categoria !== catFiltro) return false;
    if (search && !p.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [productos, catFiltro, search]);

  const enStock    = productos.filter(p => p.stock > 0 && !p.estado.includes("SIN STOCK")).length;
  const sinStock   = productos.filter(p => p.stock <= 0 || p.estado.includes("SIN STOCK")).length;

  function copyLink() {
    navigator.clipboard.writeText(storeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", background: BG, color: TEXT, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: "#12141e", borderBottom: `1px solid ${BORD}`, padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Tienda Pública</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{storeUrl}</div>
        </div>
        <button
          onClick={copyLink}
          style={{ background: copied ? GREEN : PRP, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background .2s" }}
        >
          {copied ? "¡Copiado!" : "Copiar enlace"}
        </button>
        <a
          href="/tienda"
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: "rgba(0,212,170,.12)", color: TEAL, border: `1px solid rgba(0,212,170,.2)`, borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
        >
          Ver tienda
        </a>
      </div>

      {/* KPIs */}
      <div style={{ padding: "16px 24px 0", display: "flex", gap: 12 }}>
        {[
          { label: "Total productos", value: productos.length, color: PRP },
          { label: "En stock", value: enStock, color: TEAL },
          { label: "Sin stock", value: sinStock, color: sinStock > 0 ? RED : MUTED },
          { label: "Categorías", value: categorias.length - 1, color: YELL },
        ].map(k => (
          <div key={k.label} style={{ background: CARD, border: `1px solid ${BORD}`, borderTop: `3px solid ${k.color}`, borderRadius: 10, padding: "12px 18px", flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? "—" : k.value}</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: "12px 24px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 8, padding: "7px 14px", color: TEXT, fontSize: 12, outline: "none", width: 200 }}
        />
        <select
          value={catFiltro}
          onChange={e => setCatFiltro(e.target.value)}
          style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 8, padding: "7px 14px", color: TEXT, fontSize: 12, cursor: "pointer", outline: "none" }}
        >
          {categorias.map(c => <option key={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 11, color: MUTED, marginLeft: "auto" }}>{visible.length} producto{visible.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div style={{ padding: "0 24px 24px" }}>
        <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#12141e" }}>
                {["#", "Producto", "Categoría", "Stock", "Precio (CUP)", "Estado"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".5px", textAlign: "left", borderBottom: `1px solid ${BORD}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 12 }}>Cargando…</td></tr>
              )}
              {!loading && visible.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 12 }}>Sin productos</td></tr>
              )}
              {visible.map((p, i) => {
                const color = estadoColor(p);
                return (
                  <tr
                    key={p.codigo}
                    style={{ borderBottom: `1px solid ${BORD}`, transition: "background .1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "10px 14px", fontSize: 11, color: MUTED }}>{i + 1}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: TEXT }}>{p.nombre}</td>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: MUTED }}>{p.categoria || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: p.stock > 0 ? TEXT : MUTED }}>
                      {p.stock > 0 ? `${p.stock} ${p.udm}` : "0"}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: TEAL }}>
                      {p.precio > 0 ? p.precio.toLocaleString("es-ES") : <span style={{ color: MUTED, fontWeight: 400, fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, color, background: `${color}1a`, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                        {estadoLabel(p)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
