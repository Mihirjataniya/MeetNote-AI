import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { useSocketStore } from "../stores/useSocketStore";
import { useAuthStore } from "../stores/useAuthStore";
import { getStoredToken } from "../services/auth";
import { Icon } from "./shell/Icon";
import { Avatar } from "./shell/Avatar";
import type { ChatMessagePayload } from "../types/index";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface ChatPanelProps {
  roomId: string;
  onClose: () => void;
}

export function ChatPanel({ roomId, onClose }: ChatPanelProps) {
  const socket = useSocketStore((s) => s.socket);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useLayoutEffect(() => {
    requestAnimationFrame(() => setReady(true));
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { setLoading(false); return; }

    fetch(`${API_BASE}/api/chat/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (payload: ChatMessagePayload) => {
      setMessages((prev) => [...prev, payload]);
    };

    socket.on("chat-message", handleMessage);
    return () => {
      socket.off("chat-message", handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!showEmoji) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmoji]);

  const onEmojiClick = useCallback((emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !socket || sending) return;

    setSending(true);
    setShowEmoji(false);
    socket.emit("send-message", { roomId, text: trimmed }, () => {
      setSending(false);
    });
    setText("");
  }, [text, socket, roomId, sending]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`fixed bottom-20 right-3 z-30 w-[calc(100%-24px)] max-w-[340px] h-[60vh] rounded-2xl border border-white/[0.1] sm:static sm:z-auto sm:w-full sm:h-full sm:max-w-none sm:rounded-2xl sm:border sm:border-white/[0.1] bg-[#111] flex flex-col shadow-2xl transition-all duration-300 ease-out ${
        ready ? "opacity-100 translate-y-0 sm:translate-x-0" : "opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-4"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-white/[0.08] shrink-0">
        <h3 className="text-[14px] font-semibold text-white">Chat</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-[fadeIn_0.3s_ease]">
            <Icon name="chat" size={24} className="text-white/15 mb-2" />
            <p className="text-[12px] text-white/30">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {!loading &&
          messages.map((msg) => {
            const isOwn = msg.userId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 animate-[fadeIn_0.2s_ease] ${isOwn ? "flex-row-reverse" : ""}`}
              >
                {!isOwn && <Avatar name={msg.displayName} size={28} />}
                <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && (
                    <span className="text-[11px] text-white/40 mb-0.5 block">
                      {msg.displayName}
                    </span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                      isOwn
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white/[0.08] text-white/90 rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-white/25 mt-0.5 block">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div ref={emojiRef} className="absolute bottom-16 left-2 right-2 z-10">
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={onEmojiClick}
            width="100%"
            height={350}
            searchPlaceholder="Search emoji..."
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-white/[0.08] shrink-0">
        <div className="flex items-center gap-1.5 bg-white/[0.06] rounded-xl px-3 py-1.5 border border-white/[0.08] focus-within:border-white/[0.15] transition-colors">
          <button
            onClick={() => setShowEmoji((p) => !p)}
            className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors ${
              showEmoji
                ? "text-white bg-white/[0.1]"
                : "text-white/40 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            <Icon name="smile" size={18} />
          </button>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 bg-transparent text-[16px] sm:text-[13px] text-white placeholder:text-white/30 outline-none py-1"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/40"
          >
            <Icon name="send" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
