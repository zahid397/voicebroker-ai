🎙️ VoiceBroker AI

> The world's first fully autonomous voice-activated xStock trading desk
Built for the AI Agent Olympics Hackathon 2026 at Milan AI Week










---

👤 Lead Developer

Zahid Hasan — github.com/zahid397


---

🏆 Hackathon Tracks

Multimodal Intelligence — Voice → Text → Trade Decision

Speechmatics Challenge — Real-time speech-to-text

Kraken xStocks Challenge — Autonomous trading agent

Vultr Award — Deployed on Vultr VM



---

🚀 Demo

Live Demo Login:

Email: demo@voicebroker.ai

Password: password123


Try saying: "Buy $50 of Apple stock" or "What's my portfolio worth?"


---

🧠 How It Works

User Voice Input  
      ↓  
Speechmatics STT (real-time WebSocket)  
      ↓  
Transcript Text  
      ↓  
Gemini AI (intent parsing + market analysis)  
      ↓  
Trade Decision + Risk Check  
      ↓  
Kraken API (execution / demo simulation)  
      ↓  
Supabase (portfolio update + history)  
      ↓  
Voice Confirmation (TTS)


---

🛠 Tech Stack

Layer	Technology

Frontend	React 18 + TypeScript + Vite
Styling	Tailwind CSS + Framer Motion
Speech-to-Text	Speechmatics real-time API (WebSocket)
AI Engine	Google Gemini 1.5 Flash
Market Data	Kraken REST API (public, no key needed)
Auth + DB	Supabase (free tier)
Charts	Recharts
Deployment	Vultr VM + Vercel



---

⚡ Quick Start

git clone https://github.com/zahid397/voicebroker-ai  
cd voicebroker-ai  
npm install  
cp .env.example .env  
# Fill in your API keys (or leave VITE_DEMO_MODE=true to run without any keys)  
npm run dev

Minimum viable setup (demo mode — no keys needed):

VITE_DEMO_MODE=true

Full setup:

VITE_SUPABASE_URL=your_supabase_url  
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key  
VITE_GEMINI_API_KEY=your_gemini_key       # Free: 15 req/min  
VITE_SPEECHMATICS_API_KEY=your_key        # $200 free credits  
VITE_DEMO_MODE=false


---

📱 Pages

Route	Description

/dashboard	Portfolio overview, KPIs, recent trades
/voice-trade	Main feature — voice interface + AI processing panel
/portfolio	Holdings table, allocation charts
/market	Live xStock prices (Kraken API)
/history	Full trade history with AI reasoning
/insights	Gemini-powered briefings + what-if simulator
/alerts	Autonomous alert + auto-execute engine
/demo	Architecture diagram + hackathon submission



---

🎯 Voice Commands

"Buy $50 of Apple stock right now"  
"Sell my Tesla position"  
"What's my portfolio worth today?"  
"Set alert: buy NVIDIA if price drops below $800"  
"Should I buy or sell Tesla?"  
"Which stock is performing best?"


---

🗄 Supabase Schema

-- Run these in your Supabase SQL editor  
CREATE TABLE profiles (id uuid references auth.users, name text, role text default 'trader', balance numeric default 10000, created_at timestamptz default now());  
CREATE TABLE portfolio (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, symbol text, quantity numeric, avg_buy_price numeric, current_price numeric, pnl numeric, updated_at timestamptz default now());  
CREATE TABLE trades (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, symbol text, action text, quantity numeric, price numeric, total_value numeric, status text, trigger text, voice_command text, ai_reasoning text, created_at timestamptz default now());  
CREATE TABLE voice_sessions (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, transcript text, intent text, action_taken text, created_at timestamptz default now());  
CREATE TABLE market_alerts (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, symbol text, condition text, threshold numeric, action text, amount numeric, is_active boolean default true, created_at timestamptz default now());  
  
-- Enable RLS on all tables  
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;  
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;  
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;  
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE market_alerts ENABLE ROW LEVEL SECURITY;


---

📄 License

MIT © 2026 Zahid Hasan
