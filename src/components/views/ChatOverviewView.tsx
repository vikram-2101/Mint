"use client";

import React, { useState, useMemo } from "react";
import { useChatContext } from "@/context/ChatContext";
import { DateFilterPreset } from "@/types/chat";
import { filterMessagesByDateRange } from "@/lib/parser/date-filter";
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  CheckCircle2,
  MessageSquare,
  Users,
  Calendar,
  HardDrive,
  Sparkles,
  Loader2,
  Lightbulb,
  Shield,
  X,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";

export const ChatOverviewView: React.FC = () => {
  const {
    activeChat,
    setActiveChatId,
    setActiveView,
    deleteChat,
    generateSummaryForChat,
    isSummarizing,
    loadSampleChat,
  } = useChatContext();

  const [selectedPreset, setSelectedPreset] = useState<DateFilterPreset>(
    activeChat?.selectedPreset || "all",
  );
  const [customStart, setCustomStart] = useState(
    activeChat?.customStartDate || "",
  );
  const [customEnd, setCustomEnd] = useState(activeChat?.customEndDate || "");
  const [showAllParticipantsModal, setShowAllParticipantsModal] =
    useState(false);

  if (!activeChat) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-slate-500">No chat selected.</p>
        <button
          onClick={() => setActiveView("home")}
          className="text-xs text-emerald-600 font-semibold hover:underline"
        >
          Return to Upload
        </button>
      </div>
    );
  }

  // Calculate filtered message count in real time
  const filteredCount = useMemo(() => {
    const filtered = filterMessagesByDateRange(activeChat.messages, {
      preset: selectedPreset,
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
    });
    return filtered.length;
  }, [activeChat.messages, selectedPreset, customStart, customEnd]);

  const formatDateLabel = (isoDate: string | null) => {
    if (!isoDate) return "Unknown";
    try {
      return format(parseISO(isoDate), "dd MMM yyyy");
    } catch {
      return isoDate;
    }
  };

  const calculateDaysSpan = () => {
    if (!activeChat.metadata.startDate || !activeChat.metadata.endDate)
      return "";
    try {
      const days = differenceInDays(
        parseISO(activeChat.metadata.endDate),
        parseISO(activeChat.metadata.startDate),
      );
      return days > 0 ? `(${days} days)` : "(1 day)";
    } catch {
      return "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.ceil(bytes / 1024)} KB`;
  };

  const getInitials = (name: string) => {
    return (
      name
        .split(/\s+/)
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "U"
    );
  };

  const PRESETS: Array<{ id: DateFilterPreset; label: string; desc: string }> =
    [
      {
        id: "all",
        label: "All Messages",
        desc: "Summarize entire conversation",
      },
      { id: "last24h", label: "Last 24 Hours", desc: "Recent activity" },
      { id: "last7d", label: "Last 7 Days", desc: "Past week activity" },
      { id: "last30d", label: "Last 30 Days", desc: "Past month activity" },
      { id: "custom", label: "Custom Range", desc: "Pick specific dates" },
    ];

  const handleGenerate = async () => {
    await generateSummaryForChat(
      activeChat.id,
      selectedPreset,
      customStart ? new Date(customStart).toISOString() : undefined,
      customEnd ? new Date(customEnd).toISOString() : undefined,
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 animate-in fade-in duration-300">
      {/* 1. Top Action Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setActiveChatId(null);
            setActiveView("home");
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Upload</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveChatId(null);
              setActiveView("home");
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span>Upload Different File</span>
          </button>
        </div>
      </div>

      {/* 2. Header Chat Info Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
              <FileText className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {activeChat.name}
                </h2>
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Parsed
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {activeChat.fileName} &bull; Uploaded just now
              </p>
            </div>
          </div>

          {/* Green Status Box */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 max-w-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-950">
                Chat processed successfully
              </div>
              <div className="text-[11px] text-emerald-700">
                Your chat is ready to be summarized.
              </div>
            </div>
          </div>
        </div>

        {/* 3. 4-Column Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
          {/* Messages */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">
                Total Messages
              </div>
              <div className="text-lg font-extrabold text-slate-900">
                {activeChat.metadata.totalMessages.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">
                Participants
              </div>
              <div className="text-lg font-extrabold text-slate-900">
                {activeChat.metadata.participantCount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-400">
                Date Range
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {formatDateLabel(activeChat.metadata.startDate)} &rarr;{" "}
                {formatDateLabel(activeChat.metadata.endDate)}
              </div>
              <div className="text-[10px] text-slate-400">
                {calculateDaysSpan()}
              </div>
            </div>
          </div>

          {/* File Size */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">
                File Size
              </div>
              <div className="text-lg font-extrabold text-slate-900">
                {formatFileSize(activeChat.fileSizeBytes)}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Active Members Row */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Members ({activeChat.metadata.participantCount})
            </div>
            <div className="flex items-center flex-wrap gap-1.5">
              {activeChat.metadata.participants.slice(0, 8).map((p, idx) => (
                <div
                  key={idx}
                  className="h-7 px-2.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center border border-slate-200/60"
                  title={p}
                >
                  {getInitials(p)}
                </div>
              ))}

              {activeChat.metadata.participants.length > 8 && (
                <div className="h-7 px-2 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center justify-center border border-emerald-200">
                  +{activeChat.metadata.participants.length - 8}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowAllParticipantsModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors self-start sm:self-auto"
          >
            <Users className="h-3.5 w-3.5" />
            <span>View all participants</span>
          </button>
        </div>
      </div>

      {/* 5. Select Time Range to Summarize Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-600">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Select Time Range to Summarize
            </h3>
            <p className="text-xs text-slate-500">
              Choose the period you want to analyze. Messages are filtered
              before entering the AI pipeline.
            </p>
          </div>
        </div>

        {/* Radio Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPreset(preset.id)}
                disabled={isSummarizing}
                className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-xs font-bold leading-none">
                    {preset.label}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {preset.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Range Picker */}
        {selectedPreset === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            <span>
              Selected:{" "}
              <strong className="text-slate-900">
                {filteredCount.toLocaleString()}
              </strong>{" "}
              of {activeChat.messages.length.toLocaleString()} messages
            </span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isSummarizing || filteredCount === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-800/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            {isSummarizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Summary...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Structured Summary &rarr;</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 6. Footer Info Cards */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-950">Tip</div>
            <div className="text-[11px] text-amber-800">
              You can ask questions about this chat in the AI copilot sidebar
              after generating the summary.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-950">
              Your data stays private
            </div>
            <div className="text-[11px] text-emerald-800">
              We don&apos;t store or share your chats with anyone. Processing is
              100% ephemeral.
            </div>
          </div>
        </div>
      </div> */}

      {/* View All Participants Modal */}
      {showAllParticipantsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>
                  All Participants ({activeChat.metadata.participantCount})
                </span>
              </h3>
              <button
                onClick={() => setShowAllParticipantsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2 max-h-[60vh]">
              {activeChat.metadata.participants.map((participant, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs font-medium text-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center">
                      {getInitials(participant)}
                    </div>
                    <span>{participant}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Member #{idx + 1}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowAllParticipantsModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
