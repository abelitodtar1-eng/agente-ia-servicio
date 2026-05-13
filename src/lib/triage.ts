import OpenAI from "openai";
import { getSystemPrompt } from "./db";

const ollamaClient = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://172.17.0.1:11434/v1",
  apiKey: "ollama",
  fetch: globalThis.fetch.bind(globalThis),
});

const ESCALATE_KEYWORDS = [
  "hablar con", "habla con", "quiero una persona", "persona real",
  "agente humano", "agente real", "supervisor", "encargado",
  "queja", "reclamación", "reclamo",
  "harto", "furioso", "molesto", "indignado", "disgustad",
  "no me ayuda", "no funciona", "esto no sirve", "me han engañado",
  "speak to", "talk to human", "real person", "human agent",
];

function keywordEscalate(message: string): boolean {
  const lower = message.toLowerCase();
  return ESCALATE_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function triageMessage(message: string): Promise<"handle" | "escalate"> {
  if (keywordEscalate(message)) {
    console.log("[triage] keyword match → escalate");
    return "escalate";
  }

  const { text: systemPrompt } = getSystemPrompt();
  if (!systemPrompt?.trim()) return "handle";

  try {
    const response = await ollamaClient.chat.completions.create({
      model: process.env.TRIAGE_MODEL ?? "phi3:mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 30,
    });

    const raw = response.choices[0].message.content ?? "";
    try {
      const data = JSON.parse(raw) as { action?: string };
      return data.action === "escalate" ? "escalate" : "handle";
    } catch {
      return raw.toLowerCase().includes("escalate") ? "escalate" : "handle";
    }
  } catch (err) {
    console.error("[triage] llm error, defaulting to handle:", err instanceof Error ? err.message : err);
    return "handle";
  }
}
