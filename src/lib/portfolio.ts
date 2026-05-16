import { useSyncExternalStore } from "react";
import { getQuote } from "./market";

export interface Position {
  symbol: string;   // AAPL.x
  base: string;
  name: string;
  quantity: number;
  avgPrice: number;
}

export interface Trade {
  id: string;
  symbol: string;
  action: "BUY" | "SELL";
  quantity: number;
  price: number;
  total: number;
  status: "executed" | "pending" | "cancelled";
  trigger: "voice" | "auto" | "manual";
  voiceCommand?: string;
  aiReasoning?: string;
  createdAt: number;
}

interface State {
  cash: number;
  positions: Position[];
  trades: Trade[];
  voiceCommandsToday: number;
}

let state: State = {
  cash: 5000,
  positions: [
    { symbol: "AAPL.x", base: "AAPL", name: "Apple", quantity: 2, avgPrice: 210 },
    { symbol: "NVDA.x", base: "NVDA", name: "Nvidia", quantity: 0.5, avgPrice: 820 },
    { symbol: "SPY.x", base: "SPY", name: "SPY ETF", quantity: 1, avgPrice: 510 },
    { symbol: "TSLA.x", base: "TSLA", name: "Tesla", quantity: 3, avgPrice: 240 },
    { symbol: "MSFT.x", base: "MSFT", name: "Microsoft", quantity: 1.5, avgPrice: 410 },
    { symbol: "META.x", base: "META", name: "Meta", quantity: 0.8, avgPrice: 495 },
    { symbol: "GOOGL.x", base: "GOOGL", name: "Alphabet", quantity: 4, avgPrice: 172 },
  ],
  trades: [],
  voiceCommandsToday: 0,
};

const listeners = new Set<() => void>();
const emit = () => { listeners.forEach((l) => l()); };
const subscribe = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb); };

export function usePortfolio(): State {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function getState() { return state; }

export function executeTrade(input: {
  symbol: string;       // AAPL.x or AAPL
  action: "BUY" | "SELL";
  quantity?: number;    // shares
  dollarAmount?: number;
  trigger: Trade["trigger"];
  voiceCommand?: string;
  aiReasoning?: string;
}): { ok: true; trade: Trade } | { ok: false; error: string } {
  const q = getQuote(input.symbol);
  if (!q) return { ok: false, error: `Unknown symbol: ${input.symbol}` };

  let qty = input.quantity ?? 0;
  if (input.dollarAmount && !qty) qty = +(input.dollarAmount / q.price).toFixed(4);
  if (!qty || qty <= 0) return { ok: false, error: "Invalid quantity" };

  const total = +(qty * q.price).toFixed(2);
  const positions = [...state.positions];
  const idx = positions.findIndex((p) => p.base === q.base);

  if (input.action === "BUY") {
    if (total > state.cash) return { ok: false, error: "Insufficient cash" };
    if (idx >= 0) {
      const p = positions[idx];
      const newQty = p.quantity + qty;
      const newAvg = (p.avgPrice * p.quantity + q.price * qty) / newQty;
      positions[idx] = { ...p, quantity: newQty, avgPrice: +newAvg.toFixed(2) };
    } else {
      positions.push({ symbol: q.symbol, base: q.base, name: q.name, quantity: qty, avgPrice: q.price });
    }
    state = { ...state, cash: +(state.cash - total).toFixed(2), positions };
  } else {
    if (idx < 0 || positions[idx].quantity < qty) return { ok: false, error: "Not enough shares to sell" };
    const p = positions[idx];
    const newQty = +(p.quantity - qty).toFixed(4);
    if (newQty <= 0.0001) positions.splice(idx, 1);
    else positions[idx] = { ...p, quantity: newQty };
    state = { ...state, cash: +(state.cash + total).toFixed(2), positions };
  }

  const trade: Trade = {
    id: crypto.randomUUID(),
    symbol: q.symbol,
    action: input.action,
    quantity: qty,
    price: q.price,
    total,
    status: "executed",
    trigger: input.trigger,
    voiceCommand: input.voiceCommand,
    aiReasoning: input.aiReasoning,
    createdAt: Date.now(),
  };
  state = { ...state, trades: [trade, ...state.trades].slice(0, 200) };
  emit();
  return { ok: true, trade };
}

export function bumpVoiceCount() {
  state = { ...state, voiceCommandsToday: state.voiceCommandsToday + 1 };
  emit();
}

export function portfolioValue(positions: Position[]): number {
  return positions.reduce((sum, p) => {
    const q = getQuote(p.base);
    return sum + (q ? q.price * p.quantity : 0);
  }, 0);
}

export function totalPnl(positions: Position[]): { abs: number; pct: number } {
  let cost = 0;
  let value = 0;
  for (const p of positions) {
    const q = getQuote(p.base);
    if (!q) continue;
    cost += p.avgPrice * p.quantity;
    value += q.price * p.quantity;
  }
  const abs = value - cost;
  const pct = cost > 0 ? (abs / cost) * 100 : 0;
  return { abs, pct };
}
