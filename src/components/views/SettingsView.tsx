"use client";

import React, { useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import {
  Settings,
  Key,
  Check,
  Shield,
  Trash2,
  Cpu,
  Eye,
  EyeOff,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const { apiKey, setApiKey, chats, deleteChat } = useChatContext();
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setApiKey(inputKey.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClearAllChats = () => {
    if (
      confirm("Are you sure you want to remove all chats from this session?")
    ) {
      chats.forEach((c) => deleteChat(c.id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
            <Settings className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Settings & Preferences
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Manage your AI provider credentials, models, and session data.
        </p>
      </div>

      {/* 1. API Key Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Google Gemini API Key
            </h3>
            <p className="text-xs text-slate-500">
              Optional: Provide your personal API key. If omitted, ChatDigest
              uses server configuration.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Enter your Gemini API key (AIzaSy...)"
              className="w-full text-xs px-4 py-3 pr-24 rounded-2xl border border-slate-300 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              Keys are stored only in your local browser storage and sent via
              secure HTTPS headers.
            </span>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all"
            >
              {isSaved ? <Check className="h-4 w-4" /> : null}
              <span>{isSaved ? "Saved!" : "Save Key"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Model Information */}
      {/* <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">
              AI Model Engine
            </h3>
            <p className="text-xs text-slate-500">
              High-speed reasoning with automatic multi-model fallback.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Primary Model:</span>
            <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              gemini-2.5-flash
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">
              Fallback Models:
            </span>
            <span className="font-mono text-slate-500">
              gemini-1.5-flash &bull; gemini-1.5-pro
            </span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            If a model tier experiences rate limits or service interruptions,
            ChatDigest automatically falls back to secondary models to complete
            your summary.
          </p>
        </div>
      </div> */}

      {/* 3. Privacy & Session Management */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Privacy & Local Session Data
            </h3>
            <p className="text-xs text-slate-500">
              Your conversations are processed in-memory and never written to
              permanent server databases.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            Currently holding <strong>{chats.length}</strong> chat session
            {chats.length === 1 ? "" : "s"}.
          </div>

          <button
            onClick={handleClearAllChats}
            disabled={chats.length === 0}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Session Chats</span>
          </button>
        </div>
      </div>
    </div>
  );
};
