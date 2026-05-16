// Mock xStock market data with live simulated movement
import { useSyncExternalStore } from "react";

export interface Quote {
  symbol: string;       // AAPL.x
  name: string;
  base: string;         // AAPL
  price: number;
  change: number;       // absolute today
  changePct: number;
  history: number[];    // last N prices for sparkline
}

const seed: Omit<Quote, "change" | "changePct" | "history">[] = [
  { symbol: "AAPL.x", base: "AAPL", name: "Apple", price: 213.45 },
  { symbol: "TSLA.x", base: "TSLA", name: "Tesla", price: 248.12 },
  { symbol: "NVDA.x", base: "NVDA", name: "Nvidia", price: 887.20 },
  { symbol: "AMZN.x", base: "AMZN", name: "Amazon", price: 192.35 },
  { symbol: "MSFT.x", base: "MSFT", name: "Microsoft", price: 421.80 },
  { symbol: "GOOGL.x", base: "GOOGL", name: "Alphabet", price: 178.42 },
  { symbol: "META.x", base: "META", name: "Meta", price: 512.66 },
  { symbol: "NFLX.x", base: "NFLX", name: "Netflix", price: 685.10 },
  { symbol: "SPY.x", base: "SPY", name: "SPY ETF", price: 528.30 },
  { symbol: "QQQ.x", base: "QQQ", name: "QQQ ETF", price: 462.95 },
];

// Deterministic seed history (SSR-safe — no Math.random at module init)
let quotes: Quote[] = seed.map((s, si) => {
  const hist = Array.from({ length: 30 }, (_, i) =>
    +(s.price * (1 + Math.sin((i + si) / 4) * 0.01 + Math.cos((i * (si + 1)) / 7) * 0.004)).toFixed(2)
  );
  hist.push(s.price);
  const open = hist[0];
  return {
    ...s,
    history: hist,
    change: +(s.price - open).toFixed(2),
    changePct: +(((s.price - open) / open) * 100).toFixed(2),
  };
});

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function tick() {
  quotes = quotes.map((q) => {
    const drift = (Math.random() - 0.5) * q.price * 0.003;
    const price = +(q.price + drift).toFixed(2);
    const history = [...q.history.slice(-49), price];
    const open = history[0];
    return {
      ...q,
      price,
      history,
      change: +(price - open).toFixed(2),
      changePct: +(((price - open) / open) * 100).toFixed(2),
    };
  });
  emit();
}

if (typeof window !== "undefined") {
  setInterval(tick, 2200);
}

export function getQuotes(): Quote[] { return quotes; }
export function getQuote(symbolOrBase: string): Quote | undefined {
  const u = symbolOrBase.toUpperCase().replace(".X", "");
  return quotes.find((q) => q.base === u || q.symbol.toUpperCase() === symbolOrBase.toUpperCase());
}
export function findQuoteByName(name: string): Quote | undefined {
  const n = name.toLowerCase();
  return quotes.find((q) => q.name.toLowerCase() === n || q.base.toLowerCase() === n);
}

export function useQuotes(): Quote[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => quotes,
    () => quotes,
  );
}
