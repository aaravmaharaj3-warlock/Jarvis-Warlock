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

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [theme, setTheme] = useState("blue");
  const bottomRef = useRef(null);

  const themes = {
    blue: { bg: "#050810", fg: "#4fd1ff", bubble: "#121a2b", glow: "#4fd1ff" },
    red: { bg: "#140404", fg: "#ff4f4f", bubble: "#2b1212", glow: "#ff4f4f" },
    green: { bg: "#031208", fg: "#4fff8f", bubble: "#122b1a", glow: "#4fff8f" },
  };
  const t = themes[theme];
  const active = listening || speaking;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    const toSend = text || input;
    if (!toSend) return;
    setMessages((m) => [...m, { role: "user", text: toSend }]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: toSend }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { role: "jarvis", text: data.reply }]);

    const lower = data.reply.toLowerCase();
    if (lower.includes("blue theme")) setTheme("blue");
    if (lower.includes("red theme")) setTheme("red");
    if (lower.includes("green theme")) setTheme("green");

    const utter = new SpeechSynthesisUtterance(data.reply);
    utter.lang = "en-GB";
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    speechSynthesis.speak(utter);
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
      if (e.results[0].isFinal) send(transcript);
    };
    recognition.start();
  }

  return (
    <main style={{
      background: t.bg, color: t.fg, fontFamily: "sans-serif",
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", flexDirection: "column"
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

      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 24, letterSpacing: 4 }}>J.A.R.V.I.S.</h1>
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "20px 0", flexShrink: 0 }}>
        <div style={{ position: "relative", width: 140, height: 140 }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `2px solid ${t.glow}`, opacity: 0.5,
            animation: `spin ${active ? 4 : 10}s linear infinite`,
            borderStyle: "dashed",
          }} />
          <div style={{
            position: "absolute", inset: 14, borderRadius: "50%",
            border: `2px solid ${t.glow}`, opacity: 0.6,
            animation: `spinReverse ${active ? 3 : 8}s linear infinite`,
          }} />
          <div style={{
            position: "absolute", inset: 30, borderRadius: "50%",
            border: `1px solid ${t.glow}`,
            animation: `ringPulse ${active ? 0.8 : 2.5}s ease-in-out infinite`,
          }} />
          <div style={{
            position: "absolute", top: "50%", left: "50%", width: 36, height: 36,
            marginLeft: -18, marginTop: -18, borderRadius: "50%",
            background: t.glow, boxShadow: `0 0 20px 6px ${t.glow}`,
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
            }}>
              {m.text}
            </div>
          </div>
        ))}
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
        <button onClick={startListening} style={{ borderRadius: 20, padding: "10px 16px", border: "none", background: listening ? t.fg : t.bubble, display: "flex", alignItems: "center" }}>
          <MicIcon color={listening ? t.bg : t.fg} />
        </button>
        <button onClick={() => send()} style={{ borderRadius: 20, padding: "10px 18px", border: "none", background: t.fg, color: t.bg, fontWeight: "bold" }}>
          Send
        </button>
      </div>
    </main>
  );
}
