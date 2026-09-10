"use client";

import React, { useState } from "react";
import { ChatDigestSummary } from "@/types/summary";
import { ParsedMessage } from "@/types/chat";
import {
  CheckCircle2,
  HelpCircle,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Copy,
  Check,
  Download,
  RotateCcw,
  ExternalLink,
  Users,
  Layers,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { SourceCitationModal } from "./SourceCitationModal";
import { AskTheChat } from "./AskTheChat";

interface SummaryViewerProps {
  summary: ChatDigestSummary;
  messagesMap: Record<string, ParsedMessage>;
  allMessages: ParsedMessage[];
  apiKey?: string;
  onReset: () => void;
  onSelectAnotherRange: () => void;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({
  summary,
  messagesMap,
  allMessages,
  apiKey,
  onReset,
  onSelectAnotherRange,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeCitation, setActiveCitation] = useState<{
    title: string;
    sourceMessageIds: string[];
  } | null>(null);

  const formatDateString = (isoString?: string) => {
    if (!isoString) return "";
    try {
      return format(parseISO(isoString), "dd MMM yyyy, HH:mm");
    } catch {
      return isoString;
    }
  };

  const generateMarkdown = () => {
    let md = `# Summary: ${summary.metadata.groupName || "WhatsApp Group Chat"}\n`;
    md += `**Date Range**: ${formatDateString(summary.metadata.dateRange.start)} - ${formatDateString(summary.metadata.dateRange.end)}\n`;
    md += `**Messages Analyzed**: ${summary.metadata.totalMessagesAnalyzed} | **Participants**: ${summary.metadata.participantCount}\n\n`;

    md += `## Overview\n${summary.overview}\n\n`;

    if (summary.keyDiscussions.length > 0) {
      md += `## Key Discussions\n`;
      summary.keyDiscussions.forEach((d, i) => {
        md += `### ${i + 1}. ${d.topic}\n${d.summary}\n\n`;
      });
    }

    if (summary.decisionsAndAnnouncements.length > 0) {
      md += `## Decisions & Announcements\n`;
      summary.decisionsAndAnnouncements.forEach((d) => {
        md += `- **Decision**: ${d.text}\n`;
      });
      md += "\n";
    }

    if (summary.issuesAndQuestions.length > 0) {
      md += `## Issues & Questions\n`;
      summary.issuesAndQuestions.forEach((issue) => {
        md += `- **[${issue.status.toUpperCase()}] ${issue.topic}**: ${issue.details}\n`;
      });
      md += "\n";
    }

    if (summary.unresolvedTopics.length > 0) {
      md += `## Unresolved Topics\n`;
      summary.unresolvedTopics.forEach((u) => {
        md += `- ${u}\n`;
      });
      md += "\n";
    }

    if (summary.importantDatesAndActions.length > 0) {
      md += `## Important Dates & Actions\n`;
      summary.importantDatesAndActions.forEach((item) => {
        md += `- **${item.date}**: ${item.description}\n`;
      });
      md += "\n";
    }

    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(summary, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `chat-summary-${new Date().toISOString().slice(0, 10)}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Digest Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              AI-Generated Group Digest
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              {summary.metadata.groupName || "WhatsApp Group Chat"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Period: {formatDateString(summary.metadata.dateRange.start)}{" "}
              &rarr; {formatDateString(summary.metadata.dateRange.end)}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span>{copied ? "Copied Markdown!" : "Copy Markdown"}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl transition-colors"
              title="Export as JSON"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>

            <button
              onClick={onSelectAnotherRange}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Change Range</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>
                {summary.metadata.totalMessagesAnalyzed.toLocaleString()}
              </strong>{" "}
              messages analyzed
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>
              <strong>
                {summary.metadata.participantCount.toLocaleString()}
              </strong>{" "}
              active members
            </span>
          </div>
        </div>
      </div>

      {/* 1. Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Executive Overview
        </h3>
        <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
          {summary.overview}
        </p>
      </div>

      {/* 2. Key Discussions */}
      {summary.keyDiscussions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Key Discussions
              </h3>
              <p className="text-xs text-slate-500">
                Primary topics debated and exchanged
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {summary.keyDiscussions.map((discussion, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {discussion.topic}
                  </h4>

                  {discussion.sourceMessageIds &&
                    discussion.sourceMessageIds.length > 0 && (
                      <button
                        onClick={() =>
                          setActiveCitation({
                            title: discussion.topic,
                            sourceMessageIds: discussion.sourceMessageIds,
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-900/50 shrink-0"
                      >
                        <span>
                          {discussion.sourceMessageIds.length} sources
                        </span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {discussion.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Decisions & Announcements */}
      {summary.decisionsAndAnnouncements.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Decisions & Announcements
              </h3>
              <p className="text-xs text-slate-500">
                Confirmed rules, resolutions, and official updates
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {summary.decisionsAndAnnouncements.map((decision, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40"
              >
                <div className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    {decision.text}
                  </span>
                </div>

                {decision.sourceMessageIds &&
                  decision.sourceMessageIds.length > 0 && (
                    <button
                      onClick={() =>
                        setActiveCitation({
                          title: decision.text,
                          sourceMessageIds: decision.sourceMessageIds,
                        })
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 shrink-0 shadow-2xs"
                    >
                      <span>View source</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Issues & Questions */}
      {summary.issuesAndQuestions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Issues & Questions
              </h3>
              <p className="text-xs text-slate-500">
                Concerns raised along with current resolution status
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {summary.issuesAndQuestions.map((issue, idx) => {
              const statusBadge =
                issue.status === "resolved"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : issue.status === "unresolved"
                    ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800";

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusBadge}`}
                      >
                        {issue.status.replace("_", " ")}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {issue.topic}
                      </h4>
                    </div>

                    {issue.sourceMessageIds &&
                      issue.sourceMessageIds.length > 0 && (
                        <button
                          onClick={() =>
                            setActiveCitation({
                              title: issue.topic,
                              sourceMessageIds: issue.sourceMessageIds,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline shrink-0"
                        >
                          <span>Sources ({issue.sourceMessageIds.length})</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {issue.details}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Unresolved Topics */}
      {summary.unresolvedTopics.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950 dark:text-amber-200">
                Unresolved Topics & Open Questions
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Items that still need follow-up
              </p>
            </div>
          </div>

          <ul className="space-y-2">
            {summary.unresolvedTopics.map((topic, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-amber-900 dark:text-amber-200"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Important Dates & Actions */}
      {summary.importantDatesAndActions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Important Dates & Upcoming Actions
              </h3>
              <p className="text-xs text-slate-500">
                Deadlines, scheduled events, and actionable items
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {summary.importantDatesAndActions.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2.5 py-0.5 rounded-md">
                      {item.date}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.sourceMessageIds && item.sourceMessageIds.length > 0 && (
                  <button
                    onClick={() =>
                      setActiveCitation({
                        title: `${item.date} - ${item.description}`,
                        sourceMessageIds: item.sourceMessageIds,
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-400 hover:underline pt-2 self-start"
                  >
                    <span>View source ({item.sourceMessageIds.length})</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Ask The Chat Interactive Assistant */}
      <AskTheChat
        messages={allMessages}
        messagesMap={messagesMap}
        apiKey={apiKey}
        groupName={summary.metadata.groupName}
      />

      {/* Footer Navigation */}
      <div className="flex items-center justify-center gap-3 pt-6">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-5 py-2.5 rounded-xl transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Upload Another Chat</span>
        </button>
      </div>

      {/* Source Citation Modal */}
      {activeCitation && (
        <SourceCitationModal
          isOpen={Boolean(activeCitation)}
          onClose={() => setActiveCitation(null)}
          title={activeCitation.title}
          sourceMessageIds={activeCitation.sourceMessageIds}
          messagesMap={messagesMap}
        />
      )}
    </div>
  );
};
