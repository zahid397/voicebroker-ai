import { createFileRoute } from "@tanstack/react-router";
import { Card, Sparkline } from "@/components/ui-bits";
import { useQuotes } from "@/lib/market";
import { executeTrade } from "@/lib/portfolio";
import { ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";

export const Route = createFileRoute("/market")({
  component: Market,
  head: () => ({ meta: [{ title: "Market Data — VoiceBroker AI" }] }),
});

function Market() {
  const quotes = useQuotes();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Live xStock quotes · streaming via Kraken (simulated in demo mode)</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quotes.map((q, i) => {
          const up = q.changePct >= 0;
          return (
            <Card key={q.symbol} delay={i * 0.04}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{q.name}</div>
                  <div className="font-semibold">{q.symbol}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {up ? "+" : ""}{q.changePct.toFixed(2)}%
                </span>
              </div>
              <div className="my-3">
                <Sparkline data={q.history.slice(-30)} color={up ? "oklch(0.72 0.18 150)" : "oklch(0.65 0.24 25)"} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono">${q.price.toFixed(2)}</div>
                  <div className={`text-xs font-mono flex items-center gap-0.5 ${up ? "text-success" : "text-destructive"}`}>
                    {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {up ? "+" : ""}${q.change.toFixed(2)}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => executeTrade({ symbol: q.symbol, action: "BUY", dollarAmount: 100, trigger: "manual" })}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-success/15 text-success hover:bg-success/25 border border-success/30 transition">
                    BUY
                  </button>
                  <button onClick={() => executeTrade({ symbol: q.symbol, action: "SELL", dollarAmount: 100, trigger: "manual" })}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30 transition">
                    SELL
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2">
        <Zap className="h-3 w-3 text-accent" /> Prices update every 2.2 seconds. Manual quick-trades use $100 default size.
      </div>
    </div>
  );
}
