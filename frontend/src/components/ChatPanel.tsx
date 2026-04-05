"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  templateId: string;
  fieldValues: Record<string, string>;
  onFieldsExtracted: (fields: Record<string, string>) => void;
}

export default function ChatPanel({
  templateId,
  fieldValues,
  onFieldsExtracted,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;
  const fieldValuesRef = useRef(fieldValues);
  fieldValuesRef.current = fieldValues;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetch(`/api/chat/greeting?template_id=${templateId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages([{ role: "assistant", content: data.message }]);
      })
      .catch(() => {
        setMessages([
          {
            role: "assistant",
            content:
              "Hello! I'm your legal document assistant. Tell me about the document you need.",
          },
        ]);
      });
  }, [templateId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { role: "user", content: text };
      const allMessages = [...messagesRef.current, userMsg];
      setMessages(allMessages);
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            current_fields: fieldValuesRef.current,
            template_id: templateId,
          }),
        });

        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Sorry, I'm having trouble connecting. Please try again.",
            },
          ]);
          return;
        }

        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);

        if (data.extracted_fields) {
          const nonEmpty: Record<string, string> = {};
          for (const [key, value] of Object.entries(data.extracted_fields)) {
            if (typeof value === "string" && value !== "") {
              nonEmpty[key] = value;
            }
          }
          if (Object.keys(nonEmpty).length > 0) {
            onFieldsExtracted(nonEmpty);
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I'm having trouble connecting. Please try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [onFieldsExtracted],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      <div
        className="px-4 py-3 border-b border-gray-200"
        style={{ backgroundColor: "#032147" }}
      >
        <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
              style={msg.role === "user" ? { backgroundColor: "#209dd7" } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-gray-200 flex gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: "#753991" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
