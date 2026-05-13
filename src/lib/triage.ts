import { openrouterClient } from "./openrouter";
import { getSystemPrompt } from "./db";

export async function triageMessage(message: string): Promise<"handle" | "escalate"> {
  const { text: systemPrompt } = getSystemPrompt();
  if (!systemPrompt?.trim()) return "handle";

  try {
    const response = await openrouterClient.chat.completions.create({
      model: process.env.TRIAGE_MODEL ?? "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 30,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0].message.content ?? "{}";
    const data = JSON.parse(raw) as { action?: string };
    return data.action === "escalate" ? "escalate" : "handle";
  } catch (err) {
    console.error("[triage] error, defaulting to handle:", err);
    return "handle";
  }
}
