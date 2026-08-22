"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  senderId: string;
  sender: { name: string };
}

interface ChatBoxProps {
  transactionId: string;
}

export default function ChatBox({ transactionId }: ChatBoxProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUserId = session?.user?.id;

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?transactionId=${transactionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else if (res.status === 403 || res.status === 404) {
        setMessages([]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  const sendMessage = async () => {
    if (!input.trim() || !currentUserId || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, message: input }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setInput("");
        inputRef.current?.focus();
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollTo({ top: messagesEndRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center text-sm text-zinc-500 dark:text-zinc-400">
        <User className="mb-2 h-8 w-8" />
        <p>No messages yet.</p>
        <p>Be the first to send a message!</p>
        <div className="mt-4 w-full max-w-sm">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            maxLength={2000}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-80 flex-col">
      <div
        ref={messagesEndRef}
        className="flex-1 space-y-3 overflow-y-auto p-1"
      >
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
            >
              {!isOwn && (
                <Avatar
                  src={undefined}
                  fallback={msg.sender?.name?.[0] || "U"}
                  size="sm"
                />
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                  isOwn
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                {!isOwn && (
                  <p className="mb-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {msg.sender?.name || "User"}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                <p
                  className={`mt-1 text-xs ${
                    isOwn ? "text-indigo-200" : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {isOwn && (
                <Avatar
                  src={session?.user?.image ?? undefined}
                  fallback={session?.user?.name?.[0] || "U"}
                  size="sm"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          maxLength={2000}
          disabled={sending}
        />
        <Button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          size="sm"
          className="h-9 px-3"
          aria-label="Send message"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
