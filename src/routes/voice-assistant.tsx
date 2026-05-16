import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, Headphones, Loader2, Mic, MicOff, Send, Sparkles, Volume2 } from "lucide-react";
import { Card } from "@/components/ui-bits";
import { createRecognizer, speak } from "@/lib/speech";
import { getQuote, useQuotes } from "@/lib/market";
import { portfolioValue, totalPnl, usePortfolio } from "@/lib/portfolio";
import { voiceAssistant } from "@/lib/ai.functions";

export const Route = createFileRoute("/voice-assistant")({
  component: VoiceAssistantPage,
  head: () => ({ meta: [{ title: "Voice AI Help — VoiceBroker AI" }] }),
});

const LANGS = [
  { code: "en-US", label: "English" },
  { code: "bn-BD", label: "বাংলা" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "ur-PK", label: "اردو" },
  { code: "ar-SA", label: "العربية" },
  { code: "es-ES", label: "Español" },
  { code: "fr-FR", label: "Français" },
  { code: "de-DE", label: "Deutsch" },
  { code: "zh-CN", label: "中文" },
  { code: "ja-JP", label: "日本語" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

function VoiceAssistantPage() {
  const askAssistant = useServerFn(voiceAssistant);
  const portfolio = usePortfolio();
  useQuotes();
  const recRef = useRef<ReturnType<typeof createRecognizer> | null>(null);
  const [lang, setLang] = useState("en-US");
  const [input, setInput] = useState("");
  const [partial, setPartial] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", text: "Hi Zahid, I can help with pages, buttons, portfolio, trading commands, and voice workflow. Ask me anything by voice." },
  ]);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => recRef.current?.stop(), []);

  const makeSnapshot = () => {
    const value = portfolioValue(portfolio.positions);
    const pnl = totalPnl(portfolio.positions);
    return {
      cash: portfolio.cash,
      totalValue: value + portfolio.cash,
      pnlAbs: pnl.abs,
      pnlPct: pnl.pct,
      positions: portfolio.positions.map((p) => ({
        symbol: p.symbol,
        quantity: p.quantity,
        avgPrice: p.avgPrice,
        currentPrice: getQuote(p.base)?.price ?? p.avgPrice,
      })),
    };
  };

  const sendMessage = async (text: string) => {
    const clean = text.trim();
    if (!clean || loading) return;
    setInput("");
    setPartial("");
    setError("");
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: clean };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const { reply } = await askAssistant({ data: { message: clean, portfolio: makeSnapshot() } });
      const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", text: reply };
      setMessages((prev) => [...prev, assistantMsg]);
      speak(reply, lang);
    } catch (e: any) {
      const msg = e?.message ?? "Voice AI failed. Please try again.";
      setError(msg);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = createRecognizer({
      lang,
      continuous: false,
      autoRestart: false,
      onPartial: setPartial,
      onFinal: (text) => {
        setListening(false);
        void sendMessage(text);
      },
      onError: (err) => {
        setError(`Mic error: ${err}`);
        setListening(false);
      },
      onEnd: () => setListening(false),
    });
    if (!rec.supported) {
      setError("Speech recognition not supported. Try Chrome or Edge, or type your question.");
      return;
    }
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const copyLast = async () => {
    const last = [...messages].reverse().find((m) => m.role === "assistant")?.text;
    if (!last) return;
    await navigator.clipboard.writeText(last);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
      <Card className="min-h-[620px] flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <motion.h2 initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Headphones className="h-6 w-6 text-primary" /> Voice <span className="brand-text">AI Help</span>
            </motion.h2>
            <p className="text-sm text-muted-foreground mt-1">Backend-powered assistant for app help, buttons, portfolio and demo trading guidance.</p>
          </div>
          <div className="flex flex-wrap justify-end gap-1 max-w-[150px]">
            {LANGS.slice(0, 4).map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)} className={`rounded-md border px-2 py-1 text-[10px] transition ${lang === l.code ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary/40 text-muted-foreground"}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin space-y-3 pr-1">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && <div className="h-8 w-8 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0"><Bot className="h-4 w-4" /></div>}
                <div className={`max-w-[82%] rounded-xl px-4 py-3 text-sm leading-relaxed border ${m.role === "user" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/40 border-border text-foreground"}`}>
                  {m.text}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Backend AI thinking...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {partial && <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">{partial}<span className="animate-pulse">|</span></div>}
        {error && <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <button onClick={toggleMic} className={`relative h-12 w-full sm:w-14 rounded-lg grid place-items-center transition ${listening ? "bg-gradient-to-br from-accent to-destructive text-primary-foreground shadow-[var(--shadow-accent-glow)]" : "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[var(--shadow-glow)]"}`} aria-label={listening ? "Stop voice AI" : "Start voice AI"}>
            {listening && <span className="absolute inset-0 rounded-lg bg-accent/20 sonar-ring" />}
            {listening ? <MicOff className="h-5 w-5 relative" /> : <Mic className="h-5 w-5 relative" />}
          </button>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void sendMessage(input); }} placeholder="Ask voice AI for help..." className="min-h-12 flex-1 rounded-lg border border-border bg-secondary/50 px-4 text-sm text-foreground focus:outline-none focus:border-primary" />
          <button onClick={() => void sendMessage(input)} disabled={!input.trim() || loading} className="h-12 px-4 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2">
            <Send className="h-4 w-4" /> Send
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-2 text-sm font-semibold mb-3"><Sparkles className="h-4 w-4 text-accent" /> Quick help prompts</div>
          <div className="grid gap-2">
            {[
              "বাংলায় বলো, এই dashboard button গুলো কীভাবে কাজ করে?",
              "How is my portfolio doing right now?",
              "Which page should I use for voice trading?",
              "Explain the BUY and SELL buttons safely.",
            ].map((q) => (
              <button key={q} onClick={() => void sendMessage(q)} className="text-left rounded-lg border border-border bg-secondary/35 px-3 py-2 text-sm hover:border-primary/50 hover:bg-primary/10 transition">
                {q}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2"><Volume2 className="h-4 w-4 text-primary" /> Voice output</div>
              <p className="text-xs text-muted-foreground mt-1">Every backend AI answer speaks back in the selected language voice.</p>
            </div>
            <button onClick={copyLast} className="rounded-lg border border-border bg-secondary/40 p-2 hover:bg-secondary" aria-label="Copy last answer">
              {copied ? <Check className="h-4 w-4 text-success" /> : <Sparkles className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
