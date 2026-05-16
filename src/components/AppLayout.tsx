import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Mic, PieChart, TrendingUp, History, Brain, Bell, Settings, Circle, Menu, X, Languages,
} from "lucide-react";
import { portfolioValue, totalPnl, usePortfolio } from "@/lib/portfolio";
import { useMounted } from "@/hooks/use-mounted";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/voice-trade", label: "Voice Trade", icon: Mic, badge: "LIVE" },
  { to: "/translator", label: "AI Translator", icon: Languages, badge: "NEW" },
  { to: "/portfolio", label: "Portfolio", icon: PieChart },
  { to: "/market", label: "Market Data", icon: TrendingUp },
  { to: "/history", label: "Trade History", icon: History },
  { to: "/insights", label: "AI Insights", icon: Brain },
];

export function AppLayout() {
  const loc = useLocation();
  const state = usePortfolio();
  const mounted = useMounted();
  const value = portfolioValue(state.positions);
  const pnl = totalPnl(state.positions);
  const total = value + state.cash;
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  const current = nav.find((n) => (n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to))) ?? nav[0];

  const Sidebar = (
    <>
      <div className="px-5 py-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="text-2xl">🎙️</span>
            <span className="brand-text tracking-tight">VoiceBroker AI</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Voice-Activated xStock Trading</p>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden p-2 -mr-2 text-muted-foreground" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="px-3 flex-1 space-y-1 overflow-y-auto scroll-thin">
        {nav.map((n) => {
          const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                active
                  ? "bg-primary/15 text-foreground shadow-[inset_2px_0_0_0_var(--color-primary)]"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
              <span className="flex-1">{n.label}</span>
              {n.badge && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-accent/90 text-accent-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-current live-dot" />
                  {n.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 p-3 rounded-xl card-surface">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center font-bold text-primary-foreground">
            ZH
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">Zahid Hasan</div>
            <div className="text-[11px] text-muted-foreground">Trader · Demo</div>
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Balance</span>
          <span suppressHydrationWarning className="text-sm font-mono font-semibold">${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 border-r border-sidebar-border bg-sidebar flex-col">
        {Sidebar}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] border-r border-sidebar-border bg-sidebar flex flex-col z-50 lg:hidden"
            >
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border px-4 sm:px-6 flex items-center gap-2 sm:gap-4 bg-background/70 backdrop-blur sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-secondary text-foreground" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold truncate">{current.label}</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/30">
              <Circle className="h-2 w-2 fill-current live-dot" />
              Markets Open
            </span>
            <span
              suppressHydrationWarning
              className={`px-2 sm:px-2.5 py-1 rounded-full font-mono font-semibold border text-[10px] sm:text-xs ${
                pnl.abs >= 0
                  ? "bg-success/15 text-success border-success/30"
                  : "bg-destructive/15 text-destructive border-destructive/30"
              }`}
            >
              {pnl.abs >= 0 ? "+" : ""}${pnl.abs.toFixed(2)} ({pnl.pct.toFixed(2)}%)
            </span>
            <button className="hidden sm:block p-2 rounded-lg hover:bg-secondary text-muted-foreground"><Bell className="h-4 w-4" /></button>
            <button className="hidden sm:block p-2 rounded-lg hover:bg-secondary text-muted-foreground"><Settings className="h-4 w-4" /></button>
          </div>
        </header>

        <motion.main
          key={loc.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 px-4 sm:px-6 py-4 sm:py-6 max-w-[1500px] w-full mx-auto"
          style={{ background: "var(--gradient-glow)" }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
