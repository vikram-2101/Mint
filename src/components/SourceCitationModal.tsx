"use client";

import React from "react";
import { ParsedMessage } from "@/types/chat";
import { X, MessageSquareQuote, Calendar, User } from "lucide-react";
import { format, parseISO } from "date-fns";

interface SourceCitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sourceMessageIds: string[];
  messagesMap: Record<string, ParsedMessage>;
}

export const SourceCitationModal: React.FC<SourceCitationModalProps> = ({
  isOpen,
  onClose,
  title,
  sourceMessageIds,
  messagesMap,
}) => {
  if (!isOpen) return null;

  const resolvedMessages = sourceMessageIds
    .map((id) => messagesMap[id])
    .filter((msg): msg is ParsedMessage => Boolean(msg));

  const formatMessageTime = (isoDate: string) => {
    try {
      return format(parseISO(isoDate), "dd MMM yyyy, HH:mm:ss");
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              <MessageSquareQuote className="h-4 w-4 shrink-0" />
              <span className="truncate">Verified Source Messages ({resolvedMessages.length})</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2">
              &ldquo;{title}&rdquo;
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 divide-y divide-slate-100">
          {resolvedMessages.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Source message details are not available for this item.
            </div>
          ) : (
            resolvedMessages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`pt-4 first:pt-0 space-y-2`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700 truncate">
                    <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {msg.isSystem ? "[System Announcement]" : msg.sender}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono shrink-0">
                      {msg.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] shrink-0 text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span>{formatMessageTime(msg.timestamp)}</span>
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-500">
          <span>Traceability index: matches original export</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
