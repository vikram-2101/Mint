"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ParsedMessage, ChatMetadata, DateFilterPreset } from "@/types/chat";
import { ChatDigestSummary } from "@/types/summary";
import { SourceMessage } from "@/types/qa";
import { parseWhatsAppChat } from "@/lib/parser/whatsapp-parser";
import { ANDROID_24H_CHAT } from "@/lib/fixtures/sample-chat";

export interface QAExchange {
  id: string;
  question: string;
  answer: string;
  sources: SourceMessage[];
  timestamp: string;
}

export interface StoredChat {
  id: string;
  name: string;
  fileName: string;
  fileSizeBytes: number;
  rawText: string;
  messages: ParsedMessage[];
  metadata: ChatMetadata;
  summary: ChatDigestSummary | null;
  messagesMap: Record<string, ParsedMessage>;
  qaHistory: QAExchange[];
  uploadedAt: string;
  lastSummarizedAt: string | null;
  selectedPreset?: DateFilterPreset;
  customStartDate?: string;
  customEndDate?: string;
}

export type NavigationView = "home" | "my-chats" | "summaries" | "settings";

interface ChatContextType {
  chats: StoredChat[];
  activeChatId: string | null;
  activeChat: StoredChat | null;
  activeView: NavigationView;
  apiKey: string;
  searchQuery: string;
  isSummarizing: boolean;
  errorMessage: string | null;
  setActiveView: (view: NavigationView) => void;
  setActiveChatId: (id: string | null) => void;
  setApiKey: (key: string) => void;
  setSearchQuery: (query: string) => void;
  setErrorMessage: (msg: string | null) => void;
  uploadChatText: (
    text: string,
    fileName: string,
    fileSizeBytes?: number,
  ) => StoredChat;
  loadSampleChat: () => StoredChat;
  generateSummaryForChat: (
    chatId: string,
    preset: DateFilterPreset,
    startDate?: string,
    endDate?: string,
  ) => Promise<void>;
  addQATurnToChat: (chatId: string, turn: QAExchange) => void;
  clearQAHistory: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [chats, setChats] = useState<StoredChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<NavigationView>("home");
  const [apiKey, setApiKeyState] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load API key from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("chatdigest_gemini_key");
      if (savedKey) setApiKeyState(savedKey);
    } catch {
      // Ignore
    }
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    try {
      if (key) {
        localStorage.setItem("chatdigest_gemini_key", key);
      } else {
        localStorage.removeItem("chatdigest_gemini_key");
      }
    } catch {
      // Ignore
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const uploadChatText = (
    text: string,
    fileName: string,
    fileSizeBytes: number = text.length,
  ): StoredChat => {
    setErrorMessage(null);
    const parsed = parseWhatsAppChat(text);

    if (parsed.messages.length === 0) {
      throw new Error(
        "Could not parse messages from the uploaded file. Please ensure it is a valid WhatsApp .txt export.",
      );
    }

    const messagesMap: Record<string, ParsedMessage> = {};
    for (const msg of parsed.messages) {
      messagesMap[msg.id] = msg;
    }

    const newChat: StoredChat = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name:
        parsed.metadata.groupName ||
        fileName.replace(/\.txt$/i, "") ||
        "WhatsApp Chat",
      fileName,
      fileSizeBytes,
      rawText: text,
      messages: parsed.messages,
      metadata: parsed.metadata,
      summary: null,
      messagesMap,
      qaHistory: [],
      uploadedAt: new Date().toISOString(),
      lastSummarizedAt: null,
      selectedPreset: "all",
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setActiveView("home"); // Remains in overview mode on Home view
    return newChat;
  };

  const loadSampleChat = (): StoredChat => {
    return uploadChatText(
      ANDROID_24H_CHAT,
      "Residents Group.txt",
      3.2 * 1024 * 1024, // Display as sample 3.2 MB
    );
  };

  const generateSummaryForChat = async (
    chatId: string,
    preset: DateFilterPreset,
    startDate?: string,
    endDate?: string,
  ) => {
    const targetChat = chats.find((c) => c.id === chatId);
    if (!targetChat) return;

    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rawText: targetChat.rawText,
          preset,
          startDate,
          endDate,
          apiKey: apiKey || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate summary.");
      }

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === chatId) {
            return {
              ...chat,
              summary: data.summary,
              messagesMap: data.messagesMap || chat.messagesMap,
              lastSummarizedAt: new Date().toISOString(),
              selectedPreset: preset,
              customStartDate: startDate,
              customEndDate: endDate,
            };
          }
          return chat;
        }),
      );

      // Navigate to summaries view to show the result + right copilot!
      setActiveChatId(chatId);
      setActiveView("summaries");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message);
      throw error;
    } finally {
      setIsSummarizing(false);
    }
  };

  const addQATurnToChat = (chatId: string, turn: QAExchange) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            qaHistory: [...chat.qaHistory, turn],
          };
        }
        return chat;
      }),
    );
  };

  const clearQAHistory = (chatId: string) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            qaHistory: [],
          };
        }
        return chat;
      }),
    );
  };

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setActiveView("home");
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        activeChat,
        activeView,
        apiKey,
        searchQuery,
        isSummarizing,
        errorMessage,
        setActiveView,
        setActiveChatId,
        setApiKey,
        setSearchQuery,
        setErrorMessage,
        uploadChatText,
        loadSampleChat,
        generateSummaryForChat,
        addQATurnToChat,
        clearQAHistory,
        deleteChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
