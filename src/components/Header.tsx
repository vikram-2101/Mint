"use client";

import React, { useState } from "react";
import { MessageSquareText, ShieldCheck, Key, Check } from "lucide-react";

interface HeaderProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ apiKey, onApiKeyChange }) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onApiKeyChange(tempKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowKeyModal(false);
    }, 800);
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                ChatDigest
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                MVP
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              WhatsApp Group Chat Summarizer with Source Traceability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
            <ShieldCheck className="h-4 w-4" />
            <span>100% In-Memory & Privacy-First</span>
          </div>

          <button
            onClick={() => {
              setTempKey(apiKey);
              setShowKeyModal(true);
            }}
            className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            title="Configure Gemini API Key"
          >
            <Key className="h-3.5 w-3.5" />
            <span>{apiKey ? "API Key Configured" : "API Key"}</span>
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Google Gemini API Key
                </h3>
                <p className="text-xs text-slate-500">
                  Optional: override the server default API key
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-500">
                If omitted, ChatDigest will use the server&apos;s configured{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                  GEMINI_API_KEY
                </code>
                .
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
              >
                {saved ? <Check className="h-4 w-4" /> : null}
                <span>{saved ? "Saved!" : "Save Key"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
