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
function MenuIcon({ color = "currentColor", size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );
}

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

export default function Home() {
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const activeChat = chats.find((c) => c.id === activeId);
  const messages = activeChat ? activeChat.messages : [];

  useEffect(() => {
    const saved = localStorage.getItem("jarvis_chats");
    if (saved) {
      const parsed = JSON.parse(saved);
      setChats(parsed);
      if (parsed.length) setActiveId(parsed[0].id);
      else createNewChat(parsed);
    } else {
      createNewChat([]);
    }
  }, []);

  useEffect(() => {
    if (chats.length) localStorage.setItem("jarvis_chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function createNewChat(existing) {
    const id = newId();
    const chat = { id, title: "New chat", messages: [] };
    setChats([chat, ...(existing ?? chats)]);
    setActiveId(id);
    setSidebarOpen(false);
  }

  function updateChat(id, updater) {
    setChats((cs) => cs.map((c) => (c.id === id ? updater(c) : c)));
  }

  function deleteChat(id) {
    setChats((cs) => {
      const rest = cs.filter((c) => c.id !== id);
      if (id === activeId) setActiveId(rest.length ? rest[0].id : null);
      return rest;
    });
  }

  async function send(text) {
    const toSend = text || input;
    if (!toSend || !activeId) return;
    const currentId = activeId;
    updateChat(currentId, (c) => ({
      ...c,
      messages: [...c.messages, { role: "user", text: toSend }],
      title: c.messages.length === 0 ? toSend.slice(0, 30) : c.title,
    }));
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: toSend }),
    });
    const data = await res.json();
    updateChat(currentId, (c) => ({ ...c, messages: [...c.messages, { role: "jarvis", text: data.reply }] }));

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
    if (!Recognition) { alert("Voice input isn't supported in this browser."); return; }
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
    <main style={{ background: t.bg, color: t.fg, fontFamily: "sans-serif", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", overflow: "hidden" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes corePulse { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.25); opacity: 1; } }
        @keyframes ringPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10 }} />
      )}
      <div style={{
        position: "fixed", top: 0, bottom: 0, left: sidebarOpen ? 0 : -260, width: 240,
        background: "#0a0f1a", borderRight: `1px solid ${t.glow}33`, transition: "left 0.2s ease",
        zIndex: 20, display: "flex", flexDirection: "column", padding: 12
      }}>
        <button onClick={() => createNewChat()} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${t.glow}`, background: "transparent", color: t.fg, marginBottom: 12, textAlign: "left" }}>
          + New chat
        </button>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {chats.map((c) => (
            <div key={c.id} onClick={() => { setActiveId(c.id); setSidebarOpen(false); }} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer",
              background: c.id === activeId ? `${t.glow}22` : "transparent", fontSize: 14
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
              <span onClick={(e) => { e.stopPropagation(); deleteChat(c.id); }} style={{ opacity: 0.5, paddingLeft: 8 }}>✕</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <button onClick={() => setSidebarOpen(true)} style={{ position: "absolute", left: 16, background: "none", border: "none" }}>
            <MenuIcon color={t.fg} />
          </button>
          <h1 style={{ margin: 0, fontSize: 24, letterSpacing: 4 }}>J.A.R.V.I.S.</h1>
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "20px 0", flexShrink: 0 }}>
          <div style={{ position: "relative", width: 150, height: 150 }}>
            <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: `1px dotted ${t.glow}`, opacity: 0.3, animation: `spin ${active ? 6 : 14}s linear infinite` }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px dashed ${t.glow}`, opacity: 0.5, animation: `spin ${active ? 4 : 10}s linear infinite` }} />
            <div style={{ position: "absolute", inset: 14, borderRadius: "50%", border: `2px solid ${t.glow}`, opacity: 0.6, animation: `spinReverse ${active ? 3 : 8}s linear infinite` }} />
            <div style={{ position: "absolute", inset: 30, borderRadius: "50%", border: `1px solid ${t.glow}`, animation: `ringPulse ${active ? 0.8 : 2.5}s ease-in-out infinite` }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", width: 36, height: 36, marginLeft: -18, marginTop: -18, borderRadius: "50%", background: t.glow, boxShadow: `0 0 25px 8px ${t.glow}`, animation: `corePulse ${active ? 0.6 : 2}s ease-in-out infinite` }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20, minHeight: 0 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <div style={{ background: m.role === "user" ? t.fg : t.bubble, color: m.role === "user" ? t.bg : t.fg, padding: "10px 16px", borderRadius: 18, maxWidth: "75%", lineHeight: 1.4 }}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)", gap: 8, flexShrink: 0 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message Jarvis..." style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "none", outline: "none" }} />
          <button onClick={startListening} style={{ borderRadius: 20, padding: "10px 16px", border: "none", background: listening ? t.fg : t.bubble, display: "flex", alignItems: "center" }}>
            <MicIcon color={listening ? t.bg : t.fg} />
          </button>
          <button onClick={() => send()} style={{ borderRadius: 20, padding: "10px 18px", border: "none", background: t.fg, color: t.bg, fontWeight: "bold" }}>
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
