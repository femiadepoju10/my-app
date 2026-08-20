"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";

interface OtherUser {
  id: number;
  name: string;
}

interface Product {
  id: number;
  title: string;
}

interface LastMessage {
  content: string;
  senderId: number;
  createdAt: string;
}

interface Conversation {
  id: number;
  transactionId: number;
  buyerId: number;
  sellerId: number;
  lastMessageAt: string | null;
  otherUser: OtherUser | null;
  product: Product | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = session?.user?.id ? parseInt(session.user.id) : 0;

  useEffect(() => {
    async function fetchConversations() {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
      setLoading(false);
    }
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    async function fetchMessages() {
      const res = await fetch(`/api/conversations/${selectedId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
      fetch(`/api/conversations/${selectedId}/messages/read`, { method: "PATCH" });
      setLoading(false);
    }
    fetchMessages();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });

    const channel = pusher.subscribe(`private-conversation-${selectedId}`);
    channel.bind("new-message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? { ...c, lastMessage: { content: msg.content, senderId: msg.senderId, createdAt: msg.createdAt }, lastMessageAt: msg.createdAt }
            : c
        )
      );
    });

    return () => {
      pusher.unsubscribe(`private-conversation-${selectedId}`);
      pusher.disconnect();
    };
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedId
              ? { ...c, lastMessage: { content: data.message.content, senderId: userId, createdAt: data.message.createdAt }, lastMessageAt: data.message.createdAt }
              : c
          )
        );
      }
    } finally {
      setSending(false);
    }
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-200px)] rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Conversation List */}
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Messages</h2>
        </div>
        <div className="overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-zinc-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-500">No conversations yet</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full border-b border-zinc-100 p-4 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${selectedId === conv.id ? "bg-zinc-50 dark:bg-zinc-900" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {conv.otherUser?.name || "Unknown"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 truncate">
                      {conv.product?.title || "Product"}
                    </p>
                    {conv.lastMessage && (
                      <p className="mt-1 text-xs text-zinc-400 truncate">
                        {conv.lastMessage.senderId === userId ? "You: " : ""}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        {selectedId && selectedConversation ? (
          <>
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {selectedConversation.otherUser?.name}
              </p>
              <p className="text-xs text-zinc-500">
                Re: {selectedConversation.product?.title}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${msg.senderId === userId ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"}`}>
                    <p>{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${msg.senderId === userId ? "text-emerald-200" : "text-zinc-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={2000}
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
                <button type="submit" disabled={!newMessage.trim() || sending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                  {sending ? "..." : "Send"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
