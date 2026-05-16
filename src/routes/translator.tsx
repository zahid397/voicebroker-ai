import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, ArrowRightLeft, Loader2, Languages, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui-bits";
import { aiTranslate } from "@/lib/ai.functions";

export const Route = createFileRoute("/translator")({
  component: TranslatorPage,
  head: () => ({ meta: [{ title: "AI Translator — VoiceBroker AI" }] }),
});

const LANGS: Array<{ code: string; label: string; bcp47: string }> = [
  { code: "en", label: "English", bcp47: "en-US" },
  { code: "bn", label: "Bengali / বাংলা", bcp47: "bn-BD" },
  { code: "hi", label: "Hindi / हिन्दी", bcp47: "hi-IN" },
  { code: "ur", label: "Urdu / اردو", bcp47: "ur-PK" },
  { code: "ar", label: "Arabic / العربية", bcp47: "ar-SA" },
  { code: "es", label: "Spanish / Español", bcp47: "es-ES" },
  { code: "fr", label: "French / Français", bcp47: "fr-FR" },
  { code: "de", label: "German / Deutsch", bcp47: "de-DE" },
  { code: "it", label: "Italian / Italiano", bcp47: "it-IT" },
  { code: "pt", label: "Portuguese / Português", bcp47: "pt-BR" },
  { code: "ru", label: "Russian / Русский", bcp47: "ru-RU" },
  { code: "ja", label: "Japanese / 日本語", bcp47: "ja-JP" },
  { code: "ko", label: "Korean / 한국어", bcp47: "ko-KR" },
  { code: "zh", label: "Chinese / 中文", bcp47: "zh-CN" },
  { code: "tr", label: "Turkish / Türkçe", bcp47: "tr-TR" },
  { code: "nl", label: "Dutch / Nederlands", bcp47: "nl-NL" },
  { code: "pl", label: "Polish / Polski", bcp47: "pl-PL" },
  { code: "id", label: "Indonesian", bcp47: "id-ID" },
  { code: "ms", label: "Malay", bcp47: "ms-MY" },
  { code: "vi", label: "Vietnamese / Tiếng Việt", bcp47: "vi-VN" },
  { code: "th", label: "Thai / ไทย", bcp47: "th-TH" },
  { code: "fa", label: "Persian / فارسی", bcp47: "fa-IR" },
  { code: "he", label: "Hebrew / עברית", bcp47: "he-IL" },
  { code: "sw", label: "Swahili", bcp47: "sw-KE" },
  { code: "ta", label: "Tamil / தமிழ்", bcp47: "ta-IN" },
  { code: "te", label: "Telugu / తెలుగు", bcp47: "te-IN" },
  { code: "uk", label: "Ukrainian / Українська", bcp47: "uk-UA" },
  { code: "el", label: "Greek / Ελληνικά", bcp47: "el-GR" },
  { code: "cs", label: "Czech / Čeština", bcp47: "cs-CZ" },
  { code: "sv", label: "Swedish / Svenska", bcp47: "sv-SE" },
  { code: "no", label: "Norwegian / Norsk", bcp47: "nb-NO" },
  { code: "fi", label: "Finnish / Suomi", bcp47: "fi-FI" },
  { code: "ro", label: "Romanian / Română", bcp47: "ro-RO" },
  { code: "hu", label: "Hungarian / Magyar", bcp47: "hu-HU" },
];

function TranslatorPage() {
  const translate = useServerFn(aiTranslate);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const recRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);

  const target = LANGS.find((l) => l.code === targetLang)!;
  const sourceBcp = LANGS.find((l) => l.code === sourceLang)?.bcp47 ?? "en-US";

  // Debounced auto-translate as user types
  useEffect(() => {
    if (!input.trim()) { setOutput(""); return; }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => { void runTranslate(input); }, 600);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, targetLang]);

  const runTranslate = async (text: string) => {
    setLoading(true); setError("");
    try {
      const { translation } = await translate({ data: { text, targetLang: target.code, targetLabel: target.label } });
      setOutput(translation);
    } catch (e: any) {
      setError(e?.message ?? "Translation failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (listening) { recRef.current?.stop?.(); setListening(false); return; }
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Speech recognition not supported. Use Chrome or Edge."); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = sourceLang === "auto" ? "en-US" : sourceBcp;
    r.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setInput(txt);
    };
    r.onerror = (e: any) => { setError(`Mic error: ${e.error || "unknown"}`); setListening(false); };
    r.onend = () => setListening(false);
    recRef.current = r;
    try { r.start(); setListening(true); setError(""); } catch (err: any) { setError(err?.message ?? "Mic failed"); }
  };

  const speak = (text: string, lang: string) => {
    if (!text || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const swap = () => {
    if (sourceLang === "auto") return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInput(output);
    setOutput(input);
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <motion.h2 initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Languages className="h-6 w-6 text-primary" />
          AI <span className="brand-text">Voice Translator</span>
        </motion.h2>
        <p className="text-sm text-muted-foreground mt-1">Speak or type in any language — translate instantly with AI and hear it spoken back.</p>
      </div>

      <Card>
        {/* Language pickers */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">From</label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full mt-1 bg-secondary/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="auto">Auto-detect</option>
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>

          <button
            onClick={swap}
            disabled={sourceLang === "auto"}
            className="mt-5 p-2.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Swap languages"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">To</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full mt-1 bg-secondary/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
        </div>

        {/* Input */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your text</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => speak(input, sourceBcp)}
                disabled={!input}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground disabled:opacity-30"
                aria-label="Speak input"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <button
                onClick={toggleMic}
                className={`relative p-2.5 rounded-full transition ${
                  listening
                    ? "bg-gradient-to-br from-accent to-destructive text-white shadow-[var(--shadow-accent-glow)]"
                    : "bg-gradient-to-br from-primary to-accent text-white shadow-[var(--shadow-glow)]"
                }`}
                aria-label={listening ? "Stop" : "Start mic"}
              >
                {listening && <span className="absolute inset-0 rounded-full bg-accent/30 sonar-ring" />}
                {listening ? <MicOff className="h-4 w-4 relative" /> : <Mic className="h-4 w-4 relative" />}
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening..." : "Type or tap the mic to speak in any language..."}
            rows={4}
            className="w-full bg-secondary/40 border border-border rounded-lg px-4 py-3 text-base text-foreground focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Output */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              Translation
              {loading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={copy}
                disabled={!output}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground disabled:opacity-30"
                aria-label="Copy"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                onClick={() => speak(output, target.bcp47)}
                disabled={!output}
                className="p-2.5 rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-[var(--shadow-glow)] disabled:opacity-30"
                aria-label="Speak translation"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-h-[120px] w-full bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-lg px-4 py-3 text-base text-foreground">
            <AnimatePresence mode="wait">
              {output ? (
                <motion.div key={output} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="whitespace-pre-wrap">
                  {output}
                </motion.div>
              ) : (
                <span className="text-muted-foreground text-sm">Translation appears here...</span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Volume2 className="h-3 w-3" /> Powered by Lovable AI · 30+ languages · Real-time speech & translation
        </div>
      </Card>
    </div>
  );
}
