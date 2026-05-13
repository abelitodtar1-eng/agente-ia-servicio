"use client";
import { useState } from "react";

interface Conversation {
  id: number;
  phone: string;
  name: string | null;
  mode: "AI" | "HUMAN";
  last_message_at: number | null;
}

interface ContactsViewProps {
  conversations: Conversation[];
  onNameUpdated: (id: number, name: string) => void;
}

function relativeTime(ts: number | null): string {
  if (!ts) return "—";
  const diff = Math.floor((Date.now() / 1000) - ts);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

export function ContactsView({ conversations, onNameUpdated }: ContactsViewProps) {
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  function startEdit(c: Conversation) {
    setEditing((prev) => ({ ...prev, [c.id]: c.name ?? "" }));
  }

  async function saveName(id: number) {
    const name = editing[id] ?? "";
    setSaving((prev) => ({ ...prev, [id]: true }));
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving((prev) => ({ ...prev, [id]: false }));
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    onNameUpdated(id, name);
  }

  function handleKey(e: React.KeyboardEvent, id: number) {
    if (e.key === "Enter") saveName(id);
    if (e.key === "Escape") setEditing((prev) => { const n = {...prev}; delete n[id]; return n; });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-700">
          Contactos · {conversations.length}
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Haz clic en un nombre para editarlo</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 w-48">Nombre</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Teléfono</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Modo</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Último mensaje</th>
            </tr>
          </thead>
          <tbody>
            {conversations.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-xs text-gray-400">
                  Sin contactos aún
                </td>
              </tr>
            )}
            {conversations.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-2.5">
                  {c.id in editing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={editing[c.id]}
                        onChange={(e) => setEditing((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        onKeyDown={(e) => handleKey(e, c.id)}
                        onBlur={() => saveName(c.id)}
                        className="w-full px-2 py-1 text-sm border border-blue-400 rounded outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Nombre del contacto"
                      />
                      {saving[c.id] && (
                        <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(c)}
                      className="group flex items-center gap-1.5 text-left w-full"
                    >
                      <span className={`font-medium ${c.name ? "text-gray-900" : "text-gray-400 italic"}`}>
                        {c.name ?? "Sin nombre"}
                      </span>
                      <svg className="w-3 h-3 text-gray-300 group-hover:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </td>
                <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{c.phone}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    c.mode === "AI"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {c.mode === "AI" ? "IA" : "Humano"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-400">{relativeTime(c.last_message_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
