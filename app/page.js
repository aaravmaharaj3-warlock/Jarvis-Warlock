"use client";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  async function send() {
    const userMsg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { role: "jarvis", text: data.reply }]);

    const utter = new SpeechSynthesisUtterance(data.reply);
    utter.lang = "en-GB";
    speechSynthesis.speak(utter);
  }

  return (
    <main style={{ background: "#0a0e17", minHeight: "100vh", color: "#4fd1ff", padding: 20 }}>
      <h1>JARVIS</h1>
      <div>
        {messages.map((m, i) => (
          <p key={i}><b>{m.role}:</b> {m.text}</p>
        ))}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={send}>Send</button>
    </main>
  );
}
