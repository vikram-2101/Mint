"use client";

import React from "react";
import { useChatContext } from "@/context/ChatContext";
import {
  Folder,
  MessageSquare,
  Users,
  Calendar,
  FileText,
  Sparkles,
  ArrowRight,
  Trash2,
  Plus,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export const MyChatsView: React.FC = () => {
  const { chats, setActiveChatId, setActiveView, deleteChat, searchQuery } =
    useChatContext();

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      chat.name.toLowerCase().includes(q) ||
      chat.fileName.toLowerCase().includes(q) ||
      chat.metadata.participants.some((p) => p.toLowerCase().includes(q))
    );
  });

  const formatDateLabel = (isoDate: string | null) => {
    if (!isoDate) return "";
    try {
      return format(parseISO(isoDate), "dd MMM yyyy");
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
              <Folder className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">My Chats</h1>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
              {chats.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse and manage WhatsApp conversations uploaded in this session.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveChatId(null);
            setActiveView("home");
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Upload New Chat</span>
        </button>
      </div>

      {/* Chats Grid */}
      {filteredChats.length === 0 ? (
        <div className="text-center py-16 space-y-4 bg-white border border-slate-200/80 rounded-3xl p-8">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <MessageSquare className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {searchQuery
                ? "No chats match your search"
                : "No chats uploaded yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? "Try searching for a different keyword or group name."
                : "Upload an exported WhatsApp .txt file or try our sample apartment conversation to get started."}
            </p>
          </div>
          {/* <button
            onClick={() => {
              setActiveChatId(null);
              setActiveView("home");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            <span>Upload Chat</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button> */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChats.map((chat) => {
            const isSummarized = chat.summary !== null;

            return (
              <div
                key={chat.id}
                className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-3xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Top Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                          {chat.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {chat.fileName}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isSummarized ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>Summarized</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Ready to summarize
                      </span>
                    )}
                  </div>

                  {/* Key Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {chat.metadata.totalMessages.toLocaleString()} msgs
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{chat.metadata.participantCount} members</span>
                    </div>
                  </div>

                  {chat.metadata.startDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatDateLabel(chat.metadata.startDate)} &rarr;{" "}
                        {formatDateLabel(chat.metadata.endDate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setActiveChatId(chat.id);
                      setActiveView("home"); // Opens Overview screen for this chat
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Overview
                  </button>

                  {isSummarized ? (
                    <button
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setActiveView("summaries");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 rounded-xl shadow-2xs transition-all"
                    >
                      <span>View Summary</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setActiveView("home");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl transition-all"
                    >
                      <span>Summarize</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
