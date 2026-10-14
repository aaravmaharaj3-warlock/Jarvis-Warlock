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

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [theme, setTheme] = useState("blue");
  const bottomRef = useRef(null);
  const speakingRef = useRef(false);

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

  useEffect(() => {
    speakingRef.current = speaking;
  }, [speaking]);

  function stopSpeaking() {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    setSpeaking(false);
  }

  function startNewChat() {
    stopSpeaking();
    setMessages([]);
    setInput("");
  }

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

  function handleMicPress() {
    if (speakingRef.current) {
      stopSpeaking();
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
          stopSpeaking();
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
}
