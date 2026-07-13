"use client";

import { useRef, useState, useTransition } from "react";
import { Send, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { askAssistant } from "@/lib/actions/assistant";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  text: string;
  isError?: boolean;
}

const SUGGESTIONS: Record<UserRole, string[]> = {
  farmer: [
    "Which of my products is demand rising for?",
    "Summarise my recent orders",
    "When should I plan my next harvest?",
  ],
  buyer: [
    "What products should I stock up on next week?",
    "Summarise my spending",
    "Explain the demand forecast for tomatoes",
  ],
  transporter: [
    "Summarise my upcoming deliveries",
    "Which delivery is the most urgent?",
    "How far will I travel this week?",
  ],
  warehouse_manager: [
    "Which stock is closest to spoiling?",
    "Summarise current inventory levels",
    "What should I dispatch first?",
  ],
  admin: [
    "Give me a summary of platform activity",
    "Which products are trending up?",
    "Are there any supply chain risks right now?",
  ],
};

export function AssistantChat({
  configured,
  role,
}: {
  configured: boolean;
  role: UserRole;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  function send(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);

    startTransition(async () => {
      const result = await askAssistant(q);
      setMessages((m) => [
        ...m,
        result.text
          ? { role: "assistant", text: result.text }
          : {
              role: "assistant",
              isError: true,
              text: `The assistant couldn't answer. ${result.error ?? "Unknown error."}\n\nEverything else in AgriFlow (dashboards, forecasts, scheduling) keeps working without it.`,
            },
      ]);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {!configured && (
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          GEMINI_API_KEY is not set — the assistant will reply with a fallback
          message. Everything else in AgriFlow works normally.
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Sparkles className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold">Ask me about your data</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              I explain and summarise what the platform already knows — orders,
              inventory and deterministic demand forecasts.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS[role].map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-gray-300 px-3.5 py-1.5 text-sm text-gray-600 hover:border-emerald-400 hover:text-emerald-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm lg:max-w-[70%]",
                m.role === "user"
                  ? "bg-emerald-600 text-white"
                  : m.isError
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "bg-gray-100 text-gray-800"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-gray-100 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about demand, inventory, orders…"
          className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
