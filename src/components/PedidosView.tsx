"use client";
import { useEffect, useState } from "react";

const BG = "#0a0c10"; const CARD = "#1a1d27"; const BORD = "#2a2d3e"; const PRP = "#6c63ff";
const TEAL = "#00d4aa"; const RED = "#ff6b6b"; const TEXT = "#e2e8f0"; const MUTED = "#8892a4";
const YELL = "#ffd166"; const ORG = "#f9844a";

type OrderStatus = "draft" | "confirmed" | "paid" | "shipped" | "cancelled";

interface OrderItem { id: number; nombre_snapshot: string; udm_snapshot: string; cantidad: number; precio_unitario: number; subtotal: number }
interface Order {
  id: number; conversation_id: number; status: OrderStatus; total_cup: number;
  notes: string | null; created_at: number; contact_name: string | null;
  contact_phone: string; phone_alias: string | null; items?: OrderItem[];
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  draft: MUTED, confirmed: PRP, paid: TEAL, shipped: ORG, cancelled: RED,
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Borrador", confirmed: "Confirmado", paid: "Pagado", shipped: "Enviado", cancelled: "Cancelado",
};
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  draft: "confirmed", confirmed: "paid", paid: "shipped",
};

function fmtCUP(n: number) { return n.toLocaleString("es-CU") + " CUP"; }
function fmtDate(ts: number) { return new Date(ts * 1000).toLocaleDateString("es-CU", { day: "2-digit", month: "short", year: "numeric" }); }

export function PedidosView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<OrderStatus, number>>({ draft: 0, confirmed: 0, paid: 0, shipped: 0, cancelled: 0 });
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<Record<number, OrderItem[]>>({});

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    const res = await fetch("/api/orders");
    if (res.ok) { const d = await res.json(); setOrders(d.orders); setCounts(d.counts); }
  }

  async function loadItems(id: number) {
    if (expandedData[id]) return;
    const res = await fetch(`/api/orders/${id}`);
    if (res.ok) { const d = await res.json(); setExpandedData(p => ({ ...p, [id]: d.items })); }
  }

  async function advanceStatus(order: Order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    if (!confirm(`¿Cambiar pedido #${order.id} a "${STATUS_LABEL[next]}"?`)) return;
    await fetch(`/api/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    loadOrders();
  }

  async function cancelOrder(id: number) {
    if (!confirm(`¿Cancelar pedido #${id}?`)) return;
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
    loadOrders();
  }

  async function deleteOrder(id: number) {
    if (!confirm(`¿Eliminar pedido #${id}?`)) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    loadOrders();
  }

  const displayed = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {(["all", "draft", "confirmed", "paid", "shipped", "cancelled"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: "4px 12px", fontSize: 11, fontWeight: 600, borderRadius: 20, border: "none", cursor: "pointer",
              background: filter === s ? (s === "all" ? PRP : STATUS_COLOR[s as OrderStatus]) : "rgba(255,255,255,.06)",
              color: filter === s ? "#fff" : MUTED,
            }}>
              {s === "all" ? `Todos (${orders.length})` : `${STATUS_LABEL[s as OrderStatus]} (${counts[s as OrderStatus]})`}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
        {displayed.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60, fontSize: 13, color: MUTED }}>Sin pedidos</div>
        ) : displayed.map(o => {
          const isExp = expanded === o.id;
          const contactLabel = o.phone_alias || o.contact_name || `+${o.contact_phone}`;
          return (
            <div key={o.id} style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
              {/* Row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer" }}
                onClick={() => { setExpanded(isExp ? null : o.id); loadItems(o.id); }}>
                <span style={{ fontSize: 11, color: MUTED, minWidth: 36 }}>#{o.id}</span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[o.status], flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: TEXT, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contactLabel}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: TEAL }}>{fmtCUP(o.total_cup)}</span>
                <span style={{ fontSize: 10, color: MUTED }}>{fmtDate(o.created_at)}</span>
                <span style={{ fontSize: 10, color: STATUS_COLOR[o.status], fontWeight: 600, background: `${STATUS_COLOR[o.status]}18`, padding: "2px 8px", borderRadius: 10 }}>
                  {STATUS_LABEL[o.status]}
                </span>
              </div>

              {/* Expanded items */}
              {isExp && (
                <div style={{ borderTop: `1px solid ${BORD}`, padding: "10px 14px" }}>
                  {(expandedData[o.id] ?? []).map(item => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: MUTED, marginBottom: 4 }}>
                      <span>{item.nombre_snapshot} × {item.cantidad} {item.udm_snapshot}</span>
                      <span style={{ color: TEXT }}>{fmtCUP(item.subtotal)}</span>
                    </div>
                  ))}
                  {o.notes && <p style={{ fontSize: 11, color: MUTED, marginTop: 8, fontStyle: "italic" }}>Nota: {o.notes}</p>}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    {NEXT_STATUS[o.status] && (
                      <button onClick={() => advanceStatus(o)} style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: STATUS_COLOR[NEXT_STATUS[o.status]!], color: "#fff" }}>
                        → {STATUS_LABEL[NEXT_STATUS[o.status]!]}
                      </button>
                    )}
                    {o.status !== "cancelled" && o.status !== "shipped" && (
                      <button onClick={() => cancelOrder(o.id)} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: `1px solid ${RED}40`, cursor: "pointer", background: "transparent", color: RED }}>
                        Cancelar
                      </button>
                    )}
                    {o.status === "draft" && (
                      <button onClick={() => deleteOrder(o.id)} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: `1px solid ${BORD}`, cursor: "pointer", background: "transparent", color: MUTED }}>
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
