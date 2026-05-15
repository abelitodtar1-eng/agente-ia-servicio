"use client";

interface Conversation {
  id: number;
  phone: string;
  name: string | null;
  mode: "AI" | "HUMAN";
  last_message_at: number | null;
  unread_count: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function relativeTime(ts: number | null): string {
  if (!ts) return "";
  const diff = Math.floor((Date.now() / 1000) - ts);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700">Conversaciones</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-8 px-4">
            Sin conversaciones aún. Esperando mensajes...
          </p>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
              selectedId === c.id ? "bg-blue-50 border-l-2 border-l-blue-600" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {c.name ?? c.phone}
                {c.unread_count > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                    {c.unread_count > 99 ? "99+" : c.unread_count}
                  </span>
                )}
              </span>
              <span
                className={`shrink-0 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  c.mode === "AI"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {c.mode === "HUMAN" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                {c.mode === "AI" ? "IA" : "Humano"}
              </span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-gray-400">{c.phone}</span>
              <span className="text-xs text-gray-400">{relativeTime(c.last_message_at)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
