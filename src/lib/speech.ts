// Web Speech API wrapper
export interface SpeechController {
  start: () => void;
  stop: () => void;
  supported: boolean;
}

export function createRecognizer(handlers: {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
  lang?: string;
  continuous?: boolean;
  autoRestart?: boolean;
}): SpeechController {
  if (typeof window === "undefined") return { start: () => {}, stop: () => {}, supported: false };
  const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return { start: () => {}, stop: () => {}, supported: false };

  let rec: any = null;
  let stopped = false;

  const build = () => {
    const r = new SR();
    r.continuous = handlers.continuous ?? true;
    r.interimResults = true;
    r.lang = handlers.lang ?? "en-US";
    r.onresult = (e: any) => {
      let interim = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (interim) handlers.onPartial(interim);
      if (finalText) handlers.onFinal(finalText.trim());
    };
    r.onerror = (e: any) => handlers.onError?.(e.error || "speech_error");
    r.onend = () => {
      handlers.onEnd?.();
      if (!stopped && (handlers.autoRestart ?? true)) { try { r.start(); } catch {} }
    };
    return r;
  };

  return {
    supported: true,
    start: () => { stopped = false; rec = build(); try { rec.start(); } catch {} },
    stop: () => { stopped = true; try { rec?.stop(); } catch {} rec = null; },
  };
}

export function speak(text: string, lang = "en-US") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 1.05;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}
