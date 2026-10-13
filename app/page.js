```javascript
"use client";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [theme, setTheme] = useState("blue");
  const bottomRef = useRef(null);

  const themes = {
    blue: { bg: "#0a0e17", fg: "#4fd1ff", bubble: "#121a2b" },
    red: { bg: "#1a0505", fg: "#ff4f4f", bubble: "#2b1212" },
    green: { bg: "#05170a", fg: "#4fff8f", bubble: "#122b1a" },
  };
  const t = themes[theme];

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
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => send(e.results[0][0].transcript);
    recognition.start();
  }

  return (
    <main style={{ background: t.bg, minHeight: "100vh", color: t.fg, fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <h1 style={{ margin: 0, fontSize: 24, letterSpacing: 2 }}>JARVIS</h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            <div style={{
              background: m.role === "user" ? t.fg : t.bubble,
              color: m.role === "user" ? t.bg : t.fg,
              padding: "10px 16px",
              borderRadius: 18,
              maxWidth: "75%",
              lineHeight: 1.4,
            }}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message Jarvis..."
          style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "none", outline: "none" }}
        />
        <button onClick={startListening} style={{ borderRadius: 20, padding: "10px 16px", border: "none", background: listening ? t.fg : t.bubble, color: listening ? t.bg : t.fg }}>
          🎤
        </button>
        <button onClick={() => send()} style={{ borderRadius: 20, padding: "10px 18px", border: "none", background: t.fg, color: t.bg, fontWeight: "bold" }}>
          Send
        </button>
      </div>
    </main>
  );
}
