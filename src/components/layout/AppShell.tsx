"use client";

import React, { useState } from "react";
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
  Menu,
  X,
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleNavClick = (viewId: NavigationView) => {
    setActiveView(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 overflow-hidden font-sans">
      {/* 1. Desktop Left Sidebar Navigation (hidden on mobile/tablet < lg) */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200/80 bg-white flex-col justify-between shrink-0 z-30">
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

        {/* Desktop Navigation Links */}
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

        {/* Desktop Bottom Status Section */}
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

      {/* 2. Slide-over Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-5 z-10 animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <MessageSquareText className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-base text-slate-900 leading-none block">
                      ChatDigest
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Mobile Menu
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="py-4 space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600"
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
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            isActive
                              ? "bg-emerald-200 text-emerald-900"
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
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                onClick={() => handleNavClick("settings")}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold ${
                  apiKey
                    ? "bg-emerald-50/60 text-emerald-800 border-emerald-200"
                    : "bg-amber-50/60 text-amber-800 border-amber-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-emerald-600" />
                  <span>{apiKey ? "Gemini Key Configured" : "Add API Key"}</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Settings
                </span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Zero data retained</span>
                </span>
                <span className="bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                  v1.0
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Mobile Header (visible on < lg) */}
        <header className="lg:hidden h-14 border-b border-slate-200/80 bg-white px-4 flex items-center justify-between gap-3 shrink-0 z-20">
          <button
            onClick={() => setActiveView("home")}
            className="flex items-center gap-2 text-left"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquareText className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              ChatDigest
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView("settings")}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                apiKey
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
              title="API Key Configuration"
            >
              <Key className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Desktop Top Header Bar (Hidden in Summaries section for clean full-height split view) */}
        {activeView !== "summaries" && (
          <header className="hidden lg:flex h-16 border-b border-slate-200/80 bg-white px-6 items-center justify-between gap-4 shrink-0">
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

        {/* Dynamic View Canvas (pb-20 on mobile to avoid bottom navigation bar overlap) */}
        <main className="flex-1 overflow-y-auto bg-white pb-20 lg:pb-0">
          {children}
        </main>

        {/* 4. Mobile Bottom Navigation Bar (< lg) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                  isActive
                    ? "text-emerald-700 font-bold"
                    : "text-slate-400 hover:text-slate-600 font-medium"
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 ${isActive ? "text-emerald-600 stroke-[2.5]" : "text-slate-400"}`}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 h-4 min-w-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
