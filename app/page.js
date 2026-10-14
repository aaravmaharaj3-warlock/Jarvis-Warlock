"use client";
import { useState, useRef, useEffect } from "react";

function MicIcon({ color = "currentColor", size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  );
}

function StopIcon({ color = "currentColor", size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <rect x="5" y="5" width="14" height="14" rx="2"></rect>
    </svg>
  );
}

function PencilIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
    </svg>
  );
}

function pickBestVoice() {
  if (typeof speechSynthesis === "undefined") return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const maleNameHints = ["male", "daniel", "arthur", "oliver", "george", "james", "ryan", "guy", "david", "fred", "gordon"];
  const ukHints = ["en-gb", "en_gb", "british", "uk"];
  const score = (v) => {
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();
    let s = 0;
    if (ukHints.some((h) => lang.includes(h) || name.includes(h))) s += 3;
    if (maleNameHints.some((h) => name.includes(h))) s += 2;
    if (lang.startsWith("en")) s += 1;
    return s;
  };
  const sorted = [...voices].sort((a, b) => score(b) - score(a));
  return sorted[0] || null;
}

// Cleans text so it sounds like natural speech, not a document being read aloud
function cleanForSpeech(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/#+\s?/g, "")
    .replace(/[*_~`#>]/g, "")
    .replace(/\n+/g, ". ")
    .replace(/\s*\.\s*\.+/g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("blue");
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const watcherRef = useRef(null);
  const watchingRef = useRef(false);
  const voiceRef = useRef(null);

  const themes = {
    blue: { bg: "#050810", fg: "#4fd1ff", bubble: "#121a2b", glow: "#4fd1ff" },
    red: { bg: "#140404", fg: "#ff4f4f", bubble: "#2b1212", glow: "#ff4f4f" },
    green: { bg: "#031208", fg: "#4fff8f", bubble: "#122b1a", glow: "#4fff8f" },
  };
  const t = themes[theme];
  const active = listening || speaking;
  const busy = speaking || loading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    function loadVoice() {
      voiceRef.current = pickBestVoice();
    }
    loadVoice();
    speechSynthesis.onvoiceschanged = loadVoice;
  }, []);

  function stopWatching() {
    watchingRef.current = false;
    if (watcherRef.current) {
      try { watcherRef.current.abort(); } catch (e) {}
      watcherRef.current = null;
    }
  }

  function startWatching() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    stopWatching();
    watchingRef.current = true;
    const rec = new Recognition();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const words = last[0].transcript.trim().toLowerCase().split(/\s+/);
      const heardStop = words.some((w) => w.replace(/[^a-z]/g, "") === "stop");
      if (heardStop && words.length <= 4) stopAll();
    };
    rec.onend = () => {
      if (watchingRef.current) {
        try { rec.start(); } catch (e) {}
      }
    };
    rec.onerror = () => {};
    watcherRef.current = rec;
    try { rec.start(); } catch (e) {}
  }

  function stopAll() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    stopWatching();
    setSpeaking(false);
    setLoading(false);
  }

  function startNewChat() {
    stopAll();
    setMessages([]);
    setInput("");
  }

  async function send(text) {
    const toSend = text || input;
    if (!toSend) return;
    stopAll();
    setMessages((m) => [...m, { role: "user", text: toSend }]);
    setInput("");

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: toSend }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (controller.signal.aborted) return;

      setMessages((m) => [...m, { role: "jarvis", text: data.reply }]);

      const lower = data.reply.toLowerCase();
      if (lower.includes("blue theme")) setTheme("blue");
      if (lower.includes("red theme")) setTheme("red");
      if (lower.includes("green theme")) setTheme("green");

      const spokenText = cleanForSpeech(data.reply);
      const utter = new SpeechSynthesisUtterance(spokenText);
      utter.lang = "en-GB";
      utter.pitch = 0.85;
      utter.rate = 0.95;
      if (voiceRef.current) utter.voice = voiceRef.current;
      utter.onstart = () => {
        setSpeaking(true);
        startWatching();
      };
      utter.onend = () => {
        setSpeaking(false);
        stopWatching();
      };
      utter.onerror = () => {
        setSpeaking(false);
        stopWatching();
      };
      speechSynthesis.speak(utter);
    } catch (err) {
      if (err.name === "AbortError") return;
      setMessages((m) => [...m, { role: "jarvis", text: "Sorry, something went wrong." }]);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  function handleMicPress() {
    if (busy) {
      stopAll();
      return;
    }
    startListening();
  }

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      alert("Voice input isn't supported in this browser.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-GB";
    recognition.interimResults = true;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      if (e.results[0].isFinal) {
        const cleaned = transcript.trim().toLowerCase();
        if (cleaned === "stop" || cleaned === "okay stop" || cleaned === "ok stop") {
          stopAll();
          setInput("");
          return;
        }
        send(transcript);
      }
    };
    recognition.start();
  }

  return (
    <main style={{
      background: t.bg, color: t.fg, fontFamily: "sans-serif",
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes corePulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.25); opacity: 1; }
        }
        @keyframes ringPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>

      <div style={{ position: "relative", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, textAlign: "center" }}>
        <button onClick={startNewChat} aria-label="New chat" style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", padding: 8
        }}>
          <PencilIcon color={t.fg} />
        </button>
        <h1 style={{ margin: 0, fontSize: 24, letterSpacing: 2 }}>JARVIS</h1>
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "20px 0", flexShrink: 0 }}>
        <div style={{ position: "relative", width: 150, height: 150 }}>
          <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: `1px dotted ${t.glow}`, opacity: 0.3, animation: `spin ${active ? 6 : 14}s linear infinite` }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px dashed ${t.glow}`, opacity: 0.5, animation: `spin ${active ? 4 : 10}s linear infinite` }} />
          <div style={{ position: "absolute", inset: 14, borderRadius: "50%", border: `2px solid ${t.glow}`, opacity: 0.6, animation: `spinReverse ${active ? 3 : 8}s linear infinite` }} />
          <div style={{ position: "absolute", inset: 30, borderRadius: "50%", border: `1px solid ${t.glow}`, animation: `ringPulse ${active ? 0.8 : 2.5}s ease-in-out infinite` }} />
          <div style={{
            position: "absolute", top: "50%", left: "50%", width: 36, height: 36,
            marginLeft: -18, marginTop: -18, borderRadius: "50%",
            background: t.glow, boxShadow: `0 0 25px 8px ${t.glow}`,
            animation: `corePulse ${active ? 0.6 : 2}s ease-in-out infinite`,
          }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20, minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            <div style={{
              background: m.role === "user" ? t.fg : t.bubble,
              color: m.role === "user" ? t.bg : t.fg,
              padding: "10px 16px", borderRadius: 18, maxWidth: "75%", lineHeight: 1.4,
              wordBreak: "break-word",
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ opacity: 0.6, fontSize: 14, marginBottom: 12 }}>Jarvis is thinking...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)", gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message Jarvis..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "none", outline: "none" }}
        />
        <button onClick={handleMicPress} style={{ borderRadius: 20, padding: "10px 16px", border: "none", background: busy ? "#ff4f4f" : (listening ? t.fg : t.bubble), display: "flex", alignItems: "center" }}>
          {busy ? <StopIcon color="#fff" /> : <MicIcon color={listening ? t.bg : t.fg} />}
        </button>
        <button onClick={() => send()} style={{ borderRadius: 20, padding: "10px 18px", border: "none", background: t.fg, color: t.bg, fontWeight: "bold" }}>
          Send
        </button>
      </div>
    </main>
  );
        }
