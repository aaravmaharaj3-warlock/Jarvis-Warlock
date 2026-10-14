"use client";
import { useState, useRef, useEffect } from "react";

function MicIcon({ color = "currentColor", size = 20 }) {
  return (
    
  );
}

function StopIcon({ color = "currentColor", size = 18 }) {
  return (
    
  );
}

function PencilIcon({ color = "currentColor", size = 22 }) {
  return (
    
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

      const utter = new SpeechSynthesisUtterance(data.reply);
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
    
  );
}, display: "flex", alignItems: "center" }}>
          {busy ? <StopIcon color="#fff" /> : <MicIcon color={listening ? t.bg : t.fg} />}
        </button>
        <button onClick={() => send()} style={{ borderRadius: 20, padding: "10px 18px", border: "none", background: t.fg, color: t.bg, fontWeight: "bold" }}>
          Send
        </button>
      </div>
    </main>
  );
  }
