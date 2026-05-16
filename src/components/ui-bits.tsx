import { ReactNode } from "react";
import { motion } from "framer-motion";

export function Card({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`card-surface p-5 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function Sparkline({ data, color = "var(--color-primary)" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const w = 120, h = 36;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth={1.6} points={pts} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
