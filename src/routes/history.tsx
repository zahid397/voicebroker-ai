import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui-bits";
import { usePortfolio } from "@/lib/portfolio";
import { Mic, Bot, Hand } from "lucide-react";

export const Route = createFileRoute("/history")({
  component: History,
  head: () => ({ meta: [{ title: "Trade History — VoiceBroker AI" }] }),
});

const filters = ["all", "voice", "auto", "manual"] as const;
type Filter = typeof filters[number];

function History() {
  const state = usePortfolio();
  const [f, setF] = useState<Filter>("all");
  const list = state.trades.filter((t) => f === "all" || t.trigger === f);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Trade History</h2>
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/60 border border-border">
          {filters.map((x) => (
            <button key={x} onClick={() => setF(x)}
              className={`px-3 py-1 text-xs rounded-md capitalize transition ${f === x ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {x}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">No trades yet. Head to Voice Trade to make your first one.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 px-3">Symbol</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3 text-right">Qty</th>
                <th className="py-2 px-3 text-right">Price</th>
                <th className="py-2 px-3 text-right">Total</th>
                <th className="py-2 px-3">Trigger</th>
                <th className="py-2 pl-3">Reasoning</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/40 align-top">
                  <td className="py-3 pr-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(t.createdAt).toLocaleTimeString()}</td>
                  <td className="py-3 px-3 font-semibold">{t.symbol}</td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${t.action === "BUY" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{t.action}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{t.quantity.toFixed(4)}</td>
                  <td className="py-3 px-3 text-right font-mono">${t.price.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono">${t.total.toFixed(2)}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-xs">
                      {t.trigger === "voice" ? <Mic className="h-3 w-3 text-accent" /> : t.trigger === "auto" ? <Bot className="h-3 w-3 text-primary" /> : <Hand className="h-3 w-3 text-muted-foreground" />}
                      {t.trigger}
                    </span>
                  </td>
                  <td className="py-3 pl-3 text-xs text-muted-foreground max-w-md">
                    {t.voiceCommand && <div className="italic text-foreground/80 mb-0.5">"{t.voiceCommand}"</div>}
                    {t.aiReasoning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
