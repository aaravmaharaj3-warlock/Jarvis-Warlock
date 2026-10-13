"use client";
import { useState, useRef, useEffect } from "react";

function MicIcon({ color = "currentColor", size = 20 }) {
  return (
    
  );
}

function MenuIcon({ color = "currentColor", size = 22 }) {
  return (
    
  );
}

function PlusIcon({ color = "currentColor", size = 18 }) {
  return (
    
  );
}

function TrashIcon({ color = "currentColor", size = 16 }) {
  return (
    
  );
}

function newChatObj() {
  return { id: Date.now().toString(), title: "New Chat", messages: [] };
}

export default function Home() {
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [theme, setTheme] = useState("blue");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);

  const themes = {
    blue: { bg: "#050810", fg: "#4fd1ff", bubble: "#121a2b", glow: "#4fd1ff" },
    red: { bg: "#140404", fg: "#ff4f4f", bubble: "#2b1212", glow: "#ff4f4f" },
    green: { bg: "#031208", fg: "#4fff8f", bubble: "#122b1a", glow: "#4fff8f" },
  };
  const t = themes[theme];
  const active = listening || speaking;
  const currentChat = chats.find((c) => c.id === activeId);
  const messages = currentChat ? currentChat.messages : [];

  useEffect(() => {
    const saved = localStorage.getItem("jarvis_chats");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length) {
        setChats(parsed);
        setActiveId(parsed[0].id);
        return;
      }
    }
    const first = newChatObj();
    setChats([first]);
    setActiveId(first.id);
  }, []);

  useEffect(() => {
    if (chats.length) localStorage.setItem("jarvis_chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function updateChatMessages(id, newMessages, title) {
    setChats((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, messages: newMessages, title: title || c.title }
          : c
      )
    );
  }

  function startNewChat() {
    const fresh = newChatObj();
    setChats((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setSidebarOpen(false);
  }

  function deleteChat(id) {
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (id === activeId) {
        if (remaining.length) {
          setActiveId(remaining[0].id);
        } else {
          const fresh = newChatObj();
          setActiveId(fresh.id);
          return [fresh];
        }
      }
      return remaining;
    });
  }

  async function send(text) {
    const toSend = text || input;
    if (!toSend || !activeId) return;

    const newMessages = [...messages, { role: "user", text: toSend }];
    const isFirst = messages.length === 0;
    const title = isFirst ? toSend.slice(0, 30) : currentChat.title;
    updateChatMessages(activeId, newMessages, title);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: toSend }),
    });
    const data = await res.json();
    const finalMessages = [...newMessages, { role: "jarvis", text: data.reply }];
    updateChatMessages(activeId, finalMessages, title);

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
    
  );
}>
      </div>
    </main>
  );
}
