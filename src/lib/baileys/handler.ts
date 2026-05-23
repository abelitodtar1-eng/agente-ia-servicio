import type { WASocket, proto } from "@whiskeysockets/baileys";
import {
  getOrCreateConversation,
  insertMessage,
  getRecentHistory,
  enqueueOutbox,
  getVendedoraWebhookUrl,
  getAdminPhone,
  resolveContactPhone,
  countUserMessages,
  updateConversationName,
  type Conversation,
} from "../db";
import { handleProductCommand } from "../product-commands";

function extractText(msg: proto.IWebMessageInfo): string | null {
  return (
    msg.message?.conversation ??
    msg.message?.extendedTextMessage?.text ??
    null
  );
}

async function processWithVendedora(phone: string, message: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const webhookUrl =
      process.env.N8N_WEBHOOK_VENDEDORA ||
      getVendedoraWebhookUrl() ||
      process.env.N8N_WEBHOOK_URL ||
      "";
    if (!webhookUrl) throw new Error("Webhook URL no configurada");
    console.log(`[handler] → n8n [vendedora] phone=${phone}`);
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: `${phone}@s.whatsapp.net`, message }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`n8n webhook ${resp.status}: ${body.slice(0, 200)}`);
    }
    const data = (await resp.json()) as { response?: string };
    return data.response ?? "Lo siento, no pude procesar tu mensaje.";
  } finally {
    clearTimeout(timeout);
  }
}

export async function handleIncomingMessage(
  sock: WASocket,
  msg: proto.IWebMessageInfo
): Promise<void> {
  const remoteJid = msg.key.remoteJid ?? "";

  if (
    remoteJid.endsWith("@g.us") ||
    remoteJid.endsWith("@newsletter") ||
    remoteJid.endsWith("@broadcast")
  ) {
    console.log("[handler] skip: grupo/canal");
    return;
  }
  if (
    !remoteJid.endsWith("@s.whatsapp.net") &&
    !remoteJid.endsWith("@lid")
  ) {
    console.log(`[handler] skip: jid=${remoteJid}`);
    return;
  }

  const text = extractText(msg);
  if (!text?.trim()) {
    console.log("[handler] skip: sin texto");
    return;
  }
  console.log(
    `[handler] OK from=${remoteJid} fromMe=${msg.key.fromMe} text="${text.slice(0, 40)}"`
  );

  const phone = remoteJid.replace(/@(s\.whatsapp\.net|lid)$/, "");
  const pushName = msg.pushName ?? null;

  const conversation = getOrCreateConversation(phone, pushName);

  if (msg.key.fromMe) {
    const recent = getRecentHistory(conversation.id, 5);
    const alreadyStored = recent.some(
      (m) =>
        m.content === text &&
        (m.role === "assistant" || m.role === "human")
    );
    if (alreadyStored) return;
    insertMessage(conversation.id, "human", text);
    return;
  }

  insertMessage(conversation.id, "user", text);

  const { mode } = conversation;
  if (mode !== "AI") return;

  // LID onboarding — collect real phone when contact has no alias yet
  if (remoteJid.endsWith("@lid") && !conversation.phone_alias) {
    const userCount = countUserMessages(conversation.id);

    const extractPhone = (t: string): string | null => {
      const full = t.match(/\+?(53[5-9]\d{7})/);
      if (full) return full[1];
      const local = t.match(/\b([5-9]\d{7})\b/);
      if (local) return `53${local[1]}`;
      const generic = t.match(/\b(\d{9,13})\b/);
      return generic ? generic[1] : null;
    };

    if (userCount === 1) {
      const welcome = "¡Hola! 👋 Para registrarte, ¿puedes decirme tu nombre y número de teléfono?";
      insertMessage(conversation.id, "assistant", welcome);
      await sock.sendMessage(remoteJid, { text: welcome });
      return;
    }

    const extracted = extractPhone(text);
    if (extracted) {
      resolveContactPhone(phone, extracted);
      const namePart = text.replace(/[\d\s\+\-]+$/, "").trim();
      if (namePart) updateConversationName(conversation.id, namePart);
      const confirm = `✅ ¡Gracias! Registré tu número +${extracted}. ¿En qué puedo ayudarte?`;
      insertMessage(conversation.id, "assistant", confirm);
      await sock.sendMessage(remoteJid, { text: confirm });
      console.log(`[handler] LID resolved phone=${phone} → +${extracted}`);
      return;
    }

    if (userCount === 2) {
      const ask = "No pude identificar tu número. Escríbelo así: *5352123456*";
      insertMessage(conversation.id, "assistant", ask);
      await sock.sendMessage(remoteJid, { text: ask });
      return;
    }
  }

  // Admin inventory commands — intercept before n8n
  const adminPhone = getAdminPhone();
  if (adminPhone && phone === adminPhone) {
    const result = handleProductCommand(text);
    if (result) {
      insertMessage(conversation.id, "assistant", result.reply);
      await sock.sendMessage(remoteJid, { text: result.reply });
      console.log(`[handler] admin inv cmd ok=${result.ok}`);
      return;
    }
  }

  try {
    const reply = await processWithVendedora(phone, text);
    insertMessage(conversation.id, "assistant", reply);
    enqueueOutbox(conversation.id, remoteJid, reply);
    console.log(`[handler] ← reply queued to outbox (${reply.length} chars)`);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const cause = (err as { cause?: unknown })?.cause;
    const status = (err as { status?: unknown })?.status;
    console.error(
      "[bot] Error procesando mensaje:",
      errMsg,
      "status=",
      status,
      "cause=",
      cause
    );
    if (err instanceof Error && err.stack)
      console.error(err.stack.split("\n").slice(0, 5).join("\n"));
  }
}

export { getAppointmentsByConversation };
