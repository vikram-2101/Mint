"use client";

import React, { useState, useMemo } from "react";
import { DateFilterPreset, ParsedMessage } from "@/types/chat";
import { filterMessagesByDateRange } from "@/lib/parser/date-filter";
import { Clock, Calendar, Sparkles, Filter, Loader2 } from "lucide-react";

interface DateRangeSelectorProps {
  messages: ParsedMessage[];
  onSummarize: (
    preset: DateFilterPreset,
    startDate?: string,
    endDate?: string,
  ) => void;
  isLoading?: boolean;
}

const PRESETS: Array<{
  id: DateFilterPreset;
  label: string;
  description: string;
}> = [
  {
    id: "all",
    label: "All Messages",
    description: "Summarize entire exported conversation",
  },
  {
    id: "last24h",
    label: "Last 24 Hours",
    description: "Recent day before chat end",
  },
  { id: "last7d", label: "Last 7 Days", description: "Past week activity" },
  { id: "last30d", label: "Last 30 Days", description: "Past month activity" },
  { id: "custom", label: "Custom Range", description: "Specific date bounds" },
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  messages,
  onSummarize,
  isLoading,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<DateFilterPreset>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const filteredCount = useMemo(() => {
    const filtered = filterMessagesByDateRange(messages, {
      preset: selectedPreset,
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
    });
    return filtered.length;
  }, [messages, selectedPreset, customStart, customEnd]);

  const handleGenerate = () => {
    onSummarize(
      selectedPreset,
      customStart ? new Date(customStart).toISOString() : undefined,
      customEnd ? new Date(customEnd).toISOString() : undefined,
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2.5 pb-2">
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
          <Filter className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Select Time Range to Summarize
          </h3>
          <p className="text-xs text-slate-500">
            Messages are filtered before entering the AI pipeline to maximize
            relevance and stay within context budgets.
          </p>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {PRESETS.map((preset) => {
          const isActive = selectedPreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(preset.id)}
              disabled={isLoading}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300"
              }`}
            >
              <span className="text-xs font-semibold">{preset.label}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Date Pickers */}
      {selectedPreset === "custom" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 animate-in fade-in">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Start Date & Time</span>
            </label>
            <input
              type="datetime-local"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>End Date & Time</span>
            </label>
            <input
              type="datetime-local"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Summary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            Selected Period:{" "}
            <strong className="text-slate-900 dark:text-white">
              {filteredCount.toLocaleString()}
            </strong>{" "}
            of {messages.length.toLocaleString()} messages
          </span>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || filteredCount === 0}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing & Summarizing...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate Structured Summary</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
