"use client";

const CARD = "#1a1d27"; const BORD = "#2a2d3e"; const PRP = "#6c63ff";
const TEAL = "#00d4aa"; const RED = "#ff6b6b"; const TEXT = "#e2e8f0"; const MUTED = "#8892a4";

const AVATAR_COLORS = [
  "#6c63ff","#00d4aa","#ff6b6b","#ffd166","#06d6a0",
  "#118ab2","#ef476f","#f77f00","#7b2d8b","#2ec4b6",
];

interface Conversation {
  id: number;
  phone: string;
  phone_alias: string | null;
  name: string | null;
  mode: "AI" | "HUMAN";
  last_message_at: number | null;
  unread_count: number;
  last_message: string | null;
  last_message_role: string | null;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function relativeTime(ts: number | null): string {
  if (!ts) return "";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - ts;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  const d = new Date(ts * 1000);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d >= today) return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  if (d >= yesterday) return "Ayer";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function Avatar({ name, phone }: { name: string | null; phone: string }) {
  const color = avatarColor(phone);
  const src = name?.trim() || phone;
  const initials = src
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join("");
  return (
    <div style={{
      width: 46, height: 46, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontSize: initials.length > 1 ? 16 : 19,
      fontWeight: 700, color: "#fff", userSelect: "none",
    }}>
      {initials || "?"}
    </div>
  );
}

function MessagePreview({ role, content }: { role: string | null; content: string | null }) {
  if (!content) return <span style={{ color: MUTED, fontStyle: "italic", fontSize: 12 }}>Sin mensajes</span>;
  const prefix = role === "assistant" ? "🤖 " : role === "human" ? "👤 " : "";
  const text = content.length > 45 ? content.slice(0, 45) + "…" : content;
  return (
    <span style={{ fontSize: 12, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {prefix}{text}
    </span>
  );
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: CARD }}>

      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORD}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".5px", margin: 0 }}>
          Conversaciones
        </h2>
        <span style={{ fontSize: 10, color: MUTED }}>{conversations.length}</span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {conversations.length === 0 && (
          <p style={{ fontSize: 12, color: MUTED, textAlign: "center", marginTop: 40, padding: "0 16px" }}>
            Sin conversaciones. Esperando mensajes...
          </p>
        )}
        {conversations.map((c) => {
          const selected = selectedId === c.id;
          const displayName = c.name ?? c.phone_alias ?? null;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              style={{
                width: "100%", textAlign: "left", padding: "10px 14px",
                borderBottom: `1px solid ${BORD}`, cursor: "pointer",
                background: selected ? "rgba(108,99,255,.13)" : "transparent",
                borderLeft: `3px solid ${selected ? PRP : "transparent"}`,
                transition: "background .12s", display: "flex", alignItems: "center", gap: 11,
              }}
              onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "rgba(255,255,255,.03)"; }}
              onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
            >
              {/* Avatar + mode dot */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar name={displayName} phone={c.phone} />
                <span style={{
                  position: "absolute", bottom: 1, right: 1,
                  width: 12, height: 12, borderRadius: "50%",
                  background: c.mode === "AI" ? TEAL : RED,
                  border: `2px solid ${selected ? "#1e2035" : CARD}`,
                }} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Row 1: name + time */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 3 }}>
                  <span style={{
                    fontSize: 13, fontWeight: c.unread_count > 0 ? 700 : 500,
                    color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {displayName ?? c.phone}
                  </span>
                  <span style={{
                    fontSize: 11, color: c.unread_count > 0 ? TEAL : MUTED,
                    flexShrink: 0, fontWeight: c.unread_count > 0 ? 600 : 400,
                  }}>
                    {relativeTime(c.last_message_at)}
                  </span>
                </div>

                {/* Row 2: preview + unread badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <MessagePreview role={c.last_message_role} content={c.last_message} />
                  </div>
                  {c.unread_count > 0 && (
                    <span style={{
                      flexShrink: 0, minWidth: 19, height: 19, padding: "0 5px",
                      fontSize: 11, fontWeight: 700,
                      background: TEAL, color: "#0a0c10", borderRadius: 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {c.unread_count > 99 ? "99+" : c.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
