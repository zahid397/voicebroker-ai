import { createFileRoute } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui-bits";
import { portfolioValue, totalPnl, usePortfolio } from "@/lib/portfolio";
import { getQuote, useQuotes } from "@/lib/market";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export const Route = createFileRoute("/portfolio")({
  component: Portfolio,
  head: () => ({ meta: [{ title: "Portfolio — VoiceBroker AI" }] }),
});

const COLORS = ["oklch(0.62 0.21 285)", "oklch(0.72 0.19 50)", "oklch(0.72 0.18 150)", "oklch(0.78 0.17 80)", "oklch(0.65 0.24 25)", "oklch(0.6 0.18 220)", "oklch(0.68 0.2 320)"];

function Portfolio() {
  const state = usePortfolio();
  useQuotes();
  const value = portfolioValue(state.positions);
  const pnl = totalPnl(state.positions);
  const total = value + state.cash;

  const allocData = state.positions.map((p) => {
    const q = getQuote(p.base);
    return { name: p.base, value: +((q?.price ?? p.avgPrice) * p.quantity).toFixed(2) };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Value</div>
          <div className="text-3xl font-bold font-mono mt-1">${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          <div className="text-xs text-muted-foreground mt-1">Cash: ${state.cash.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Unrealized P&L</div>
          <div className={`text-3xl font-bold font-mono mt-1 ${pnl.abs >= 0 ? "text-success" : "text-destructive"}`}>
            {pnl.abs >= 0 ? "+" : ""}${pnl.abs.toFixed(2)}
          </div>
          <div className={`text-xs mt-1 ${pnl.abs >= 0 ? "text-success" : "text-destructive"}`}>{pnl.pct.toFixed(2)}%</div>
        </Card>
        <Card>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Allocation</div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocData} dataKey="value" innerRadius={28} outerRadius={44} paddingAngle={2}>
                  {allocData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold mb-3">Positions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="py-2 pr-3">Symbol</th>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3 text-right">Qty</th>
                <th className="py-2 px-3 text-right">Avg Price</th>
                <th className="py-2 px-3 text-right">Current</th>
                <th className="py-2 px-3 text-right">Value</th>
                <th className="py-2 pl-3 text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {state.positions.map((p) => {
                const q = getQuote(p.base);
                const cur = q?.price ?? p.avgPrice;
                const val = cur * p.quantity;
                const pl = (cur - p.avgPrice) * p.quantity;
                const plPct = ((cur - p.avgPrice) / p.avgPrice) * 100;
                const up = pl >= 0;
                return (
                  <tr key={p.symbol} className="border-b border-border/50 hover:bg-secondary/40">
                    <td className="py-3 pr-3 font-semibold">{p.symbol}</td>
                    <td className="py-3 px-3 text-muted-foreground">{p.name}</td>
                    <td className="py-3 px-3 text-right font-mono">{p.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono">${p.avgPrice.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono">${cur.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono">${val.toFixed(2)}</td>
                    <td className={`py-3 pl-3 text-right font-mono ${up ? "text-success" : "text-destructive"}`}>
                      <span className="inline-flex items-center gap-0.5">
                        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {up ? "+" : ""}${pl.toFixed(2)} ({plPct.toFixed(2)}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
