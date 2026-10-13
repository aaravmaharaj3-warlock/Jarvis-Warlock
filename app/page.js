"use client";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [theme, setTheme] = useState("blue");

  const themes = {
    blue: { bg: "#0a0e17", fg: "#4fd1ff" },
    red: { bg: "#1a0505", fg: "#ff4f4f" },
    green: { bg: "#05170a", fg: "#4fff8f" },
  };

  async function send(text) {
    const toSend = text || input;
    if (!toSend) return;
    const userMsg = { role: "user", text: toSend };
    setMessages((m) => [...m, userMsg]);
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
    recognition.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      send(spoken);
    };
    recognition.start();
  }

  const t = themes[theme];

  return (
    <main style={{ background: t.bg, minHeight: "100vh", color: t.fg, padding: 20, fontFamily: "sans-serif" }}>
      <h1>JARVIS</h1>
      <div style={{ marginBottom: 20 }}>
        {messages.map((m, i) => (
          <p key={i}><b>{m.role}:</b> {m.text}</p>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        style={{ padding: 8, width: "60%" }}
      />
      <button onClick={() => send()} style={{ padding: 8, marginLeft: 8 }}>Send</button>
      <button onClick={startListening} style={{ padding: 8, marginLeft: 8 }}>
        {listening ? "Listening..." : "🎤 Speak"}
      </button>
    </main>
  );
}
