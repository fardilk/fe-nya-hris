"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string; // store as ISO string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Selamat datang! Saya adalah asisten HR Anda. Bagaimana saya dapat membantu Anda hari ini?",
      role: "assistant",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState("Sedang berpikir...");

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate thinking process
    const thinkingStates = [
      "Sedang berpikir...",
      "Menganalisis pertanyaan...",
      "Menyiapkan jawaban...",
      "Hampir selesai..."
    ];
    let currentStateIndex = 0;
    const thinkingInterval = setInterval(() => {
      setThinkingText(thinkingStates[currentStateIndex]);
      currentStateIndex = (currentStateIndex + 1) % thinkingStates.length;
    }, 800);

    // Send user input to Go-GPT (LLM) API and display response
    try {
      // Ganti URL di bawah ini ke endpoint Go backend Anda jika berbeda
      const res = await fetch('http://localhost:8000/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content }),
      });
      const data = await res.json();
      clearInterval(thinkingInterval);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: data.response || "Maaf, terjadi kesalahan pada server.",
          role: "assistant",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      clearInterval(thinkingInterval);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "Maaf, terjadi kesalahan pada server.",
          role: "assistant",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
    setIsLoading(false);
    setThinkingText("Sedang berpikir...");
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      {/* Navigation */}
      <nav className="flex gap-4 mb-6">
        <a href="/employee-data" className="text-blue-600 hover:underline font-semibold">Data Karyawan</a>
        <a href="/api-test" className="text-blue-600 hover:underline font-semibold">API Test</a>
      </nav>
      {/* Heading and intro paragraph */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Asisten HR</h1>
        <p className="text-gray-600">Pendamping cerdas Anda untuk semua keperluan dan pertanyaan HR</p>
      </div>
      <div className="bg-white rounded shadow p-4 h-[70vh] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "rounded-lg px-4 py-2 max-w-[80%] whitespace-pre-line",
                msg.role === "user"
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-100 text-gray-900 self-start"
              )}>
                {msg.content}
                <div
                  className={cn(
                    "text-xs mt-1",
                    msg.role === "user"
                      ? "text-yellow-200 font-bold text-right"
                      : "text-gray-400"
                  )}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-900 self-start">
                {thinkingText}
              </div>
            </div>
          )}
        </div>
        <form
          className="flex items-center gap-2 mt-4"
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Ketik pesan Anda di sini..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white rounded p-2"
            disabled={isLoading || !inputValue.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
