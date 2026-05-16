import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(messages: Array<{ role: string; content: string }>, model = "google/gemini-3-flash-preview") {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Rate limit exceeded, try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace → Usage.");
    throw new Error(`AI gateway error: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content as string) ?? "";
}

// General LLM chat — used by buttons / insights
export const aiChat = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; system?: string }) => d)
  .handler(async ({ data }) => {
    const messages = [
      { role: "system", content: data.system ?? "You are VoiceBroker AI, a sharp, concise financial trading assistant. Reply in under 120 words." },
      { role: "user", content: data.prompt },
    ];
    const reply = await callAI(messages);
    return { reply };
  });

// Translate text to a target language; auto-detects source
export const aiTranslate = createServerFn({ method: "POST" })
  .inputValidator((d: { text: string; targetLang: string; targetLabel: string }) => d)
  .handler(async ({ data }) => {
    const messages = [
      {
        role: "system",
        content:
          "You are a professional real-time translator. Detect the source language automatically. Translate the user's text into the requested target language. Return ONLY the translated text — no quotes, no explanations, no source text, no language labels.",
      },
      { role: "user", content: `Target language: ${data.targetLabel} (${data.targetLang})\n\nText:\n${data.text}` },
    ];
    const translation = await callAI(messages);
    return { translation: translation.trim() };
  });

export const voiceAssistant = createServerFn({ method: "POST" })
  .inputValidator((d: {
    message: string;
    portfolio: {
      cash: number;
      totalValue: number;
      pnlAbs: number;
      pnlPct: number;
      positions: Array<{ symbol: string; quantity: number; avgPrice: number; currentPrice: number }>;
    };
  }) => d)
  .handler(async ({ data }) => {
    const snapshot = data.portfolio.positions
      .map((p) => `${p.symbol}: ${p.quantity} shares, avg $${p.avgPrice.toFixed(2)}, now $${p.currentPrice.toFixed(2)}`)
      .join("\n");
    const messages = [
      {
        role: "system",
        content:
          "You are VoiceBroker AI's powerful backend voice assistant. Help the user operate the app, understand portfolio status, explain button actions, and give safe demo-trading guidance. Reply in the user's language when obvious, keep it under 90 words, and never claim real-money execution.",
      },
      {
        role: "user",
        content: `User said: ${data.message}\n\nPortfolio snapshot:\nCash: $${data.portfolio.cash.toFixed(2)}\nTotal: $${data.portfolio.totalValue.toFixed(2)}\nP&L: ${data.portfolio.pnlAbs >= 0 ? "+" : ""}$${data.portfolio.pnlAbs.toFixed(2)} (${data.portfolio.pnlPct.toFixed(2)}%)\nPositions:\n${snapshot || "No positions"}`,
      },
    ];
    const reply = await callAI(messages);
    return { reply: reply.trim() };
  });
