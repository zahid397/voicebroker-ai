import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui-bits";
import { portfolioValue, totalPnl, usePortfolio } from "@/lib/portfolio";
import { useQuotes } from "@/lib/market";
import { Brain, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/insights")({
  component: Insights,
  head: () => ({ meta: [{ title: "AI Insights — VoiceBroker AI" }] }),
});

function Gauge({ value, label }: { value: number; label: string }) {
  const r = 42, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} stroke="var(--color-border)" strokeWidth="8" fill="none" />
        <circle cx="55" cy="55" r={r} stroke="url(#gg)" strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 55 55)" />
        <defs>
          <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.21 285)" />
            <stop offset="100%" stopColor="oklch(0.72 0.19 50)" />
          </linearGradient>
        </defs>
        <text x="55" y="58" textAnchor="middle" className="fill-foreground font-bold" fontSize="22">{value}</text>
        <text x="55" y="74" textAnchor="middle" className="fill-muted-foreground" fontSize="9">/ 100</text>
      </svg>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Insights() {
  const state = usePortfolio();
  useQuotes();
  const value = portfolioValue(state.positions);
  const pnl = totalPnl(state.positions);

  const diversification = Math.min(100, state.positions.length * 12 + 10);
  const risk = Math.max(20, 100 - Math.abs(pnl.pct) * 4);
  const perf = Math.max(0, Math.min(100, 60 + pnl.pct * 3));
  const overall = Math.round((diversification + risk + perf) / 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 flex flex-col items-center text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Portfolio Health</div>
        <div className="my-4"><Gauge value={overall} label={overall > 75 ? "Excellent" : overall > 55 ? "Good" : "Needs Attention"} /></div>
        <div className="grid grid-cols-3 gap-3 w-full text-xs">
          <Stat label="Diversification" v={diversification} />
          <Stat label="Risk" v={risk} />
          <Stat label="Performance" v={perf} />
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">AI Daily Briefing</h3>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-primary/15 text-primary uppercase tracking-wider">Gemini</span>
        </div>
        <div className="text-sm leading-relaxed text-foreground/90 space-y-3">
          <p>
            Good morning, Zahid. Your portfolio is currently worth <b className="font-mono">${(value + state.cash).toFixed(2)}</b>, with an unrealized P&L of{" "}
            <b className={`font-mono ${pnl.abs >= 0 ? "text-success" : "text-destructive"}`}>
              {pnl.abs >= 0 ? "+" : ""}${pnl.abs.toFixed(2)} ({pnl.pct.toFixed(2)}%)
            </b>.
          </p>
          <p>
            <Sparkles className="inline h-3.5 w-3.5 text-accent mr-1" />
            <b>NVDA</b> continues to lead your gainers thanks to sustained AI infrastructure demand.
            Consider trimming a partial position above $900 to lock in gains.
          </p>
          <p>
            <TrendingUp className="inline h-3.5 w-3.5 text-success mr-1" />
            Your <b>SPY</b> allocation provides stable beta exposure. The agent recommends maintaining current weight while
            broader market volatility remains contained.
          </p>
          <p>
            Risk score sits at <b className="font-mono">{risk.toFixed(0)}/100</b>. To improve diversification, consider exposure
            outside of US large-cap tech — gold or treasury proxies via xStocks would lower correlation.
          </p>
        </div>
      </Card>

      <Card className="lg:col-span-3">
        <h3 className="font-semibold mb-3">Agent Architecture</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-xs">
          {[
            { t: "Voice Input", s: "Web Speech / Speechmatics" },
            { t: "Intent Parser", s: "Gemini 1.5 Flash" },
            { t: "Market Data", s: "Kraken xStocks API" },
            { t: "Trade Engine", s: "Demo Executor" },
            { t: "Confirmation", s: "TTS Voice" },
          ].map((b, i) => (
            <div key={i} className="card-surface p-3">
              <div className="text-sm font-semibold brand-text">{b.t}</div>
              <div className="text-muted-foreground mt-1">{b.s}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="p-2 rounded-md bg-secondary/40 border border-border">
      <div className="text-foreground font-mono font-bold">{v.toFixed(0)}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
