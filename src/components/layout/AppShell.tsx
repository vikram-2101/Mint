"use client";

import React from "react";
import { useChatContext, NavigationView } from "@/context/ChatContext";
import {
  Home,
  Folder,
  FileText,
  Settings,
  Search,
  MessageSquareText,
  ShieldCheck,
  HelpCircle,
  Key,
  Sparkles,
} from "lucide-react";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    chats,
    activeView,
    setActiveView,
    apiKey,
    searchQuery,
    setSearchQuery,
  } = useChatContext();

  const summarizedCount = chats.filter((c) => c.summary !== null).length;

  const NAV_ITEMS: Array<{
    id: NavigationView;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }> = [
    { id: "home", label: "Home", icon: Home },
    { id: "my-chats", label: "My Chats", icon: Folder, badge: chats.length },
    {
      id: "summaries",
      label: "Summaries",
      icon: FileText,
      badge: summarizedCount,
    },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 overflow-hidden font-sans">
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between shrink-0 z-30">
        {/* Top Logo Section */}
        <div className="p-6 pb-4">
          <button
            onClick={() => setActiveView("home")}
            className="flex items-center gap-3 text-left group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-tight block">
                ChatDigest
              </span>
              <span className="text-[11px] text-slate-400 font-medium block">
                For calmer group chats
              </span>
            </div>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 py-2 space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 shadow-2xs font-bold border-l-4 border-emerald-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? "bg-emerald-200/80 text-emerald-800"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Status Section */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-1">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Zero data retained</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
              v1.0
            </span>
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Top Header Bar - Hidden in Summaries section for clean full-height split view */}
        {activeView !== "summaries" && (
          <header className="h-16 border-b border-slate-200/80 bg-white px-6 flex items-center justify-between gap-4 shrink-0">
            {/* Global Search Bar */}
            <div className="max-w-md w-full relative">
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your chats, topics, or questions..."
                className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Right Header Action Items */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView("settings")}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  apiKey
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
                title="Configure API Key in Settings"
              >
                <Key className="h-3.5 w-3.5" />
                <span>{apiKey ? "Gemini Key Configured" : "Add API Key"}</span>
              </button>

            <button
              onClick={() => setActiveView("home")}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Quick Help"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            </div>
          </header>
        )}

        {/* Dynamic View Canvas */}
        <main className="flex-1 overflow-y-auto bg-white">{children}</main>
      </div>
    </div>
  );
};
