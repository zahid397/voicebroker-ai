import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Brain, Zap, CheckCircle2, AlertTriangle, Volume2 } from "lucide-react";
import { Card } from "@/components/ui-bits";
import { createRecognizer, speak } from "@/lib/speech";
import { parseIntent, intentSummary, type Intent } from "@/lib/intent";
import { executeTrade, bumpVoiceCount, usePortfolio, portfolioValue, totalPnl } from "@/lib/portfolio";
import { getQuote, useQuotes } from "@/lib/market";

export const Route = createFileRoute("/voice-trade")({
  component: VoiceTrade,
  head: () => ({ meta: [{ title: "Voice Trade — VoiceBroker AI" }] }),
});

interface AgentStep { id: string; phase: "transcript" | "intent" | "market" | "reasoning" | "execute" | "result"; text: string; ok?: boolean }

const EXAMPLES = [
  "Buy 50 dollars of Apple stock",
  "Sell all my Tesla position",
  "Buy 2 shares of Nvidia",
  "What's the price of Microsoft?",
  "How is my portfolio doing?",
];

function VoiceTrade() {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [finalText, setFinalText] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [supported, setSupported] = useState(true);
  const [intent, setIntent] = useState<Intent | null>(null);
  const recRef = useRef<ReturnType<typeof createRecognizer> | null>(null);
  useQuotes();
  const state = usePortfolio();

  useEffect(() => () => recRef.current?.stop(), []);

  const addStep = (s: AgentStep) => setSteps((prev) => [...prev, s]);

  const handleCommand = async (text: string) => {
    setFinalText(text);
    setSteps([]);
    bumpVoiceCount();

    addStep({ id: "t", phase: "transcript", text: `Heard: "${text}"`, ok: true });
    await delay(350);

    addStep({ id: "i", phase: "intent", text: "Gemini parsing intent..." });
    await delay(450);
    const parsed = parseIntent(text);
    setIntent(parsed);
    setSteps((prev) => prev.map((s) => s.id === "i" ? { ...s, text: `Intent: ${intentSummary(parsed)}`, ok: parsed.type !== "unknown" } : s));

    if (parsed.type === "unknown") {
      addStep({ id: "r", phase: "reasoning", text: parsed.reasoning, ok: false });
      speak("Sorry, I didn't catch a tradable command. Try buy fifty dollars of Apple.");
      return;
    }

    if (parsed.type === "portfolio") {
      const value = portfolioValue(state.positions);
      const pnl = totalPnl(state.positions);
      const total = value + state.cash;
      const msg = `Your portfolio is worth $${total.toFixed(2)}, ${pnl.abs >= 0 ? "up" : "down"} $${Math.abs(pnl.abs).toFixed(2)}, ${pnl.pct.toFixed(2)} percent overall.`;
      addStep({ id: "r", phase: "reasoning", text: msg, ok: true });
      speak(msg);
      return;
    }

    if (parsed.type === "price") {
      const q = getQuote(parsed.symbol);
      const msg = q
        ? `${parsed.name} is currently trading at $${q.price.toFixed(2)}, ${q.changePct >= 0 ? "up" : "down"} ${Math.abs(q.changePct).toFixed(2)} percent today.`
        : `I couldn't find a quote for ${parsed.name}.`;
      addStep({ id: "r", phase: "reasoning", text: msg, ok: !!q });
      speak(msg);
      return;
    }

    // trade
    addStep({ id: "m", phase: "market", text: `Fetching live quote from Kraken xStocks for ${parsed.symbol}...` });
    await delay(500);
    const q = getQuote(parsed.symbol);
    setSteps((prev) => prev.map((s) => s.id === "m" ? { ...s, text: q ? `Live quote: ${parsed.symbol} @ $${q.price.toFixed(2)} (${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%)` : "Quote unavailable", ok: !!q } : s));

    addStep({ id: "r", phase: "reasoning", text: parsed.reasoning, ok: true });
    await delay(550);

    addStep({ id: "e", phase: "execute", text: `Routing ${parsed.action} order to Kraken xStocks...` });
    await delay(450);

    let quantity = parsed.quantity;
    let dollarAmount = parsed.dollarAmount;
    if (parsed.sellAll) {
      const pos = state.positions.find((p) => p.base === getQuote(parsed.symbol)?.base);
      quantity = pos?.quantity ?? 0;
      dollarAmount = undefined;
    }
    if (!quantity && !dollarAmount) dollarAmount = 100; // default safety

    const result = executeTrade({
      symbol: parsed.symbol, action: parsed.action,
      quantity, dollarAmount, trigger: "voice", voiceCommand: text, aiReasoning: parsed.reasoning,
    });

    if (result.ok) {
      const t = result.trade;
      const msg = `${t.action === "BUY" ? "Bought" : "Sold"} ${t.quantity.toFixed(4)} shares of ${t.symbol} at $${t.price.toFixed(2)}, total $${t.total.toFixed(2)}.`;
      setSteps((prev) => prev.map((s) => s.id === "e" ? { ...s, text: `Order filled · ${msg}`, ok: true } : s));
      addStep({ id: "ok", phase: "result", text: "Trade executed successfully", ok: true });
      speak(msg);
    } else {
      setSteps((prev) => prev.map((s) => s.id === "e" ? { ...s, text: `Order rejected: ${result.error}`, ok: false } : s));
      speak(`Trade rejected. ${result.error}`);
    }
  };

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      setPartial("");
      return;
    }
    const rec = createRecognizer({
      onPartial: (t) => setPartial(t),
      onFinal: (t) => { setPartial(""); void handleCommand(t); },
      onError: (e) => { console.warn("speech error", e); },
    });
    if (!rec.supported) { setSupported(false); return; }
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const runExample = (cmd: string) => handleCommand(cmd);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT - Mic */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Voice Command Center</h2>
            <p className="text-xs text-muted-foreground">Tap the mic and speak — your AI agent will handle the rest.</p>
          </div>
          <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${listening ? "bg-accent/90 text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
            {listening ? "● LIVE" : "IDLE"}
          </span>
        </div>

        <div className="my-10 flex flex-col items-center justify-center min-h-[260px]">
          <div className="relative">
            {listening && (
              <>
                <span className="absolute inset-0 rounded-full bg-accent/30 sonar-ring" />
                <span className="absolute inset-0 rounded-full bg-accent/20 sonar-ring" style={{ animationDelay: "0.6s" }} />
                <span className="absolute inset-0 rounded-full bg-accent/15 sonar-ring" style={{ animationDelay: "1.2s" }} />
              </>
            )}
            <button
              onClick={toggle}
              className={`relative h-32 w-32 rounded-full grid place-items-center transition-all ${
                listening
                  ? "bg-gradient-to-br from-accent to-destructive shadow-[var(--shadow-accent-glow)]"
                  : "bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)] breathe"
              }`}
              aria-label={listening ? "Stop listening" : "Start listening"}
            >
              {listening ? <MicOff className="h-12 w-12 text-white" /> : <Mic className="h-12 w-12 text-white" />}
            </button>
          </div>

          <div className="mt-6 text-center min-h-[60px] max-w-md">
            {!supported && (
              <p className="text-sm text-destructive flex items-center gap-2 justify-center">
                <AlertTriangle className="h-4 w-4" /> Web Speech API not supported. Try Chrome or Edge, or use an example below.
              </p>
            )}
            {supported && listening && !partial && !finalText && (
              <p className="text-sm text-muted-foreground">Listening... say something like "Buy 100 dollars of Nvidia"</p>
            )}
            {partial && <p className="text-xl text-foreground font-medium">{partial}<span className="ml-1 animate-pulse">|</span></p>}
            {!listening && finalText && (
              <p className="text-sm text-muted-foreground">Last: <span className="text-foreground">"{finalText}"</span></p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Try these</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => runExample(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary border border-border hover:border-primary/40 transition">
                {ex}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* RIGHT - Agent activity */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Agent Activity</h2>
          <span className="text-xs text-muted-foreground">{intent ? intentSummary(intent) : "Waiting for command..."}</span>
        </div>

        <div className="space-y-2 min-h-[420px]">
          <AnimatePresence>
            {steps.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-20">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Issue a voice command to watch the AI think in real-time.
              </div>
            )}
            {steps.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex gap-3 p-3 rounded-lg border ${
                  s.ok === false ? "border-destructive/40 bg-destructive/10" :
                  s.ok ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"
                }`}>
                <div className="mt-0.5">{stepIcon(s)}</div>
                <div className="flex-1 text-sm">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{s.phase}</div>
                  <div className="text-foreground/95">{s.text}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Volume2 className="h-3 w-3" /> Voice confirmation enabled · Demo mode (no real funds)
        </div>
      </Card>
    </div>
  );
}

function stepIcon(s: AgentStep) {
  if (s.ok === false) return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (s.ok) return <CheckCircle2 className="h-4 w-4 text-success" />;
  return <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
