"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { postLLM } from "@/lib/api";

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
  const [mounted, setMounted] = useState(false);
  const [flowMissing, setFlowMissing] = useState<string[] | null>(null);
  useEffect(() => setMounted(true), []);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

  // no auto-reset behavior

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

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

    try {
      const data = await postLLM({ prompt: userMessage.content });
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
      if (data && (data.step || (Array.isArray(data.missing) && data.missing.length))) {
        setFlowMissing(Array.isArray(data.missing) ? data.missing : []);
      } else {
        setFlowMissing(null);
      }
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
      setFlowMissing(null);
    }
    setIsLoading(false);
    setThinkingText("Sedang berpikir...");
  };

  // Guidance prompts (left panel)
  const employeeMgmtPrompts: Array<{ title: string; prompt: string; guidance?: string }> = [
    {
      title: "Menambahkan Karyawan",
      prompt: "Tambah 1 karyawan bernama Salsabila Putri, posisi: Staff, departemen: HR, client: PT Telkom, konfirmasi: ya",
      guidance: "Ganti nama karyawan, posisi, departemen, dan client sesuai kebutuhan. Contoh: ganti Salsabila Putri menjadi nama lain jika perlu.",
    },
    { title: "Hitung Total Karyawan", prompt: "Hitung total karyawan", guidance: "Menghasilkan total keseluruhan karyawan terdaftar." },
    { title: "Daftar Supervisor", prompt: "Tampilkan daftar karyawan Supervisor", guidance: "Hanya tampilkan yang memiliki peran Supervisor." },
    { title: "Departemen IT", prompt: "Tampilkan daftar karyawan departemen IT", guidance: "Filter karyawan berdasarkan departemen 'IT'." },
    { title: "Kelompok per Client", prompt: "Kelompokkan karyawan per client", guidance: "Mengelompokkan karyawan menurut nama client mereka." },
  ];

  const employeeAssignmentPrompts: Array<{ title: string; prompt: string; guidance?: string }> = [
    {
      title: "Buat Penugasan",
      prompt: "Buat penugasan atas nama Salsabila Putri, agenda: Onboarding, tanggal 2025-08-20 s/d 2025-08-22, client: PT Telkom, konfirmasi: ya",
      guidance: "Ganti nama karyawan, agenda, tanggal dan client sesuai kebutuhan penugasan. Gunakan format tanggal YYYY-MM-DD.",
    },
    { title: "Cek Penugasan (Periode)", prompt: "Cek penugasan karyawan Salsabila Putri pada periode 2025-08-20 s/d 2025-08-22", guidance: "Sesuaikan nama karyawan dan periode." },
    { title: "Tersedia (Tanggal)", prompt: "Daftar karyawan yang tersedia pada tanggal 2025-08-21", guidance: "Ubah tanggal untuk mengecek hari lain." },
    { title: "Tersedia (Periode)", prompt: "Daftar karyawan yang tersedia pada periode 2025-08-20 s/d 2025-08-22", guidance: "Gunakan rentang tanggal untuk periode ketersediaan." },
    { title: "Sedang Ditugaskan (Tanggal)", prompt: "Daftar karyawan yang sedang ditugaskan pada tanggal 2025-08-21", guidance: "Cek siapa yang sedang ada penugasan pada tanggal tertentu." },
    { title: "Sedang Ditugaskan (Periode)", prompt: "Daftar karyawan yang sedang ditugaskan pada periode 2025-08-20 s/d 2025-08-22", guidance: "Cek penugasan selama rentang tanggal." },
    { title: "Kapan Bisa Diassign", prompt: "Kapan karyawan Salsabila Putri akan tersedia untuk diassign lagi?", guidance: "Ganti nama karyawan untuk pertanyaan serupa." },
    { title: "Ditugaskan per Client (Periode)", prompt: "Daftar karyawan yang ditugaskan untuk client: PT Telkom pada periode 2025-08-20 s/d 2025-08-22", guidance: "Sesuaikan nama client dan periode jika perlu." },
  ];

  const putPromptToInput = (text: string) => {
    setInputValue(text);
    // focus textarea for quick edits
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  return (
    <div className="max-w-7xl mx-auto py-10 space-y-6 px-4">
      {/* Navigation */}
  <nav className="flex gap-4 mb-6 items-center">
        <Link href="/" className="text-blue-600 hover:underline font-semibold">Home</Link>
        <Link href="/employee-data" className="text-blue-600 hover:underline font-semibold">Data Karyawan</Link>
        <Link href="/on-duty" className="text-blue-600 hover:underline font-semibold">Karyawan On Duty</Link>
        <Link href="/api-test" className="text-blue-600 hover:underline font-semibold">API Test</Link>
      </nav>
      {/* Heading and intro paragraph */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Asisten HR</h1>
        <p className="text-gray-600">Pendamping cerdas Anda untuk semua keperluan dan pertanyaan HR</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Guidance blocks */}
        <aside className="bg-white rounded shadow p-4 h-[70vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-3">Panduan Prompt</h2>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Employee Management</h3>
            <div className="space-y-2">
              {employeeMgmtPrompts.map((item, idx) => (
                <div key={idx} className="border rounded p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-semibold text-gray-500">Point {idx + 1}: {item.title}</div>
                    {item.guidance && (
                      <div className="relative group">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold cursor-help">i</div>
                        <div className="absolute right-0 -top-1 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
                          {item.guidance}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap mb-2">{item.prompt}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => putPromptToInput(item.prompt)}
                      className="text-xs px-3 py-1.5 rounded-md border border-transparent bg-gradient-to-br from-white to-sky-50 hover:from-sky-50 hover:to-white transition-colors duration-150 shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-300 active:translate-y-0.5 cursor-pointer flex items-center gap-2"
                      aria-label={`Use prompt: ${item.title}`}
                    >
                      Prompt This
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Employee Assignment (chat prompts)</h3>
            <div className="space-y-2">
              {employeeAssignmentPrompts.map((item, idx) => (
                <div key={idx} className="border rounded p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-semibold text-gray-500">Point {idx + 1}: {item.title}</div>
                    {item.guidance && (
                      <div className="relative group">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold cursor-help">i</div>
                        <div className="absolute right-0 -top-1 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded p-2 z-10">
                          {item.guidance}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap mb-2">{item.prompt}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => putPromptToInput(item.prompt)}
                      className="text-xs px-3 py-1.5 rounded-md border border-transparent bg-gradient-to-br from-white to-sky-50 hover:from-sky-50 hover:to-white transition-colors duration-150 shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-300 active:translate-y-0.5 cursor-pointer flex items-center gap-2"
                      aria-label={`Use assignment prompt: ${item.title}`}
                    >
                      Isi ke Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Chat */}
        <div className="bg-white rounded shadow p-4 h-[70vh] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "rounded-lg px-4 py-2 max-w-[80%] whitespace-pre-line break-words",
                msg.role === "user"
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-100 text-gray-900 self-start"
              )}>
                {msg.content}
                <div
                  suppressHydrationWarning
                  className={cn(
                    "text-xs mt-1",
                    msg.role === "user"
                      ? "text-yellow-200 font-bold text-right"
                      : "text-gray-400"
                  )}
                >
                  {mounted ? new Date(msg.timestamp).toLocaleTimeString() : ""}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-900 self-start break-words">
                {thinkingText}
              </div>
            </div>
          )}
        </div>
        <form
          className="flex items-end gap-2 mt-4"
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 border rounded px-3 py-2 resize-none overflow-hidden leading-6"
            placeholder={flowMissing && flowMissing.length ? `Lengkapi: ${flowMissing.join(", ")}` : "Ketik pesan Anda di sini..."}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white rounded p-2 disabled:opacity-50"
            disabled={isLoading || !inputValue.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
