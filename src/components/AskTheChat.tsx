"use client";

import React, { useState } from "react";
import { ParsedMessage } from "@/types/chat";
import { SourceMessage } from "@/types/qa";
import {
  Send,
  Sparkles,
  MessageSquareQuote,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  AlertCircle,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { SourceCitationModal } from "./SourceCitationModal";

interface QAHistoryItem {
  id: string;
  question: string;
  answer: string;
  sources: SourceMessage[];
  timestamp: string;
}

interface AskTheChatProps {
  messages: ParsedMessage[];
  messagesMap: Record<string, ParsedMessage>;
  apiKey?: string;
  groupName?: string;
}

const SUGGESTED_QUESTIONS = [
  "What were the main decisions made?",
  "What issues are currently unresolved?",
  "What upcoming events or deadlines were mentioned?",
  "What was decided about visitor parking?",
  "What did people discuss about maintenance?",
];

export const AskTheChat: React.FC<AskTheChatProps> = ({
  messages,
  messagesMap,
  apiKey,
  groupName,
}) => {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QAHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<
    Record<string, boolean>
  >({});
  const [modalCitation, setModalCitation] = useState<{
    title: string;
    sourceMessageIds: string[];
  } | null>(null);

  const formatTime = (isoDate: string) => {
    try {
      return format(parseISO(isoDate), "dd MMM, HH:mm");
    } catch {
      return isoDate;
    }
  };

  const toggleSourceExpansion = (itemIndex: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [itemIndex]: !prev[itemIndex],
    }));
  };

  const handleAsk = async (queryText?: string) => {
    const activeQuestion = (queryText || question).trim();
    if (!activeQuestion || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Build recent conversation turns for context
    const conversationTurns = history.flatMap((item) => [
      { role: "user" as const, content: item.question },
      { role: "assistant" as const, content: item.answer },
    ]);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: activeQuestion,
          messages,
          apiKey: apiKey || undefined,
          history: conversationTurns,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate answer.");
      }

      const newItem: QAHistoryItem = {
        id: `qa-${Date.now()}`,
        question: activeQuestion,
        answer: data.answer,
        sources: data.sources || [],
        timestamp: new Date().toISOString(),
      };

      setHistory((prev) => [...prev, newItem]);
      // Auto-expand sources for the newly received item if sources exist
      if (newItem.sources.length > 0) {
        setExpandedSources((prev) => ({ ...prev, [newItem.id]: true }));
      }
      setQuestion("");
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900">Ask the Chat</h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                Grounded Q&A
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Ask anything about{" "}
              {groupName ? `"${groupName}"` : "this conversation"}. Answers are
              grounded strictly in original messages.
            </p>
          </div>
        </div>

        {history.length > 0 && (
    <div className="flex flex-col space-y-4">
      {/* Header Actions (when conversation history is active) */}
      {history.length > 0 && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Conversation History ({history.length})
          </span>
          <button
            onClick={() => setHistory([])}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors self-start sm:self-auto"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
            title="Clear Q&A History"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
            <span>Clear</span>
          </button>
        )}
      </div>
        </div>
      )}

      {/* Suggested Questions */}
      {history.length === 0 && (
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Suggested Questions
          </span>
          <div className="flex flex-wrap gap-2">
          <div className="flex flex-col gap-2">
            {SUGGESTED_QUESTIONS.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(sug)}
                disabled={isLoading}
                className="text-xs font-medium text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 px-3.5 py-2 rounded-xl transition-all text-left"
                className="w-full text-xs font-medium text-slate-700 bg-slate-50/80 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-slate-200 px-3.5 py-2.5 rounded-xl transition-all text-left leading-snug"
              >
                &ldquo;{sug}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Q&A Exchange History */}
      {history.length > 0 && (
        <div className="space-y-6 pt-2">
        <div className="space-y-5 pt-1">
        <div className="space-y-4 pt-1">
          {history.map((item) => {
            const isExpanded = Boolean(expandedSources[item.id]);

            return (
              <div key={item.id} className="space-y-3 animate-in fade-in">
              <div key={item.id} className="space-y-2.5 animate-in fade-in">
                {/* User Question */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-slate-900 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm font-medium shadow-xs">
                  <div className="max-w-[90%] bg-slate-900 text-white px-3.5 py-2 rounded-2xl rounded-tr-xs text-xs font-medium shadow-2xs leading-relaxed">
                    {item.question}
                  </div>
                </div>

                {/* AI Answer Card */}
                <div className="flex justify-start">
                  <div className="max-w-full w-full bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm p-5 space-y-3.5 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5" />
                  <div className="max-w-full w-full bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-xs p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Sparkles className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        Answer
                      </span>
                    </div>

                    <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {item.answer}
                    </p>

                    {/* Sources Section */}
                    {item.sources && item.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleSourceExpansion(item.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
                          >
                            <MessageSquareQuote className="h-3.5 w-3.5" />
                            <MessageSquareQuote className="h-3 w-3" />
                            <span>
                              {item.sources.length} Verified Source Message
                              {item.sources.length} Source
                              {item.sources.length > 1 ? "s" : ""}
                              {item.sources.length} Source{item.sources.length > 1 ? "s" : ""}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>

                          <button
                            onClick={() =>
                              setModalCitation({
                                title: item.question,
                                sourceMessageIds: item.sources.map((s) => s.id),
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 hover:underline"
                          >
                            <span>Inspect context</span>
                            <ExternalLink className="h-3 w-3" />
                            <span>Inspect</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                        </div>

                        {/* Expandable Source Bubbles */}
                        {isExpanded && (
                          <div className="space-y-2 pt-1 animate-in fade-in">
                          <div className="space-y-1.5 pt-1 animate-in fade-in">
                            {item.sources.map((src) => (
                              <div
                                key={src.id}
                                className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1 shadow-2xs"
                                className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1 shadow-2xs"
                              >
                                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                                    <User className="h-3 w-3 text-emerald-600" />
                                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                                    <User className="h-2.5 w-2.5 text-emerald-600" />
                                    <span>{src.sender}</span>
                                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-400 font-mono">
                                    <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-400 font-mono text-[9px]">
                                      {src.id}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                  <div className="flex items-center gap-0.5">
                                    <Calendar className="h-2.5 w-2.5" />
                                    <span>{formatTime(src.timestamp)}</span>
                                  </div>
                                </div>
                                <p className="text-slate-800 whitespace-pre-wrap pt-0.5 leading-relaxed">
                                <p className="text-slate-800 text-[11px] whitespace-pre-wrap pt-0.5 leading-relaxed">
                                  &ldquo;{src.content}&rdquo;
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-emerald-800 text-xs animate-in fade-in">
          <Loader2 className="h-4 w-4 animate-spin shrink-0 text-emerald-600" />
          <span>
            Searching conversation and synthesizing source-grounded answer...
          </span>
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs animate-in fade-in">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-emerald-600" />
          <span>Searching conversation & formulating answer...</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Input Form */}
      <div className="pt-2">
      <div className="pt-2 sticky bottom-0 bg-white/95 backdrop-blur-sm pb-1">
        <div className="relative flex items-center">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask a question about this chat (e.g. 'What was decided about parking?')..."
            className="w-full text-sm px-4 py-3.5 pr-14 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            placeholder="Ask a question about this chat..."
            className="w-full text-xs px-3.5 py-3 pr-11 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />

          <button
            type="button"
            onClick={() => handleAsk()}
            disabled={isLoading || !question.trim()}
            className="absolute right-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-all shadow-xs"
            className="absolute right-1.5 p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-all shadow-2xs"
            title="Send Question"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Context Inspection Modal */}
      {modalCitation && (
        <SourceCitationModal
          isOpen={Boolean(modalCitation)}
          onClose={() => setModalCitation(null)}
          title={modalCitation.title}
          sourceMessageIds={modalCitation.sourceMessageIds}
          messagesMap={messagesMap}
        />
      )}
    </div>
  );
};
