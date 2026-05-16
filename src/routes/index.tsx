import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet, TrendingUp, Briefcase, Mic, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { Card, Sparkline } from "@/components/ui-bits";
import { usePortfolio, portfolioValue, totalPnl } from "@/lib/portfolio";
import { useQuotes, getQuote } from "@/lib/market";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useMounted } from "@/hooks/use-mounted";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — VoiceBroker AI" }] }),
});

function fmt(n: number) { return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function Dashboard() {
  const mounted = useMounted();
  const state = usePortfolio();
  useQuotes(); // subscribe to live prices
  const value = portfolioValue(state.positions);
  const pnl = totalPnl(state.positions);
  const total = value + state.cash;

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm">Loading live market data...</span>
        </div>
      </div>
    );
  }

  const perfData = useMemo(() => {
    // build a synthetic 7d curve based on aggregated history
    const len = 30;
    return Array.from({ length: len }, (_, i) => {
      const t = i / (len - 1);
      const v = total * (1 - pnl.pct / 100) + (value - (total - state.cash) * (1 - pnl.pct / 100)) * t;
      return { t: i, value: +v.toFixed(2), spy: +(v * (1 - 0.018) + Math.sin(i / 3) * 30).toFixed(2) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const sortedPositions = [...state.positions].sort((a, b) => {
    const qa = getQuote(a.base)?.price ?? 0;
    const qb = getQuote(b.base)?.price ?? 0;
    return (qb * b.quantity) - (qa * a.quantity);
  });

  return (
    <div className="space-y-6">
      <div>
        <motion.h2 initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold tracking-tight">
          Welcome back, <span className="brand-text">Zahid Hasan</span>
        </motion.h2>
        <p className="text-sm text-muted-foreground mt-1">Your autonomous trading agent is active and monitoring markets in real-time.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi delay={0.0} icon={<Wallet className="h-4 w-4" />} label="Portfolio Value"
          value={`$${fmt(total)}`} change={pnl.abs} changePct={pnl.pct}
          spark={perfData.map((p) => p.value)} />
        <Kpi delay={0.08} icon={<TrendingUp className="h-4 w-4" />} label="Today's P&L"
          value={`${pnl.abs >= 0 ? "+" : ""}$${fmt(Math.abs(pnl.abs))}`} change={pnl.abs} changePct={pnl.pct}
          spark={perfData.map((p) => p.value)} />
        <Kpi delay={0.16} icon={<Briefcase className="h-4 w-4" />} label="Active Positions"
          value={`${state.positions.length}`}
          sub={state.positions.slice(0, 4).map((p) => p.base).join(" · ")} />
        <Kpi delay={0.24} icon={<Mic className="h-4 w-4" />} label="Voice Commands Today"
          value={`${state.voiceCommandsToday}`}
          sub={`${state.trades.filter((t) => t.trigger === "voice").length} trades executed by voice`} />
      </div>

      {/* Chart + Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card delay={0.1} className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Portfolio Performance</h3>
              <p className="text-xs text-muted-foreground">Last 30 ticks · vs SPY benchmark</p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">${fmt(total)}</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={perfData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.21 285)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.62 0.21 285)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "var(--color-muted-foreground)" }}
                />
                <Area type="monotone" dataKey="spy" stroke="oklch(0.72 0.19 50)" strokeOpacity={0.5} fillOpacity={0} strokeDasharray="4 4" />
                <Area type="monotone" dataKey="value" stroke="oklch(0.62 0.21 285)" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card delay={0.18} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Active Positions</h3>
            <Link to="/portfolio" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto scroll-thin pr-1">
            {sortedPositions.map((p) => {
              const q = getQuote(p.base);
              const cur = q?.price ?? p.avgPrice;
              const pnlPct = ((cur - p.avgPrice) / p.avgPrice) * 100;
              const up = pnlPct >= 0;
              return (
                <div key={p.symbol} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/60 transition">
                  <div className="w-12">
                    <div className="text-sm font-semibold">{p.base}</div>
                    <div className="text-[10px] text-muted-foreground">{p.quantity}</div>
                  </div>
                  <div className="flex-1">
                    <Sparkline data={q?.history.slice(-20) ?? [cur, cur]} color={up ? "oklch(0.72 0.18 150)" : "oklch(0.65 0.24 25)"} />
                  </div>
                  <div className={`text-right text-xs font-mono ${up ? "text-success" : "text-destructive"}`}>
                    <div className="flex items-center justify-end gap-0.5">
                      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {pnlPct.toFixed(2)}%
                    </div>
                    <div className="text-foreground/80">${cur.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent voice + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card delay={0.22}>
          <h3 className="font-semibold mb-3">Recent Voice Commands</h3>
          {state.trades.filter((t) => t.trigger === "voice").slice(0, 5).length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No voice commands yet. <Link to="/voice-trade" className="text-primary hover:underline">Start trading by voice →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {state.trades.filter((t) => t.trigger === "voice").slice(0, 5).map((t) => (
                <div key={t.id} className="flex gap-3 text-sm">
                  <div className="mt-0.5">🎤</div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-foreground/90">"{t.voiceCommand}"</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <span className="text-success">✓</span> {t.action} {t.quantity} {t.symbol} @ ${t.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card delay={0.28}>
          <h3 className="font-semibold mb-3">AI Market Alerts</h3>
          <div className="space-y-2">
            {[
              { sym: "NVDA", cond: "Price above $900", action: "Auto-sell 0.25 shares", on: true },
              { sym: "TSLA", cond: "Drop > 5%", action: "Notify", on: true },
              { sym: "SPY", cond: "Volatility spike", action: "Hedge", on: false },
            ].map((a) => (
              <div key={a.sym} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary/40 border border-border">
                <div>
                  <div className="text-sm font-semibold">{a.sym} <span className="text-muted-foreground font-normal text-xs ml-1">· {a.cond}</span></div>
                  <div className="text-[11px] text-muted-foreground">{a.action}</div>
                </div>
                <span className={`h-5 w-9 rounded-full relative transition ${a.on ? "bg-primary" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-foreground transition ${a.on ? "left-4" : "left-0.5"}`} />
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, change, changePct, spark, sub, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string;
  change?: number; changePct?: number; spark?: number[]; sub?: string; delay?: number;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <Card delay={delay}>
      <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wider">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="text-2xl font-bold font-mono">{value}</div>
        {spark && <div className="opacity-80"><Sparkline data={spark} color={up ? "oklch(0.72 0.18 150)" : "oklch(0.65 0.24 25)"} /></div>}
      </div>
      {change !== undefined && changePct !== undefined ? (
        <div className={`mt-2 inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-md ${up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {up ? "+" : ""}{change.toFixed(2)} ({changePct.toFixed(2)}%)
        </div>
      ) : sub ? (
        <div className="mt-2 text-xs text-muted-foreground truncate">{sub}</div>
      ) : null}
    </Card>
  );
}
