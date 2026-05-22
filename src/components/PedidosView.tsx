"use client";
import { useState, useEffect, useCallback } from "react";

const BG = "#0a0c10"; const CARD = "#1a1d27"; const BORD = "#2a2d3e";
const PRP = "#6c63ff"; const TEAL = "#00d4aa"; const RED = "#ff6b6b";
const TEXT = "#e2e8f0"; const MUTED = "#8892a4"; const YELLOW = "#ffd166";
const GREEN = "#2ecc71";

interface Pedido {
  id: number;
  conversation_id: number | null;
  phone: string;
  nombre_cliente: string;
  servicio: string;
  id_servicio: string;
  categoria: string;
  precio_usd: number;
  canal: string;
  estado: "pendiente" | "confirmado" | "rechazado";
  notas: string;
  created_at: number;
  updated_at: number;
}

function estadoColor(e: string) {
  if (e === "confirmado") return TEAL;
  if (e === "rechazado") return RED;
  return YELLOW;
}

function estadoBg(e: string) {
  if (e === "confirmado") return "rgba(0,212,170,.12)";
  if (e === "rechazado") return "rgba(255,107,107,.12)";
  return "rgba(255,209,102,.12)";
}

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function fmtUSD(n: number) {
  return n > 0 ? `$${n.toFixed(2)}` : "—";
}

export function PedidosView() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "pendiente" | "confirmado" | "rechazado">("todos");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const url = filtro === "todos" ? "/api/pedidos" : `/api/pedidos?estado=${filtro}`;
    const res = await fetch(url);
    if (res.ok) setPedidos(await res.json() as Pedido[]);
    setLoading(false);
  }, [filtro]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function accion(id: number, estado: "confirmado" | "rechazado") {
    setActing(id);
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    await load();
    setActing(null);
  }

  const visible = pedidos.filter(p => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return p.nombre_cliente.toLowerCase().includes(s) ||
      p.phone.includes(s) ||
      p.servicio.toLowerCase().includes(s) ||
      p.id_servicio.toLowerCase().includes(s);
  });

  const total = pedidos.length;
  const pendientes = pedidos.filter(p => p.estado === "pendiente").length;
  const confirmados = pedidos.filter(p => p.estado === "confirmado").length;
  const rechazados = pedidos.filter(p => p.estado === "rechazado").length;
  const valorConfirmado = pedidos.filter(p => p.estado === "confirmado").reduce((s, p) => s + p.precio_usd, 0);

  return (
    <div style={{ background: BG, height: "100%", overflowY: "auto", padding: 20 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Pedidos", value: total, color: TEXT },
          { label: "Pendientes", value: pendientes, color: YELLOW },
          { label: "Confirmados", value: confirmados, color: TEAL },
          { label: "Rechazados", value: rechazados, color: RED },
          { label: "Valor confirmado", value: `$${valorConfirmado.toFixed(2)}`, color: GREEN },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {(["todos", "pendiente", "confirmado", "rechazado"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: "6px 16px", fontSize: 12, fontWeight: 600, borderRadius: 20,
              border: filtro === f ? `1px solid ${PRP}` : `1px solid ${BORD}`,
              background: filtro === f ? "rgba(108,99,255,.15)" : "transparent",
              color: filtro === f ? PRP : MUTED, cursor: "pointer",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <input
          placeholder="Buscar cliente, teléfono, servicio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            marginLeft: "auto", padding: "6px 14px", fontSize: 12, borderRadius: 20,
            border: `1px solid ${BORD}`, background: CARD, color: TEXT,
            outline: "none", minWidth: 220,
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>Cargando...</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>No hay pedidos</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORD}` }}>
                {["#", "Cliente", "Teléfono", "Servicio", "Precio", "Canal", "Estado", "Fecha", "Acciones"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: MUTED, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((p, i) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: i < visible.length - 1 ? `1px solid ${BORD}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.02)" }}
                >
                  <td style={{ padding: "10px 14px", color: MUTED }}>{p.id}</td>
                  <td style={{ padding: "10px 14px", color: TEXT, fontWeight: 500, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.nombre_cliente || "—"}
                  </td>
                  <td style={{ padding: "10px 14px", color: MUTED, whiteSpace: "nowrap" }}>{p.phone}</td>
                  <td style={{ padding: "10px 14px", color: TEXT, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span title={p.servicio}>{p.servicio || "—"}</span>
                    {p.id_servicio && <div style={{ fontSize: 10, color: MUTED }}>{p.id_servicio}</div>}
                  </td>
                  <td style={{ padding: "10px 14px", color: GREEN, whiteSpace: "nowrap" }}>{fmtUSD(p.precio_usd)}</td>
                  <td style={{ padding: "10px 14px", color: MUTED }}>{p.canal}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      color: estadoColor(p.estado), background: estadoBg(p.estado),
                    }}>
                      {p.estado}
                    </span>
                    {p.notas && (
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 3, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.notas}>
                        {p.notas}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px", color: MUTED, whiteSpace: "nowrap" }}>{fmtDate(p.created_at)}</td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    {p.estado === "pendiente" ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          disabled={acting === p.id}
                          onClick={() => accion(p.id, "confirmado")}
                          style={{
                            padding: "4px 12px", fontSize: 11, fontWeight: 600, borderRadius: 16,
                            border: `1px solid ${TEAL}`, background: "rgba(0,212,170,.1)",
                            color: TEAL, cursor: acting === p.id ? "not-allowed" : "pointer", opacity: acting === p.id ? .5 : 1,
                          }}
                        >
                          Confirmar
                        </button>
                        <button
                          disabled={acting === p.id}
                          onClick={() => accion(p.id, "rechazado")}
                          style={{
                            padding: "4px 12px", fontSize: 11, fontWeight: 600, borderRadius: 16,
                            border: `1px solid ${RED}`, background: "rgba(255,107,107,.1)",
                            color: RED, cursor: acting === p.id ? "not-allowed" : "pointer", opacity: acting === p.id ? .5 : 1,
                          }}
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: MUTED, fontSize: 11 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
