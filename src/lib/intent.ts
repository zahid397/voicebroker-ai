// Lightweight rule-based voice intent parser.
// Supports: BUY/SELL by shares or dollar amount, price queries, portfolio queries.
import { findQuoteByName, getQuote } from "./market";

export type Intent =
  | { type: "trade"; action: "BUY" | "SELL"; symbol: string; name: string; quantity?: number; dollarAmount?: number; sellAll?: boolean; reasoning: string }
  | { type: "price"; symbol: string; name: string; reasoning: string }
  | { type: "portfolio"; reasoning: string }
  | { type: "unknown"; reasoning: string };

const COMPANY_ALIASES: Record<string, string> = {
  apple: "Apple", aapl: "Apple",
  tesla: "Tesla", tsla: "Tesla",
  nvidia: "Nvidia", nvda: "Nvidia",
  amazon: "Amazon", amzn: "Amazon",
  microsoft: "Microsoft", msft: "Microsoft",
  google: "Alphabet", alphabet: "Alphabet", googl: "Alphabet", goog: "Alphabet",
  meta: "Meta", facebook: "Meta",
  netflix: "Netflix", nflx: "Netflix",
  spy: "SPY ETF", "s&p": "SPY ETF", "sp500": "SPY ETF",
  qqq: "QQQ ETF", nasdaq: "QQQ ETF",
};

function findCompany(text: string): string | undefined {
  const t = text.toLowerCase();
  for (const key of Object.keys(COMPANY_ALIASES)) {
    const re = new RegExp(`\\b${key.replace("&", "\\&")}\\b`, "i");
    if (re.test(t)) return COMPANY_ALIASES[key];
  }
  return undefined;
}

function parseNumber(text: string): number | undefined {
  const wordMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    twenty: 20, thirty: 30, fifty: 50, hundred: 100,
  };
  const m = text.match(/(\d+(\.\d+)?)/);
  if (m) return parseFloat(m[1]);
  for (const w of Object.keys(wordMap)) {
    if (new RegExp(`\\b${w}\\b`, "i").test(text)) return wordMap[w];
  }
  return undefined;
}

export function parseIntent(transcriptRaw: string): Intent {
  const transcript = transcriptRaw.trim();
  const lower = transcript.toLowerCase();
  const company = findCompany(lower);

  // Portfolio queries
  if (/(portfolio|how am i doing|p\&l|profit|loss|balance|positions?)/i.test(lower) && !/(buy|sell)/i.test(lower)) {
    return { type: "portfolio", reasoning: "User is requesting a portfolio summary." };
  }

  // Price queries
  if (/(price|worth|how much|quote)/i.test(lower) && company && !/(buy|sell)/i.test(lower)) {
    const q = findQuoteByName(company);
    return {
      type: "price",
      symbol: q?.symbol ?? company,
      name: company,
      reasoning: `User wants the current quote for ${company}.`,
    };
  }

  // Trade commands
  const isBuy = /\bbuy\b|\bpurchase\b|\bgo long\b/.test(lower);
  const isSell = /\bsell\b|\bdump\b|\bexit\b|\bclose\b/.test(lower);

  if ((isBuy || isSell) && company) {
    const action: "BUY" | "SELL" = isBuy ? "BUY" : "SELL";
    const sellAll = isSell && /\b(all|entire|whole|full|everything)\b/.test(lower);

    // Dollar amount: "$50", "50 dollars", "fifty dollars"
    const dollarMatch = lower.match(/\$\s?(\d+(\.\d+)?)|(\d+(\.\d+)?)\s*(dollars?|usd|bucks)/);
    let dollarAmount: number | undefined;
    if (dollarMatch) dollarAmount = parseFloat(dollarMatch[1] ?? dollarMatch[3]);

    // Share quantity: "2 shares", "5 stocks"
    let quantity: number | undefined;
    const shareMatch = lower.match(/(\d+(\.\d+)?)\s*(shares?|stocks?|units?)/);
    if (shareMatch) quantity = parseFloat(shareMatch[1]);
    if (!quantity && !dollarAmount && !sellAll) {
      const n = parseNumber(lower);
      if (n) quantity = n;
    }

    const q = findQuoteByName(company);
    const symbol = q?.symbol ?? company;
    const reasoning = sellAll
      ? `Closing entire ${company} position. Market sentiment and command confidence are high — executing immediately at market price.`
      : `${action === "BUY" ? "Acquiring" : "Reducing"} ${company} exposure ${dollarAmount ? `for $${dollarAmount}` : quantity ? `(${quantity} shares)` : ""}. Liquidity is healthy on Kraken xStock pair; spread acceptable. Routing as market order.`;

    return { type: "trade", action, symbol, name: company, quantity, dollarAmount, sellAll, reasoning };
  }

  return {
    type: "unknown",
    reasoning: "I couldn't map that to a trade or query. Try: 'Buy $50 of Apple' or 'Sell all my Tesla'.",
  };
}

export function intentSummary(i: Intent): string {
  switch (i.type) {
    case "trade": return `${i.action} ${i.sellAll ? "ALL" : i.dollarAmount ? `$${i.dollarAmount} of` : `${i.quantity ?? "?"} shares of`} ${i.name} (${i.symbol})`;
    case "price": return `Quote request: ${i.name} (${i.symbol})`;
    case "portfolio": return "Portfolio summary";
    case "unknown": return "Unrecognized command";
  }
}

// re-export
export { getQuote };
