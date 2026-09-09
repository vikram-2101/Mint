"use client";

import React, { useState } from "react";
import { ChatMetadata } from "@/types/chat";
import {
  Users,
  MessageSquare,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface ChatPreviewProps {
  metadata: ChatMetadata;
  fileName: string;
  onReset: () => void;
}

export const ChatPreview: React.FC<ChatPreviewProps> = ({
  metadata,
  fileName,
  onReset,
}) => {
  const [showAllParticipants, setShowAllParticipants] = useState(false);

  const formatDateLabel = (isoDate: string | null) => {
    if (!isoDate) return "Unknown";
    try {
      return format(parseISO(isoDate), "dd MMM yyyy, HH:mm");
    } catch {
      return isoDate;
    }
  };

  const visibleParticipants = showAllParticipants
    ? metadata.participants
    : metadata.participants.slice(0, 8);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
              {fileName}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {metadata.groupName || "WhatsApp Group Chat"}
          </h2>
        </div>

        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Upload Different File</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">
              Messages Parsed
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {metadata.totalMessages.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">
              Participants
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {metadata.participantCount.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">
              Full Date Span
            </div>
            <div className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 truncate max-w-[180px]">
              {formatDateLabel(metadata.startDate)} &rarr;{" "}
              {formatDateLabel(metadata.endDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Participants list */}
      {metadata.participants.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Members ({metadata.participantCount})
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {visibleParticipants.map((p, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                {p}
              </span>
            ))}

            {metadata.participants.length > 8 && (
              <button
                onClick={() => setShowAllParticipants(!showAllParticipants)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 font-medium ml-1"
              >
                <span>
                  {showAllParticipants
                    ? "Show less"
                    : `+${metadata.participants.length - 8} more`}
                </span>
                {showAllParticipants ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
